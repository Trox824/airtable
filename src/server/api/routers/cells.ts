import { TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { authOptions } from "~/server/auth";

export const cellsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        rowId: z.string(),
        columnId: z.string(),
        valueText: z.string().optional(),
        valueNumber: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cell.create({
        data: input,
        include: { column: true },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        valueText: z.string().optional(),
        valueNumber: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cell.update({
        where: { id: input.id },
        data: {
          valueText: input.valueText,
          valueNumber: input.valueNumber,
        },
        include: { column: true },
      });
    }),
});
