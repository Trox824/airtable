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

// Modify the RowWithCells type to make createdAt and updatedAt optional
type RowWithCells = Omit<Row, "createdAt" | "updatedAt"> & {
  cells: Cell[];
  createdAt?: Date;
  updatedAt?: Date;
};

// Define the response type for pagination
type PaginatedResponse = {
  items: RowWithCells[];
  nextCursor: string | undefined;
  totalCount: number;
};

export const rowsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }): Promise<RowWithCells> => {
      // First verify the table exists
      const tableExists = await ctx.db.table.findUnique({
        where: { id: input.tableId },
        include: {
          columns: true, // Include columns to verify we have columns to create cells for
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
        // Create the row with cells
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
                column: true,
              },
            },
          },
        });

        // Verify cells were created by fetching the row again
        const verifiedRow = await tx.row.findUnique({
          where: { id: row.id },
          include: {
            cells: {
              include: {
                column: true,
              },
            },
          },
        });

        if (!verifiedRow?.cells.length) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create cells",
          });
        }

        return verifiedRow;
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
      }),
    )
    .query(async ({ ctx, input }): Promise<PaginatedResponse> => {
      const { tableId, limit, cursor, searchQuery } = input;

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

      const items = await ctx.db.row.findMany({
        where,
        take: limit + 1,
        orderBy: {
          id: "asc",
        },
        include: {
          cells: {
            include: {
              column: {
                select: {
                  type: true, // Only select what we need for the Column type
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop()!;
        nextCursor = nextItem.id;
      }

      // Transform the items to match RowWithCells type
      const transformedItems: RowWithCells[] = items.map((item) => ({
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
