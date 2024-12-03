import { TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

// Add this interface at the top of the file
interface TableCreateInput {
  baseId: string;
  name: string;
  view?: {
    id: string;
    name: string;
  };
}

const validateTable = async (db: PrismaClient, tableId: string) => {
  console.log("Validating table:", tableId);
  const table = await db.table.findUnique({
    where: { id: tableId },
  });

  if (!table) {
    console.log("Table not found in validation");
    throw new Error("Table not found");
  }

  console.log("Table validated successfully:", table);
  return table;
};

// Helper function to create COALESCE-based ordering
const createOrderByWithNulls = (field: string, direction: "asc" | "desc") => {
  return [
    // First sort by whether the field is null (nulls last)
    { [field]: { sort: direction, nulls: "last" } },
  ];
};

export const tablesRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        baseId: z.string(),
        name: z.string().min(1),
        view: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseExists = await ctx.db.base.findUnique({
        where: { id: input.baseId },
      });
      if (!baseExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Base ID not found",
        });
      }

      return ctx.db.$transaction(async (tx) => {
        // Create table with nested view creation
        const table = await tx.table.create({
          data: {
            baseId: input.baseId,
            name: input.name,
            views: {
              create: {
                name: "Grid view",
              },
            },
          },
          include: {
            views: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Create two columns
        await tx.column.createMany({
          data: [
            {
              tableId: table.id,
              name: "Text Column",
              type: "Text",
            },
            {
              tableId: table.id,
              name: "Number Column",
              type: "Number",
            },
          ],
        });

        // Get the created columns to access their IDs
        const createdColumns = await tx.column.findMany({
          where: { tableId: table.id },
          orderBy: { createdAt: "asc" },
        });

        // Create two rows
        await tx.row.createMany({
          data: [{ tableId: table.id }, { tableId: table.id }],
        });

        // Get the created rows to access their IDs
        const createdRows = await tx.row.findMany({
          where: { tableId: table.id },
          orderBy: { createdAt: "asc" },
        });

        // Create cells for each row-column combination
        await tx.cell.createMany({
          data: createdRows.flatMap((row) =>
            createdColumns.map((column) => ({
              rowId: row.id,
              columnId: column.id,
              valueText: column.type === "Text" ? "" : null,
              valueNumber: column.type === "Number" ? null : null,
            })),
          ),
        });

        return {
          ...table,
          view: table.views[0], // Return the first view as the default
        };
      });
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await validateTable(ctx.db, input.id);
      return ctx.db.table.delete({
        where: { id: input.id },
      });
    }),
  deleteMany: publicProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      await Promise.all(input.map((id) => validateTable(ctx.db, id)));
      return ctx.db.table.deleteMany({
        where: {
          id: { in: input },
        },
      });
    }),
  getByBaseId: publicProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.table.findMany({
        where: { baseId: input.baseId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          baseId: true,
          views: {
            select: {
              id: true,
              name: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          _count: {
            select: {
              columns: true,
              rows: true,
            },
          },
        },
      });
    }),
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
        viewId: z.string().optional(),
        sortField: z.string().optional(),
        sortDirection: z.enum(["asc", "desc"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.table.findUnique({
        where: { id: input.id },
        include: {
          rows: {
            include: {
              cells: {
                include: {
                  column: true,
                },
              },
            },
            orderBy: input.sortField
              ? createOrderByWithNulls(
                  `cells.${input.sortField}`,
                  input.sortDirection ?? "asc",
                )
              : { createdAt: "asc" },
          },
          views: {
            select: {
              id: true,
              name: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      // If viewId is provided, verify it belongs to this table
      if (input.viewId && !table.views.some((v) => v.id === input.viewId)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "View not found for this table",
        });
      }

      return table;
    }),
  needsInitialization: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.table.findFirst({
        where: { id: input.tableId },
      });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await validateTable(ctx.db, input.id);
      return ctx.db.table.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),
  initialize: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First validate that the table exists
      const table = await validateTable(ctx.db, input.tableId);
      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }
      return ctx.db.$transaction(
        async (tx) => {
          // Create default view
          const view = await tx.view.create({
            data: {
              tableId: input.tableId,
              name: "Grid view",
            },
          });

          // Create 2 default columns in a single query
          await tx.column.createMany({
            data: [
              {
                tableId: input.tableId,
                name: "Untitled Column",
                type: "Text",
              },
              {
                tableId: input.tableId,
                name: "Untitled Column",
                type: "Text",
              },
            ],
          });
          // Get the created columns
          const createdColumns = await tx.column.findMany({
            where: { tableId: input.tableId },
            orderBy: { createdAt: "asc" },
          });
          // Create 4 rows
          await tx.row.createMany({
            data: Array.from({ length: 4 }).map(() => ({
              tableId: input.tableId,
            })),
          });

          // Get the created rows
          const createdRows = await tx.row.findMany({
            where: { tableId: input.tableId },
            orderBy: { createdAt: "desc" },
            take: 4,
          });
          await tx.cell.createMany({
            data: createdRows.flatMap((row: { id: string }) =>
              createdColumns.map((column: { id: string }) => ({
                rowId: row.id,
                columnId: column.id,
                valueText: null,
                valueNumber: null,
              })),
            ),
          });

          return {
            columns: createdColumns,
            rows: await tx.row.findMany({
              where: { id: { in: createdRows.map((r) => r.id) } },
              include: {
                cells: {
                  include: {
                    column: true,
                  },
                },
              },
            }),
            view: view,
          };
        },
        {
          timeout: 300000,
        },
      );
    }),
  createWithDefaults: publicProcedure
    .input(
      z.object({
        baseId: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseExists = await ctx.db.base.findUnique({
        where: { id: input.baseId },
      });
      if (!baseExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Base ID not found",
        });
      }

      return ctx.db.$transaction(
        async (tx) => {
          // Create table with nested view creation
          const table = await tx.table.create({
            data: {
              baseId: input.baseId,
              name: input.name,
              views: {
                create: {
                  name: "Grid view",
                },
              },
            },
            include: {
              views: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          const columnNames = [
            "Name",
            "Email",
            "Phone",
            "Address",
            "Company",
            "Department",
            "Title",
          ];
          await tx.column.createMany({
            data: columnNames.map((name) => ({
              tableId: table.id,
              name,
              type: "Text",
            })),
          });

          const createdColumns = await tx.column.findMany({
            where: { tableId: table.id },
            orderBy: { createdAt: "asc" },
          });

          // Create rows in smaller batches
          const BATCH_SIZE = 100;
          const TOTAL_ROWS = 1000;

          for (let i = 0; i < TOTAL_ROWS; i += BATCH_SIZE) {
            await tx.row.createMany({
              data: Array.from({
                length: Math.min(BATCH_SIZE, TOTAL_ROWS - i),
              }).map(() => ({
                tableId: table.id,
              })),
            });
          }

          const createdRows = await tx.row.findMany({
            where: { tableId: table.id },
            orderBy: { createdAt: "asc" },
          });

          // Create cells in smaller batches
          const cellData = createdRows.flatMap((row) =>
            createdColumns.map((column) => ({
              rowId: row.id,
              columnId: column.id,
              valueText: generateFakeData(column.name),
              valueNumber: null,
            })),
          );

          // Insert cells in batches of 1000
          const CELL_BATCH_SIZE = 1000;
          for (let i = 0; i < cellData.length; i += CELL_BATCH_SIZE) {
            await tx.cell.createMany({
              data: cellData.slice(i, i + CELL_BATCH_SIZE),
            });
          }

          return {
            ...table,
            view: table.views[0], // Return the first view as the default
          };
        },
        {
          timeout: 300000,
        },
      );
    }),
});

// Helper function to generate fake data based on column name
const generateFakeData = (columnName: string): string => {
  switch (columnName.toLowerCase()) {
    case "name":
      return faker.person.fullName();
    case "email":
      return faker.internet.email();
    case "phone":
      return faker.phone.number();
    case "address":
      return faker.location.streetAddress();
    case "company":
      return faker.company.name();
    case "department":
      return faker.commerce.department();
    case "title":
      return faker.person.jobTitle();
    default:
      return faker.lorem.words(2);
  }
};
