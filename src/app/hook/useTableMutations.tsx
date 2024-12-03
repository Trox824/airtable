import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import cuid from "cuid";
import { type Row, type SimpleColumn } from "../Types/types";
import { type ColumnType } from "@prisma/client";
import { type SortCondition, type FilterCondition } from "../Types/types";

// Helper function to convert sort conditions
function mapSortConditionsToAPI(conditions: SortCondition[]) {
  return conditions.map((condition) => ({
    columnId: condition.columnId,
    order:
      condition.order === "0-9"
        ? "asc"
        : condition.order === "9-0"
          ? "desc"
          : "asc",
  })) as { columnId: string; order: "asc" | "desc" }[];
}

export function useTableMutations(
  tableId: string,
  searchQuery: string,
  sortConditions: SortCondition[],
  filterConditions: FilterCondition[],
  columns: SimpleColumn[],
) {
  const utils = api.useUtils();
  const mappedSortConditions = mapSortConditionsToAPI(sortConditions);

  const addColumn = api.columns.create.useMutation({
    onMutate: async (newColumn: {
      tableId: string;
      name: string;
      type: ColumnType;
    }) => {
      await utils.columns.getByTableId.cancel({ tableId });
      const previousColumns = utils.columns.getByTableId.getData({ tableId });
      const id = cuid();
      const optimisticColumn = {
        id,
        tableId: newColumn.tableId,
        name: newColumn.name,
        type: newColumn.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      utils.columns.getByTableId.setData({ tableId }, (oldColumns) => [
        ...(oldColumns ?? []),
        optimisticColumn,
      ]);

      return { previousColumns };
    },
    onError: (err, newColumn, context) => {
      if (context?.previousColumns) {
        utils.columns.getByTableId.setData(
          { tableId },
          context.previousColumns,
        );
      }
    },
    onSettled: async () => {
      await utils.columns.getByTableId.invalidate({ tableId });
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  const addRow = api.rows.create.useMutation({
    onMutate: async () => {
      await utils.rows.getByTableId.cancel({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      const previousData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      const id = cuid();
      const emptyCells = columns.map((column: SimpleColumn) => ({
        id: cuid(),
        valueText: column.type === "Text" ? "" : null,
        valueNumber: null,
        column: {
          type: column.type,
        },
        columnId: column.id,
        rowId: id,
      }));

      const optimisticRow = {
        id,
        tableId,
        cells: emptyCells,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Row;

      utils.rows.getByTableId.setInfiniteData(
        {
          tableId,
          limit: 100,
          searchQuery,
          sortConditions: mappedSortConditions,
          filterConditions,
        },
        (oldData) => {
          if (!oldData) return { pages: [], pageParams: [] };

          const newPages = [...oldData.pages];
          if (newPages[0]) {
            const shouldInsertAtStart = sortConditions.some((condition) => {
              const cell = optimisticRow.cells.find(
                (c) => c.columnId === condition.columnId,
              );
              return condition.order === "9-0" || condition.order === "desc";
            });

            newPages[0] = {
              ...newPages[0],
              items: shouldInsertAtStart
                ? [optimisticRow, ...newPages[0].items]
                : [...newPages[0].items, optimisticRow],
              totalCount: (newPages[0].totalCount ?? 0) + 1,
            };
          }

          return {
            ...oldData,
            pages: newPages,
          };
        },
      );

      return { previousData };
    },
    onError: (err, newRow, context) => {
      if (context?.previousData) {
        utils.rows.getByTableId.setInfiniteData(
          {
            tableId,
            limit: 100,
            searchQuery,
            sortConditions: mappedSortConditions,
            filterConditions,
          },
          context.previousData,
        );
      }
      toast.error("Failed to add row");
    },
    onSettled: async () => {
      await utils.rows.getByTableId.invalidate({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });
    },
  });

  const updateCell = api.cells.update.useMutation({
    onMutate: async (newCell: {
      id: string;
      valueText?: string;
      valueNumber?: number;
    }) => {
      await utils.rows.getByTableId.cancel({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      const previousData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      utils.rows.getByTableId.setInfiniteData(
        {
          tableId,
          limit: 100,
          searchQuery,
          sortConditions: mappedSortConditions,
          filterConditions,
        },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((row) => ({
                ...row,
                cells: row.cells.map((cell) =>
                  cell.id === newCell.id
                    ? {
                        ...cell,
                        valueText: newCell.valueText ?? cell.valueText,
                        valueNumber: newCell.valueNumber ?? cell.valueNumber,
                      }
                    : cell,
                ),
              })),
            })),
          };
        },
      );

      return { previousData };
    },
    onError: (err, newCell, context) => {
      if (context?.previousData) {
        utils.rows.getByTableId.setInfiniteData(
          {
            tableId,
            limit: 100,
            searchQuery,
            sortConditions: mappedSortConditions,
            filterConditions,
          },
          context.previousData,
        );
      }
      toast.error("Failed to update cell");
    },
    onSettled: async () => {
      await utils.rows.getByTableId.invalidate({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });
    },
  });

  const renameColumn = api.columns.rename.useMutation({
    onMutate: async (newColumn: { columnId: string; name: string }) => {
      await utils.columns.getByTableId.cancel({ tableId });
      const previousColumns = utils.columns.getByTableId.getData({ tableId });

      utils.columns.getByTableId.setData({ tableId }, (oldColumns) =>
        oldColumns?.map((col) =>
          col.id === newColumn.columnId
            ? { ...col, name: newColumn.name }
            : col,
        ),
      );

      return { previousColumns };
    },
    onError: (err, newColumn, context) => {
      if (context?.previousColumns) {
        utils.columns.getByTableId.setData(
          { tableId },
          context.previousColumns,
        );
      }
    },
    onSettled: async () => {
      await utils.columns.getByTableId.invalidate({ tableId });
    },
  });

  return {
    addColumn,
    addRow,
    updateCell,
    renameColumn,
  };
}
