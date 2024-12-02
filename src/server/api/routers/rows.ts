import { Prisma, ColumnType, type Row } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Define more specific types
type Column = {
  type: ColumnType;
};

type Cell = {
  id: string;
  columnId: string;
  valueText: string | null;
  valueNumber: number | null;
  column: Column;
};

type RowWithCells = Omit<Row, "createdAt" | "updatedAt"> & {
  cells: Cell[];
  createdAt?: Date;
  updatedAt?: Date;
};

type PaginatedResponse = {
  items: RowWithCells[];
  nextCursor: string | undefined;
  totalCount: number;
};

export const rowsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        tableId: z.string(),
        sortConditions: z
          .array(
            z.object({
              columnId: z.string(),
              order: z.enum(["asc", "desc"]),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<RowWithCells> => {
      const tableExists = await ctx.db.table.findUnique({
        where: { id: input.tableId },
        include: {
          columns: true,
        },
      });

      if (!tableExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      if (!tableExists.columns.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Table has no columns",
        });
      }

      return ctx.db.$transaction(async (tx) => {
        const row = await tx.row.create({
          data: {
            tableId: input.tableId,
            cells: {
              create: tableExists.columns.map((column) => ({
                columnId: column.id,
                valueText: column.type === "Text" ? "" : null,
                valueNumber: null,
              })),
            },
          },
          include: {
            cells: {
              include: {
                column: {
                  select: {
                    type: true,
                  },
                },
              },
            },
          },
        });

        // If there are sort conditions, fetch the row with proper ordering
        if (input.sortConditions?.length) {
          const sortedRow = await tx.row.findUnique({
            where: {
              id: row.id,
            },
            include: {
              cells: {
                include: {
                  column: {
                    select: {
                      type: true,
                    },
                  },
                },
              },
            },
          });

          if (!sortedRow) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create row",
            });
          }

          return sortedRow;
        }

        return row;
      });
    }),

  totalCount: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }): Promise<number> => {
      return ctx.db.row.count({
        where: { tableId: input.tableId },
      });
    }),

  getByTableId: publicProcedure
    .input(
      z.object({
        tableId: z.string(),
        limit: z.number().min(1).max(1000).default(100),
        cursor: z.string().optional(),
        searchQuery: z.string().optional(),
        sortConditions: z
          .array(
            z.object({
              columnId: z.string(),
              order: z.enum(["asc", "desc"]),
            }),
          )
          .optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<PaginatedResponse> => {
      const { tableId, limit, cursor, searchQuery, sortConditions } = input;
      const where: Prisma.RowWhereInput = {
        tableId,
        ...(searchQuery
          ? {
              cells: {
                some: {
                  OR: [
                    {
                      valueText: {
                        contains: searchQuery,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                    {
                      valueNumber: !isNaN(parseFloat(searchQuery))
                        ? parseFloat(searchQuery)
                        : undefined,
                    },
                  ],
                },
              },
            }
          : {}),
        ...(cursor
          ? {
              id: {
                gt: cursor,
              },
            }
          : {}),
      };

      const totalCount = await ctx.db.row.count({
        where,
      });

      // Build the orderBy clause based on sort conditions
      const orderBy: Prisma.RowOrderByWithRelationInput[] =
        sortConditions && sortConditions.length > 0
          ? [
              {
                cells: {
                  _count: sortConditions[0]?.order,
                },
              },
              { id: "asc" as const }, // secondary sort to ensure consistent ordering
            ]
          : [{ id: "asc" as const }];

      const items = await ctx.db.row.findMany({
        where,
        take: limit + 1,
        orderBy,
        include: {
          cells: {
            include: {
              column: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      });

      // Sort the items after fetching them
      const sortedItems =
        sortConditions && sortConditions.length > 0
          ? items.sort((a, b) => {
              const aCell = a.cells.find(
                (cell) => cell.columnId === sortConditions[0]?.columnId,
              );
              const bCell = b.cells.find(
                (cell) => cell.columnId === sortConditions[0]?.columnId,
              );

              const aValue =
                aCell?.valueText ?? aCell?.valueNumber?.toString() ?? "";
              const bValue =
                bCell?.valueText ?? bCell?.valueNumber?.toString() ?? "";

              return sortConditions[0]?.order === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            })
          : items;

      let nextCursor: string | undefined;
      if (sortedItems.length > limit) {
        const nextItem = sortedItems.pop()!;
        nextCursor = nextItem.id;
      }

      const transformedItems: RowWithCells[] = sortedItems.map((item) => ({
        id: item.id,
        tableId: item.tableId,
        cells: item.cells.map((cell) => ({
          id: cell.id,
          columnId: cell.columnId,
          valueText: cell.valueText,
          valueNumber: cell.valueNumber,
          column: {
            type: cell.column.type,
          },
        })),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      return {
        items: transformedItems,
        nextCursor,
        totalCount,
      };
    }),
});
