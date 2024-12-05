import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ColumnType } from "@prisma/client";

const cellInput = z.object({
  valueText: z.string().nullable().optional(),
  valueNumber: z.number().nullable().optional(),
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
      z.object({
        id: z.string(),
        valueText: z.string().nullable().optional(),
        valueNumber: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      try {
        // First verify the cell exists and get its column type
        const existingCell = await ctx.db.cell.findUnique({
          where: { id },
          include: {
            column: {
              select: { type: true },
            },
          },
        });

        if (!existingCell) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cell not found",
          });
        }

        // Validate the update data matches the column type
        const updatePayload = {
          valueText:
            existingCell.column.type === ColumnType.Text
              ? updateData.valueText
              : null,
          valueNumber:
            existingCell.column.type === ColumnType.Number
              ? updateData.valueNumber
              : null,
        };

        // Perform the update
        const updatedCell = await ctx.db.cell.update({
          where: { id },
          data: updatePayload,
          include: {
            column: {
              select: { type: true },
            },
          },
        });

        return updatedCell;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

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
