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

const validateBaseOwnership = async (
  db: PrismaClient,
  baseId: string,
  userId: string,
) => {
  const base = await db.base.findUnique({
    where: { id: baseId },
    select: {
      id: true,
      name: true,
      userId: true,
    },
  });

  if (!base || base.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this base",
    });
  }
  return base;
};

export const baseRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ name: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const session = await validateSession();

      return ctx.db.$transaction(
        async (tx) => {
          await tx.$executeRaw`SET LOCAL statement_timeout = '15000';`;

          const base = await tx.base.create({
            data: { name: input.name, userId: session.user.id },
          });

          const table = await tx.table.create({
            data: { name: "Table 1", baseId: base.id },
          });

          await tx.column.createMany({
            data: Array(2).fill({
              name: "Untitled Column",
              tableId: table.id,
              type: "Text",
            }),
          });

          const columnIds = await tx.column.findMany({
            where: { tableId: table.id },
            select: { id: true },
          });

          await tx.row.createMany({
            data: Array(4).fill({ tableId: table.id }),
          });

          const rowIds = await tx.row.findMany({
            where: { tableId: table.id },
            select: { id: true },
          });

          await tx.cell.createMany({
            data: rowIds.flatMap((row) =>
              columnIds.map((col) => ({
                rowId: row.id,
                columnId: col.id,
                valueText: "",
              })),
            ),
          });

          return base;
        },
        { timeout: 15000 },
      );
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const session = await validateSession();

    return ctx.db.base.findMany({
      where: { userId: session.user.id },
      include: { tables: { select: { id: true } } },
    });
  }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await validateSession();
      await validateBaseOwnership(ctx.db, input.id, session.user.id);

      return ctx.db.base.delete({
        where: { id: input.id },
      });
    }),

  fetchById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await validateSession();
      return validateBaseOwnership(ctx.db, input.id, session.user.id);
    }),
});
