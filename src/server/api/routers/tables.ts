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
      // Verify user owns the base
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a base",
        });
      }
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
      // Verify user owns the table through base
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete a table",
        });
      }
      const table = await ctx.db.table.findFirst({
        where: {
          id: input.id,
          base: {
            userId: session.user.id,
          },
        },
      });

      if (!table) {
        throw new Error("Table not found or unauthorized");
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
      // Verify user owns the base
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to get tables",
        });
      }
      const base = await ctx.db.base.findFirst({
        where: {
          id: input.baseId,
          userId: session.user.id,
        },
      });

      if (!base) {
        throw new Error("Base not found or unauthorized");
      }

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
      // Verify user owns the table through base
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this table",
        });
      }

      const table = await ctx.db.table.findFirst({
        where: {
          id: input.id,
          base: {
            userId: session.user.id,
          },
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
