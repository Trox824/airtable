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
};

// Utility to parse numeric values safely
const parseNumber = (value?: string) => (value ? parseFloat(value) : undefined);

// Define input type for better type safety
const createRowInput = z.object({
  tableId: z.string(),
  sortConditions: z
    .array(
      z.object({
        columnId: z.string(),
        order: z.enum(["asc", "desc"]),
      }),
    )
    .optional(),
});

export const rowsRouter = createTRPCRouter({
  create: publicProcedure
    .input(createRowInput)
    .mutation(async ({ ctx, input }): Promise<RowWithCells> => {
      try {
        return await ctx.db.$transaction(
          async (tx) => {
            // 1. Get table with columns first
            const table = await tx.table.findUnique({
              where: { id: input.tableId },
              include: { columns: true },
            });

            if (!table) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Table not found",
              });
            }

            if (table.columns.length === 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Table has no columns",
              });
            }

            // 2. Create row with cells in one transaction
            const createdRow = await tx.row.create({
              data: {
                tableId: input.tableId,
                cells: {
                  create: table.columns.map((column) => ({
                    columnId: column.id,
                    valueText: null,
                    valueNumber: null,
                  })),
                },
              },
              include: {
                cells: {
                  include: {
                    column: {
                      select: { type: true },
                    },
                  },
                },
              },
            });

            // If sort conditions exist, initialize sorted columns with appropriate values
            if (input.sortConditions?.length) {
              const cellUpdates = input.sortConditions.map(async (sort) => {
                const column = table.columns.find(
                  (col) => col.id === sort.columnId,
                );
                if (!column) return;

                // Find the existing cell for this column
                const cell = createdRow.cells.find(
                  (c) => c.columnId === sort.columnId,
                );
                if (!cell) return;
                await tx.cell.update({
                  where: { id: cell.id },
                  data: {
                    valueText: column.type === ColumnType.Text ? null : null,
                    valueNumber:
                      column.type === ColumnType.Number ? null : null,
                  },
                });
              });

              await Promise.all(cellUpdates);

              // Fetch the updated row
              const sortedRow = await tx.row.findUnique({
                where: { id: createdRow.id },
                include: {
                  cells: {
                    include: {
                      column: {
                        select: { type: true },
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

            return createdRow;
          },
          {
            timeout: 30000, // Increased from 10s to 30s
            maxWait: 35000, // Add maxWait to ensure we don't wait too long for a transaction slot
          },
        );
      } catch (error) {
        console.error("Row creation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to create row",
        });
      }
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
        limit: z.number().min(1).max(1000).default(200),
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
      let paramIndex = 2; // $1 is tableId

      // Base WHERE clause
      let whereClause = `WHERE r."tableId" = $1`;

      // Handle filter conditions
      if (filterConditions && filterConditions.length > 0) {
        filterConditions.forEach((filter, index) => {
          const { columnId, operator, value } = filter;
          const cAlias = `c_filter${index}`;
          params.push(columnId);
          let condition = "";
          let paramsAdded = 1; // We added columnId

          switch (operator) {
            case FilterOperator.Contains:
              params.push(`%${value ?? ""}%`);
              condition = `${cAlias}."columnId" = $${paramIndex} AND ${cAlias}."valueText" ILIKE $${paramIndex + 1}`;
              paramsAdded++;
              break;
            case FilterOperator.Equals:
              params.push(value ?? "");
              condition = `${cAlias}."columnId" = $${paramIndex} AND (${cAlias}."valueText" = $${paramIndex + 1} OR ${cAlias}."valueNumber" = $${paramIndex + 1}::float)`;
              paramsAdded++;
              break;
            case FilterOperator.GreaterThan:
              params.push(parseNumber(value ?? undefined) ?? 0);
              condition = `${cAlias}."columnId" = $${paramIndex} AND ${cAlias}."valueNumber" > $${paramIndex + 1}`;
              paramsAdded++;
              break;
            case FilterOperator.SmallerThan:
              params.push(parseNumber(value ?? undefined) ?? 0);
              condition = `${cAlias}."columnId" = $${paramIndex} AND ${cAlias}."valueNumber" < $${paramIndex + 1}`;
              paramsAdded++;
              break;
            case FilterOperator.IsEmpty:
              condition = `${cAlias}."columnId" = $${paramIndex} AND (${cAlias}."valueText" IS NULL OR ${cAlias}."valueText" = '')`;
              break;
            case FilterOperator.IsNotEmpty:
              condition = `${cAlias}."columnId" = $${paramIndex} AND ${cAlias}."valueText" IS NOT NULL AND ${cAlias}."valueText" != ''`;
              break;
            default:
              condition = "TRUE";
          }

          whereClause += ` AND EXISTS (
          SELECT 1 FROM "Cell" ${cAlias}
          WHERE ${cAlias}."rowId" = r.id AND ${condition}
        )`;

          paramIndex += paramsAdded;
        });
      }

      // Handle search query
      if (searchQuery) {
        params.push(`%${searchQuery}%`);
        const cAlias = `c_search`;
        whereClause += ` AND EXISTS (
        SELECT 1 FROM "Cell" ${cAlias}
        WHERE ${cAlias}."rowId" = r.id 
          AND (${cAlias}."valueText" ILIKE $${paramIndex} 
            OR CAST(${cAlias}."valueNumber" AS TEXT) ILIKE $${paramIndex})
      )`;
        paramIndex++;
      }

      // Handle cursor for pagination: simplify by directly using r.id > cursor
      if (cursor) {
        params.push(cursor);
        whereClause += ` AND r.id > $${paramIndex}`;
        paramIndex++;
      }

      // Fetch column types first for proper sort handling
      const columns = await ctx.db.column.findMany({
        where: { tableId },
        select: { id: true, type: true },
      });

      // Handle sorting with type-aware conditions
      const joinClauses: string[] = [];
      const orderByConditions: string[] = [];

      if (sortConditions && sortConditions.length > 0) {
        sortConditions.forEach((sort, index) => {
          const sortAlias = `s${index}`;
          const column = columns.find((col) => col.id === sort.columnId);

          joinClauses.push(`
            LEFT JOIN "Cell" ${sortAlias}
              ON ${sortAlias}."rowId" = r.id AND ${sortAlias}."columnId" = $${paramIndex}
          `);
          params.push(sort.columnId);

          // Use appropriate sorting based on column type
          if (column?.type === ColumnType.Number) {
            orderByConditions.push(
              `MAX(${sortAlias}."valueNumber") ${sort.order.toUpperCase()} ${
                sort.order === "asc" ? "NULLS FIRST" : "NULLS LAST"
              }`,
            );
          } else {
            orderByConditions.push(
              `COALESCE(MAX(${sortAlias}."valueText"), '') ${sort.order.toUpperCase()}`,
            );
          }

          paramIndex++;
        });
      } else {
        // Default ordering by r.id if no sort given
        orderByConditions.push(`r.id ASC`);
      }

      const orderByClause = `ORDER BY ${orderByConditions.join(", ")}`;

      // Increase limit by one to detect next page
      const fetchLimit = limit + 1;
      params.push(fetchLimit);
      const limitParam = paramIndex++;

      const sql = `
      SELECT 
        r.id,
        r."tableId",
        COALESCE(json_agg(
          json_build_object(
            'id', c.id,
            'valueText', c."valueText",
            'valueNumber', c."valueNumber",
            'columnId', c."columnId",
            'rowId', c."rowId"
          )
        ) FILTER (WHERE c.id IS NOT NULL), '[]') AS cells
      FROM "Row" r
      LEFT JOIN "Cell" c ON c."rowId" = r.id
      ${joinClauses.join(" ")}
      ${whereClause}
      GROUP BY r.id, r."tableId"
      ${orderByConditions.length ? `ORDER BY ${orderByConditions.join(", ")}` : "ORDER BY r.id ASC"}
      LIMIT $${limitParam}::integer
      `;

      try {
        const rows: (Row & { cells: PrismaCell[] })[] =
          await ctx.db.$queryRawUnsafe(sql, ...params);

        let nextCursor: string | undefined;
        if (rows.length > limit) {
          const nextItem = rows.pop()!;
          nextCursor = nextItem.id;
        }

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
