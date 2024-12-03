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
import { Sql } from "@prisma/client/runtime/library";

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
      const params: (string | number)[] = [tableId];
      let paramIndex = 2; // Starting from $2 since $1 is tableId

      // Start building the WHERE clause
      let whereClause = `WHERE r."tableId" = $1`;

      // Handle filter conditions
      if (filterConditions && filterConditions.length > 0) {
        filterConditions.forEach((filter, index) => {
          const { columnId, operator, value } = filter;
          const cAlias = `c_filter${index}`;
          params.push(columnId);
          let condition = "";
          let paramsAdded = 1; // We have added columnId

          switch (operator) {
            case FilterOperator.Contains:
              params.push(`%${value ?? ""}%`);
              condition = `${cAlias}."columnId" = $${paramIndex} AND ${cAlias}."valueText" ILIKE $${paramIndex + 1}`;
              paramsAdded += 1;
              break;
            case FilterOperator.Equals:
              params.push(value ?? "");
              condition = `${cAlias}."columnId" = $${paramIndex} AND (${cAlias}."valueText" = $${paramIndex + 1} OR ${cAlias}."valueNumber" = $${paramIndex + 1}::float)`;
              paramsAdded += 1;
              break;
            case FilterOperator.GreaterThan:
              params.push(parseNumber(value ?? undefined) ?? 0);
              condition = `${cAlias}."columnId" = $${paramIndex} AND ${cAlias}."valueNumber" > $${paramIndex + 1}`;
              paramsAdded += 1;
              break;
            case FilterOperator.SmallerThan:
              params.push(parseNumber(value ?? undefined) ?? 0);
              condition = `${cAlias}."columnId" = $${paramIndex} AND ${cAlias}."valueNumber" < $${paramIndex + 1}`;
              paramsAdded += 1;
              break;
            case FilterOperator.IsEmpty:
              condition = `${cAlias}."columnId" = $${paramIndex} AND ${cAlias}."valueText" = '' AND ${cAlias}."valueNumber" IS NULL`;
              // paramsAdded remains 1
              break;
            case FilterOperator.IsNotEmpty:
              condition = `${cAlias}."columnId" = $${paramIndex} AND (${cAlias}."valueText" != '' OR ${cAlias}."valueNumber" IS NOT NULL)`;
              // paramsAdded remains 1
              break;
            default:
              condition = "TRUE";
            // paramsAdded remains 1
          }

          whereClause += ` AND EXISTS (
          SELECT 1 FROM "Cell" ${cAlias}
          WHERE ${cAlias}."rowId" = r.id AND ${condition}
        )`;

          paramIndex += paramsAdded;
        });
      }

      // Handle search query (optional)
      if (searchQuery) {
        params.push(`%${searchQuery}%`);
        const cAlias = `c_search`;
        whereClause += ` AND EXISTS (
        SELECT 1 FROM "Cell" ${cAlias}
        WHERE ${cAlias}."rowId" = r.id AND (${cAlias}."valueText" ILIKE $${paramIndex} OR CAST(${cAlias}."valueNumber" AS TEXT) ILIKE $${paramIndex})
      )`;
        paramIndex += 1;
      }

      // Start building the ORDER BY clause
      let orderByClause = "";
      const joinClauses: string[] = [];
      const orderByConditions: string[] = [];

      if (sortConditions && sortConditions.length > 0) {
        sortConditions.forEach((sort, index) => {
          const sortAlias = `s${index}`;
          joinClauses.push(`
          LEFT JOIN "Cell" ${sortAlias}
            ON ${sortAlias}."rowId" = r.id AND ${sortAlias}."columnId" = $${paramIndex}
        `);
          params.push(sort.columnId);
          orderByConditions.push(`
          CASE 
            WHEN ${sortAlias}."valueNumber" IS NOT NULL 
            THEN CAST(${sortAlias}."valueNumber" AS TEXT)
            ELSE COALESCE(${sortAlias}."valueText", '')
          END ${sort.order.toUpperCase()}
        `);
          paramIndex += 1;
        });
      }

      // Default ordering if no sort conditions provided
      if (orderByConditions.length === 0) {
        orderByConditions.push(`r.id ASC`);
      }

      orderByClause = `ORDER BY ${orderByConditions.join(", ")}`;

      // Handle cursor for pagination (UPDATED)
      if (cursor) {
        params.push(cursor);
        // Changed from > to >= to include the cursor row
        whereClause += ` AND (
          CASE 
            WHEN r.id = $${paramIndex} THEN false 
            WHEN r.id > $${paramIndex} THEN true
            ELSE false 
          END
        )`;
        paramIndex += 1;
      }

      // Build the SQL query
      const sql = `
      SELECT 
        r.id,
        r."tableId",
        r."createdAt",
        r."updatedAt",
        COALESCE(json_agg(
          json_build_object(
            'id', c.id,
            'valueText', c."valueText",
            'valueNumber', c."valueNumber",
            'columnId', c."columnId",
            'column', json_build_object('type', col.type),
            'rowId', c."rowId",
            'createdAt', c."createdAt",
            'updatedAt', c."updatedAt"
          ) 
          ORDER BY c."columnId"
        ) FILTER (WHERE c.id IS NOT NULL), '[]') AS cells,
        ${
          sortConditions
            ?.map(
              (_, index) => `
            MAX(CASE 
              WHEN s${index}."valueNumber" IS NOT NULL 
              THEN CAST(s${index}."valueNumber" AS TEXT)
              ELSE COALESCE(s${index}."valueText", '')
            END) as sort_value_${index}
          `,
            )
            .join(", ") ?? "NULL as sort_value_0"
        }
      FROM "Row" r
      LEFT JOIN "Cell" c ON c."rowId" = r.id
      LEFT JOIN "Column" col ON c."columnId" = col.id
      ${joinClauses.join(" ")}
      ${whereClause}
      GROUP BY r.id, r."tableId", r."createdAt", r."updatedAt"
      ORDER BY ${
        sortConditions
          ?.map(
            (sort, index) => `sort_value_${index} ${sort.order.toUpperCase()}`,
          )
          .join(", ") ?? "r.id ASC"
      }
      LIMIT $${paramIndex}::integer
    `;

      // Modify the LIMIT clause to fetch one extra row (UPDATED)
      const fetchLimit = limit + 1;
      params.push(fetchLimit);

      try {
        // Execute the query with the correct number of parameters
        const rows: (Row & { cells: PrismaCell[] })[] =
          await ctx.db.$queryRawUnsafe(sql, ...params);

        // Determine if there's a next page (UPDATED)
        let nextCursor: string | undefined;
        if (rows.length > limit) {
          // Remove the extra row we fetched
          const nextItem = rows.pop()!;
          nextCursor = nextItem.id;
        }

        // Get total count (optional, can be optimized)
        const totalCount = await ctx.db.row.count({ where: { tableId } });

        // Map rows to include cells with column type
        const items: RowWithCells[] = rows.map((row) => ({
          ...row,
          cells: (row.cells || []).map((cell) => ({
            ...cell,
            column: {
              type:
                cell.valueNumber !== null ? ColumnType.Number : ColumnType.Text,
            },
          })),
        }));

        return {
          items,
          nextCursor,
          totalCount,
        };
      } catch (error) {
        console.error("Error executing raw query:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch rows.",
        });
      }
    }),
});
