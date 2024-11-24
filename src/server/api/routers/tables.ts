import { TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { authOptions } from "~/server/auth";

export const tablesRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        baseId: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.table.create({
        data: {
          baseId: input.baseId,
          name: input.name,
        },
      });
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: {
          id: input.id,
        },
      });
      if (!table) {
        throw new Error("Table not found");
      }
      return ctx.db.table.delete({
        where: {
          id: input.id,
        },
      });
    }),

  getByBaseId: publicProcedure
    .input(
      z.object({
        baseId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.table.findMany({
        where: {
          baseId: input.baseId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: {
          id: input.id,
        },
      });
      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found or unauthorized",
        });
      }
      return table;
    }),
});
