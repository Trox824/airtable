import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { authOptions } from "~/server/auth";
import { getServerSession } from "next-auth";
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

      return ctx.db.$transaction(
        async (tx) => {
          // Create base
          const base = await tx.base.create({
            data: { name: input.name, userId: session.user.id },
          });

          // Create table
          const table = await tx.table.create({
            data: {
              baseId: base.id,
              name: "Untitled Table",
            },
          });

          // Create default view
          const view = await tx.view.create({
            data: {
              tableId: table.id,
              name: "Grid view",
              columnVisibility: JSON.stringify({}),
            },
          });

          // Create two columns
          const columns = await tx.column.createMany({
            data: [
              {
                tableId: table.id,
                name: "Text Column",
                type: "Text",
              },
              {
                tableId: table.id,
                name: "Number Column",
                type: "Number",
              },
            ],
          });

          // Get the created columns to access their IDs
          const createdColumns = await tx.column.findMany({
            where: { tableId: table.id },
            orderBy: { createdAt: "asc" },
          });

          // Update the view with default column visibility
          await tx.view.update({
            where: { id: view.id },
            data: {
              columnVisibility: Object.fromEntries(
                createdColumns.map((column) => [column.id, true]),
              ),
            },
          });

          // Instead of createMany (which might not be supported), create each column order individually
          for (const [index, column] of createdColumns.entries()) {
            await tx.columnOrder.create({
              data: {
                viewId: view.id,
                columnId: column.id,
                order: index,
              },
            });
          }

          // Create two rows
          const rows = await tx.row.createMany({
            data: [{ tableId: table.id }, { tableId: table.id }],
          });

          // Get the created rows to access their IDs
          const createdRows = await tx.row.findMany({
            where: { tableId: table.id },
          });

          // Create cells for each row-column combination
          await tx.cell.createMany({
            data: createdRows.flatMap((row) =>
              createdColumns.map((column) => ({
                rowId: row.id,
                columnId: column.id,
                valueText: null,
                valueNumber: null,
              })),
            ),
          });

          return {
            id: base.id,
            name: base.name,
            firstTableId: table.id,
            firstViewId: view.id,
            tables: [
              {
                name: table.name,
                views: [
                  {
                    id: view.id,
                    name: view.name,
                  },
                ],
              },
            ],
          };
        },
        {
          timeout: 300000,
        },
      );
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      const session = await validateSession();
      return await ctx.db.base.findMany({
        where: { userId: session.user.id },
        include: {
          tables: {
            include: {
              views: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch bases. Please check database connection.",
        cause: error,
      });
    }
  }),

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
