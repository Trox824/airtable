import {
  Prisma,
  FilterOperator,
  ColumnType,
  Row,
  Cell as PrismaCell,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Define RowWithCells using Prisma's types for better integration
type RowWithCells = Prisma.RowGetPayload<{
  include: {
    cells: {
      include: {
        column: { select: { type: true } };
      };
    };
  };
}>;

type PaginatedResponse = {
  items: RowWithCells[];
  nextCursor?: string;
  totalCount: number;
};

// Utility to parse numeric values safely
const parseNumber = (value?: string) => (value ? parseFloat(value) : undefined);

// Simplified filter condition builder
const buildFilterCondition = ({
  operator,
  value,
}: {
  operator: FilterOperator;
  value?: string | null;
}): Prisma.CellWhereInput => {
  switch (operator) {
    case FilterOperator.Contains:
      return { valueText: { contains: value ?? "", mode: "insensitive" } };
    case FilterOperator.Equals:
      return {
        OR: [
          { valueText: value ?? "" },
          { valueNumber: value ? parseNumber(value) : null },
        ],
      };
    case FilterOperator.GreaterThan:
      return { valueNumber: { gt: parseNumber(value ?? undefined) } };
    case FilterOperator.SmallerThan:
      return { valueNumber: { lt: parseNumber(value ?? undefined) } };
    case FilterOperator.IsEmpty:
      return { valueText: "", valueNumber: null };
    case FilterOperator.IsNotEmpty:
      return {
        OR: [{ valueText: { not: "" } }, { valueNumber: { not: null } }],
      };
    default:
      return {};
  }
};

export const rowsRouter = createTRPCRouter({
  // Create a new row
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
      const table = await ctx.db.table.findUnique({
        where: { id: input.tableId },
        include: { columns: true },
      });

      if (!table) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Table not found" });
      }

      if (table.columns.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Table has no columns",
        });
      }

      const row = await ctx.db.$transaction(async (tx) => {
        const createdRow = await tx.row.create({
          data: {
            tableId: input.tableId,
            cells: {
              create: table.columns.map((column) => ({
                columnId: column.id,
                valueText: column.type === ColumnType.Text ? "" : null,
                valueNumber: null,
              })),
            },
          },
          include: {
            cells: { include: { column: { select: { type: true } } } },
          },
        });

        if (input.sortConditions?.length) {
          const sortedRow = await tx.row.findUnique({
            where: { id: createdRow.id },
            include: {
              cells: { include: { column: { select: { type: true } } } },
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

        return createdRow;
      });

      return row;
    }),

  // Get total count of rows in a table
  totalCount: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(({ ctx, input }): Promise<number> => {
      return ctx.db.row.count({ where: { tableId: input.tableId } });
    }),

  // Get rows by table ID with pagination, sorting, and filtering
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
        filterConditions: z
          .array(
            z.object({
              columnId: z.string(),
              operator: z.nativeEnum(FilterOperator),
              value: z.string().nullable().optional(),
            }),
          )
          .optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<PaginatedResponse> => {
      const {
        tableId,
        limit,
        cursor,
        searchQuery,
        sortConditions,
        filterConditions,
      } = input;

      // Build where clause
      const where: Prisma.RowWhereInput = {
        tableId,
        ...(cursor && { id: { gt: cursor } }),
        ...(searchQuery && {
          cells: {
            some: {
              OR: [
                { valueText: { contains: searchQuery, mode: "insensitive" } },
                {
                  valueNumber: !isNaN(parseNumber(searchQuery)!)
                    ? { equals: parseNumber(searchQuery) }
                    : undefined,
                },
              ],
            },
          },
        }),
        ...(filterConditions?.length && {
          AND: filterConditions.map(({ columnId, ...filter }) => ({
            cells: { some: { columnId, ...buildFilterCondition(filter) } },
          })),
        }),
      };

      // Build orderBy clause
      const orderBy: Prisma.RowOrderByWithRelationInput[] =
        sortConditions?.map(({ columnId, order }) => ({
          cells: { _count: order },
        })) ?? [];
      orderBy.push({ id: "asc" });

      // Fetch total count
      const totalCount = await ctx.db.row.count({ where });

      // Fetch rows with pagination
      const rows = await ctx.db.row.findMany({
        where,
        take: limit + 1,
        orderBy,
        include: {
          cells: { include: { column: { select: { type: true } } } },
        },
      });

      // Determine next cursor
      let nextCursor: string | undefined;
      if (rows.length > limit) {
        const nextItem = rows.pop()!;
        nextCursor = nextItem.id;
      }

      return {
        items: rows as RowWithCells[],
        nextCursor,
        totalCount,
      };
    }),
});
