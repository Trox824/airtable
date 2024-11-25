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

      // Create base, table, columns, and rows in a transaction
      return ctx.db.$transaction(async (tx) => {
        // Increase the timeout for the transaction
        await tx.$executeRaw`SET LOCAL statement_timeout = '10000';`; // Set to 10 seconds

        const base = await tx.base.create({
          data: {
            name: input.name,
            userId: session.user.id,
          },
        });

        // Create initial table
        const table = await tx.table.create({
          data: {
            name: "Table 1",
            baseId: base.id,
          },
        });

        // Create two initial columns
        const columns = await Promise.all([
          tx.column.create({
            data: {
              name: "Untitled Column",
              tableId: table.id,
              type: "Text",
            },
          }),
          tx.column.create({
            data: {
              name: "Untitled Column",
              tableId: table.id,
              type: "Text",
            },
          }),
        ]);

        // Create four initial rows with empty cells
        await Promise.all(
          Array.from({ length: 4 }).map(async () => {
            const row = await tx.row.create({
              data: {
                tableId: table.id,
              },
            });

            // Create empty cells for each column
            await tx.cell.createMany({
              data: columns.map((column) => ({
                rowId: row.id,
                columnId: column.id,
                valueText: "",
              })),
            });
          }),
        );

        return base;
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

    // Fetch bases along with their associated table IDs
    return ctx.db.base.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        tables: {
          select: {
            id: true,
          },
        },
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
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete a base",
        });
      }
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
  fetchById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to fetch this base",
        });
      }

      const base = await ctx.db.base.findUnique({
        where: { id: input.id },
      });

      // Check if base exists and belongs to the user
      if (!base || base.userId !== session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this base",
        });
      }

      return base;
    }),
});
