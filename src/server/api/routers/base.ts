import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { authOptions } from "~/server/auth";
import { getServerSession } from "next-auth";

export const baseRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a base",
        });
      }

      return ctx.db.base.create({
        data: {
          name: input.name,
          userId: session.user.id,
        },
      });
    }),

  // New procedure to fetch bases
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to fetch bases",
      });
    }

    return ctx.db.base.findMany({
      where: {
        userId: session.user.id,
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
      // Ensure user is authenticated
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete a base",
        });
      }

      // Check if the base belongs to the user
      const base = await ctx.db.base.findUnique({
        where: { id: input.id },
      });

      if (!base || base.userId !== session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this base",
        });
      }

      return ctx.db.base.delete({
        where: { id: input.id },
      });
    }),
});
