import { TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { authOptions } from "~/server/auth";

export const rowsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await getServerSession(authOptions);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

      const table = await ctx.db.table.findUnique({
        where: { id: input.tableId },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return ctx.db.row.create({
        data: { tableId: input.tableId },
        include: {
          cells: { include: { column: true } },
        },
      });
    }),

  getByTableId: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await getServerSession(authOptions);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

      return ctx.db.row.findMany({
        where: { tableId: input.tableId },
        include: {
          cells: { include: { column: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),
});
