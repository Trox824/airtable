import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { authOptions } from "~/server/auth";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const validateSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return session;
};

export const baseRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ name: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const session = await validateSession();
      const base = await ctx.db.base.create({
        data: { name: input.name, userId: session.user.id },
      });

      const table = await ctx.db.table.create({
        data: {
          baseId: base.id,
          name: "Untitled Table",
        },
      });

      return {
        id: base.id,
        name: base.name,
        firstTableId: table.id,
        tables: [table.name],
      };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const session = await validateSession();
    return ctx.db.base.findMany({
      where: { userId: session.user.id },
      include: {
        tables: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }),

  // ... existing code ...

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await validateSession();
      const base = await ctx.db.base.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!base) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Base not found",
        });
      }

      if (base.userId !== session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this base",
        });
      }

      // If checks pass, delete the base
      return ctx.db.base.delete({
        where: { id: input.id },
      });
    }),

  // ... existing code ...

  fetchById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.db.base.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });
      return base;
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.base.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),
});
