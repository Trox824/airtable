import { ColumnType } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// First, define the expected types
type Cell = {
  id: string;
  columnId: string;
  rowId: string;
  valueText: string | null;
  valueNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
  column: {
    id: string;
    tableId: string;
    name: string;
    type: ColumnType;
    createdAt: Date;
    updatedAt: Date;
  };
};

export const rowsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const columns = await tx.column.findMany({
          where: { tableId: input.tableId },
        });
        const row = await tx.row.create({
          data: {
            tableId: input.tableId,
            cells: {
              create: columns.map((column) => ({
                columnId: column.id,
                valueText: null,
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
        return row;
      });
    }),

  getByTableId: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.row.findMany({
        where: { tableId: input.tableId },
        include: {
          cells: {
            include: {
              column: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      return rows;
    }),
});
