import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const cellInput = z.object({
  valueText: z.string().optional(),
  valueNumber: z.number().optional(),
});

export const cellsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z
        .object({
          rowId: z.string(),
          columnId: z.string(),
        })
        .merge(cellInput),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.cell.create({
          data: input,
          include: { column: true },
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create cell",
          cause: error,
        });
      }
    }),

  update: publicProcedure
    .input(
      z
        .object({
          id: z.string(),
        })
        .merge(cellInput),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      try {
        return await ctx.db.cell.update({
          where: { id },
          data: updateData,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to update cell",
          cause: error,
        });
      }
    }),

  // Optional: Add bulk operations if needed
  createMany: publicProcedure
    .input(
      z.array(
        z
          .object({
            rowId: z.string(),
            columnId: z.string(),
          })
          .merge(cellInput),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.cell.createMany({
          data: input,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create cells in bulk",
          cause: error,
        });
      }
    }),

  updateMany: publicProcedure
    .input(
      z.array(
        z
          .object({
            id: z.string(),
          })
          .merge(cellInput),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.$transaction(
          input.map(({ id, ...data }) =>
            ctx.db.cell.update({
              where: { id },
              data,
            }),
          ),
        );
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to update cells in bulk",
          cause: error,
        });
      }
    }),
});
