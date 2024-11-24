import { TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { authOptions } from "~/server/auth";
import { ColumnType } from "@prisma/client";

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
      const table = await ctx.db.table.findUnique({
        where: { id: input.tableId },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return ctx.db.column.create({
        data: input,
      });
    }),

  getByTableId: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.column.findMany({
        where: {
          tableId: input.tableId,
        },
        orderBy: { createdAt: "asc" },
      });
    }),
});
