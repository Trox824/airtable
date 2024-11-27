import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ColumnType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
// Helper function to validate table existence
const validateTable = async (db: PrismaClient, tableId: string) => {
  const table = await db.table.findUnique({
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

export const columnsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string().min(1),
        type: z.enum([ColumnType.Text, ColumnType.Number]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await validateTable(ctx.db, input.tableId);
      return ctx.db.column.create({ data: input });
    }),

  getByTableId: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.column.findMany({
        where: { tableId: input.tableId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });
    }),

  rename: publicProcedure
    .input(
      z.object({
        columnId: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.column.update({
        where: { id: input.columnId },
        data: { name: input.name },
      });
    }),
});
