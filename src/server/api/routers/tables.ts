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
      return ctx.db.$transaction(async (tx) => {
        // Create the table
        const table = await tx.table.create({
          data: {
            baseId: input.baseId,
            name: input.name,
          },
        });
        // Create initial columns in bulk
        // const columns = await tx.column.createMany({
        //   data: Array(2).fill({
        //     name: "Untitled Column",
        //     tableId: table.id,
        //     type: "Text",
        //   }),
        // });
        // Get the created column IDs
        const columnIds = await tx.column.findMany({
          where: { tableId: table.id },
          select: { id: true },
        });
        // Create rows in bulk
        await tx.row.createMany({
          data: Array(4).fill({ tableId: table.id }),
        });

        // Get the created row IDs
        const rowIds = await tx.row.findMany({
          where: { tableId: table.id },
          select: { id: true },
        });

        // Create all cells in a single bulk operation
        await tx.cell.createMany({
          data: rowIds.flatMap((row) =>
            columnIds.map((col) => ({
              rowId: row.id,
              columnId: col.id,
              valueText: "",
            })),
          ),
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
});
