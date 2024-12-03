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
      // 1. Build basic where clause
      const where: Prisma.RowWhereInput = {
        tableId: input.tableId,
        ...(input.cursor && { id: { gt: input.cursor } }),
      };

      // 2. Add search condition if provided
      if (input.searchQuery) {
        where.cells = {
          some: {
            OR: [
              {
                valueText: { contains: input.searchQuery, mode: "insensitive" },
              },
              {
                valueNumber: !isNaN(parseFloat(input.searchQuery))
                  ? { equals: parseFloat(input.searchQuery) }
                  : undefined,
              },
            ],
          },
        };
      }

      // 3. Add filter conditions if provided
      if (input.filterConditions?.length) {
        where.AND = input.filterConditions.map(({ columnId, ...filter }) => ({
          cells: { some: { columnId, ...buildFilterCondition(filter) } },
        }));
      }

      // 4. Build sort expression that will be used in both SELECT and ORDER BY
      const sortExpressions =
        input.sortConditions?.map(
          (sort, index) => `
        (SELECT COALESCE("valueNumber"::text, "valueText", '')
        FROM "Cell" c
        WHERE c."columnId" = '${sort.columnId}'
        AND c."rowId" = r.id
        LIMIT 1) as sort_value_${index}
      `,
        ) ?? [];

      const orderByClause = input.sortConditions?.length
        ? input.sortConditions
            .map(
              (sort, index) => `sort_value_${index} ${sort.order} NULLS LAST`,
            )
            .join(", ")
        : "r.id ASC";

      // 5. Fetch data using PostgreSQL-specific query
      const [totalCount, rows] = await Promise.all([
        ctx.db.row.count({ where }),
        ctx.db.$queryRaw<RowWithCells[]>`
          WITH sorted_rows AS (
            SELECT DISTINCT 
              r.id,
              r."tableId",
              r."createdAt",
              r."updatedAt"
              ${
                sortExpressions.length
                  ? Prisma.sql`, ${Prisma.sql([sortExpressions.join(", ")])}`
                  : Prisma.empty
              }
            FROM "Row" r
            WHERE r."tableId" = ${input.tableId}
            ${input.cursor ? Prisma.sql`AND r.id > ${input.cursor}` : Prisma.empty}
            ORDER BY ${Prisma.sql([orderByClause])}
            LIMIT ${input.limit + 1}
          )
          SELECT 
            r.id,
            r."tableId",
            r."createdAt",
            r."updatedAt",
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'id', c.id,
                  'rowId', c."rowId",
                  'columnId', c."columnId",
                  'valueText', c."valueText",
                  'valueNumber', c."valueNumber",
                  'column', jsonb_build_object('type', col.type)
                )
              ) FILTER (WHERE c.id IS NOT NULL),
              '[]'::jsonb
            ) as cells
          FROM sorted_rows r
          LEFT JOIN "Cell" c ON c."rowId" = r.id
          LEFT JOIN "Column" col ON col.id = c."columnId"
          GROUP BY r.id, r."tableId", r."createdAt", r."updatedAt"
        `,
      ]);

      // 6. Handle pagination
      let nextCursor: string | undefined;
      if (rows.length > input.limit) {
        const nextItem = rows.pop()!;
        nextCursor = nextItem.id;
      }

      return {
        items: rows,
        nextCursor,
        totalCount,
      };
    }),
});
