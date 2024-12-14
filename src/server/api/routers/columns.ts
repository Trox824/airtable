// columns.ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ColumnType, PrismaClient } from "@prisma/client";

const validateTable = async (db: PrismaClient, tableId: string) => {
  const table = await db.table.findUnique({
    where: { id: tableId },
    select: { id: true, name: true },
  });

  if (!table) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Table not found",
    });
  }
  return table;
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

      return ctx.db.$transaction(async (tx) => {
        // Create the column
        const column = await tx.column.create({ data: input });

        // Create cells for all existing rows
        await tx.cell.createMany({
          data: (
            await tx.row.findMany({
              where: { tableId: input.tableId },
              select: { id: true },
            })
          ).map((row) => ({
            columnId: column.id,
            rowId: row.id,
            valueText: null,
            valueNumber: null,
          })),
        });

        // Fetch the newly created cells to return them
        const newCells = await tx.cell.findMany({
          where: { columnId: column.id },
          select: {
            id: true,
            rowId: true,
            valueText: true,
            valueNumber: true,
          },
        });

        return { column, cells: newCells };
      });
    }),

  getByTableId: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(({ ctx, input }) => {
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
    .mutation(({ ctx, input }) => {
      return ctx.db.column.update({
        where: { id: input.columnId },
        data: { name: input.name },
      });
    }),
});
