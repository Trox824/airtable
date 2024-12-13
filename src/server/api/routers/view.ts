import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PrismaClient, SortDirection } from "@prisma/client";
const prisma = new PrismaClient();

export const viewRouter = createTRPCRouter({
  // Procedure to get all views
  getAll: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.view.findMany({
        where: {
          tableId: input.tableId,
        },
      });
    }),
  // Procedure to create a new view
  create: publicProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.view.create({
        data: {
          tableId: input.tableId,
          name: input.name,
        },
      });
    }),
  updateSort: publicProcedure
    .input(
      z.object({
        viewId: z.string(),
        sorts: z.array(
          z.object({
            columnId: z.string(),
            direction: z.enum(["Ascending", "Descending"]),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      // First, delete all existing sorts for this view
      await prisma.sort.deleteMany({
        where: {
          viewId: input.viewId,
        },
      });

      // Then create new sorts with proper order
      await prisma.sort.createMany({
        data: input.sorts.map((sort, index) => ({
          viewId: input.viewId,
          columnId: sort.columnId,
          direction: sort.direction as SortDirection,
          order: index, // Maintain the order of sorts
        })),
      });

      return {
        success: true,
      };
    }),
  getSortConditions: publicProcedure
    .input(z.object({ viewId: z.string() }))
    .query(async ({ input }) => {
      const sorts = await prisma.sort.findMany({
        where: { viewId: input.viewId },
        orderBy: { order: "asc" },
      });

      return sorts.map((sort) => ({
        columnId: sort.columnId,
        order:
          sort.direction === "Ascending" ? ("asc" as const) : ("desc" as const),
      }));
    }),
  saveFilterConditions: publicProcedure
    .input(
      z.object({
        viewId: z.string(),
        filters: z.array(
          z.object({
            columnId: z.string(),
            operator: z.enum([
              "GreaterThan",
              "SmallerThan",
              "IsEmpty",
              "IsNotEmpty",
              "Equals",
              "Contains",
            ]),
            value: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      // Delete existing filters for this view
      await prisma.filter.deleteMany({
        where: { viewId: input.viewId },
      });

      // Create new filters
      await prisma.filter.createMany({
        data: input.filters.map((filter) => ({
          viewId: input.viewId,
          columnId: filter.columnId,
          operator: filter.operator,
          value: filter.value,
        })),
      });

      return { success: true };
    }),
  getFilterConditions: publicProcedure
    .input(z.object({ viewId: z.string() }))
    .query(async ({ input }) => {
      const filters = await prisma.filter.findMany({
        where: { viewId: input.viewId },
      });

      return filters.map((filter) => ({
        columnId: filter.columnId,
        operator: filter.operator,
        value: filter.value,
      }));
    }),
  updateColumnOrder: publicProcedure
    .input(
      z.object({
        viewId: z.string(),
        columns: z.array(
          z.object({
            id: z.string(),
            order: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      // First, delete all existing column orders for this view
      await prisma.columnOrder.deleteMany({
        where: {
          viewId: input.viewId,
        },
      });

      // Then create new column orders
      await prisma.columnOrder.createMany({
        data: input.columns.map((column) => ({
          viewId: input.viewId,
          columnId: column.id,
          order: column.order,
        })),
      });

      return { success: true };
    }),
  getColumnOrder: publicProcedure
    .input(z.object({ viewId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.columnOrder.findMany({
        where: { viewId: input.viewId },
        orderBy: { order: "asc" },
      });
    }),
  updateColumnVisibility: publicProcedure
    .input(
      z.object({
        viewId: z.string(),
        visibility: z.record(z.boolean()),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.view.update({
        where: { id: input.viewId },
        data: {
          columnVisibility: JSON.stringify(input.visibility),
        },
      });
    }),
});
