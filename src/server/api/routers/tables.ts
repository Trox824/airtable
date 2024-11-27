import { TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient } from "@prisma/client";

// Helper functions
const validateTable = async (db: PrismaClient, tableId: string) => {
  const table = await db.table.findFirst({
    where: { id: tableId },
    select: {
      id: true,
      name: true,
    },
  });
  if (!table) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Table not found",
    });
  }
  return table as { id: string; name: string };
};
export const tablesRouter = createTRPCRouter({
  create: publicProcedure
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
      return ctx.db.$transaction(async (tx) => {
        const table = await tx.table.create({
          data: {
            baseId: input.baseId,
            name: input.name,
          },
        });
        return table;
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
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const table = await validateTable(ctx.db, input.id);
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
            data: createdRows.flatMap((row) =>
              createdColumns.map((column) => ({
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
          };
        },
        {
          timeout: 10000, // Increase timeout to 10 seconds
        },
      );
    }),
});
