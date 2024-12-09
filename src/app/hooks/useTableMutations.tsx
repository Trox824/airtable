import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import cuid from "cuid";
import { type Row, type SimpleColumn } from "../Types/types";
import {
  type SortCondition,
  type FilterCondition,
  UpdateCellParams,
  Cell,
  RowWithCells,
} from "../Types/types";

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
  setIsTableCreating: (isCreating: boolean) => void,
) {
  const utils = api.useUtils();
  const mappedSortConditions = mapSortConditionsToAPI(sortConditions);

  const addColumn = api.columns.create.useMutation({
    onMutate: async (newColumn) => {
      setIsTableCreating(true);
      // Cancel ongoing queries
      await utils.columns.getByTableId.cancel({ tableId });
      // Snapshot the previous columns
      const previousColumns = utils.columns.getByTableId.getData({ tableId });
      // Create a temporary column ID
      const tempColumnId = `temp_${cuid()}`;
      // Optimistically update the columns data
      utils.columns.getByTableId.setData({ tableId }, (oldColumns) => [
        ...(oldColumns ?? []),
        {
          id: tempColumnId,
          name: newColumn.name,
          type: newColumn.type,
        },
      ]);

      // Prepare and set optimistic updates for rows
      await utils.rows.getByTableId.cancel({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      const existingRows = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      // For each existing row, add an empty cell for the new temp column
      if (existingRows) {
        const updatedPages = existingRows.pages.map((page) => ({
          ...page,
          items: page.items.map((row) => {
            const tempCell: Cell = {
              id: `temp_${cuid()}`,
              valueText: newColumn.type === "Text" ? "" : null,
              valueNumber: newColumn.type === "Number" ? null : null,
              columnId: tempColumnId,
              rowId: row.id,
              column: {
                id: tempColumnId,
                name: newColumn.name,
                type: newColumn.type,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            return { ...row, cells: [...row.cells, tempCell] };
          }),
        }));

        utils.rows.getByTableId.setInfiniteData(
          {
            tableId,
            limit: 100,
            searchQuery,
            sortConditions: mappedSortConditions,
            filterConditions,
          },
          (oldData) =>
            oldData
              ? {
                  ...oldData,
                  pages: updatedPages,
                }
              : oldData,
        );
      }

      return { previousColumns, tempColumnId };
    },

    onError: (err, newColumn, context) => {
      setIsTableCreating(false);
      if (context?.previousColumns) {
        utils.columns.getByTableId.setData(
          { tableId },
          context.previousColumns,
        );
      }
      toast.error("Failed to add column");
    },

    onSuccess: async (newColumn) => {
      // 1. Find the temporary column ID from the cache
      const cachedData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      // 2. Find all temp cells for the new column and update their real counterparts
      if (cachedData) {
        const updatePromises: Promise<Cell>[] = [];

        cachedData.pages.forEach((page) => {
          page.items.forEach((row) => {
            // Find temp cell and real cell by matching column type and checking temp prefix
            const tempCell = row.cells.find(
              (cell) =>
                cell.columnId.startsWith("temp_") &&
                cell.column.type === newColumn.type,
            );
            const realCell = row.cells.find(
              (cell) => cell.columnId === newColumn.id,
            );

            // Only update if temp cell has a value
            if (
              tempCell &&
              realCell &&
              (tempCell.valueText !== null || tempCell.valueNumber !== null)
            ) {
              updatePromises.push(
                updateCell.mutateAsync({
                  id: realCell.id,
                  valueText: tempCell.valueText,
                  valueNumber: tempCell.valueNumber,
                }),
              );
            }
          });
        });

        // Wait for all updates to complete
        await Promise.all(updatePromises);
      }

      setIsTableCreating(false);
      await utils.columns.getByTableId.invalidate({ tableId });
      await utils.rows.getByTableId.invalidate({ tableId });
    },

    onSettled: async () => {
      setIsTableCreating(false);
      await utils.columns.getByTableId.invalidate({ tableId });
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  const addRow = api.rows.create.useMutation({
    onMutate: async () => {
      setIsTableCreating(true);
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

      const id = `temp_${cuid()}`;
      const initialCells = columns.map((column: SimpleColumn) => ({
        id: `temp_${cuid()}`,
        valueText: column.type === "Text" ? "" : null,
        valueNumber: column.type === "Number" ? null : null,
        column: {
          type: column.type,
          id: column.id,
          name: column.name,
        },
        columnId: column.id,
        rowId: id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const optimisticRow: Row = {
        id,
        tableId,
        cells: initialCells,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      utils.rows.getByTableId.setInfiniteData(
        {
          tableId,
          limit: 100,
          searchQuery,
          sortConditions: mappedSortConditions,
          filterConditions,
        },
        (oldData) => {
          if (!oldData)
            return {
              pages: [{ items: [optimisticRow], totalCount: 1 }],
              pageParams: [],
            };

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
            pageParams: oldData.pageParams,
          };
        },
      );

      return { previousData, optimisticRow };
    },
    onError: (err, newRow, context) => {
      setIsTableCreating(false);
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
    onSuccess: async (newRow, variables, context) => {
      const tempRowId = context?.optimisticRow?.id;

      // Instead of updating the cache with both optimistic and server data,
      // we should just invalidate the query to fetch fresh data
      await utils.rows.getByTableId.invalidate({
        tableId,
        limit: 100,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      setIsTableCreating(false);
    },
    onSettled: () => {
      setIsTableCreating(false);
    },
  });

  const updateCell = api.cells.update.useMutation({
    onMutate: async (newCell: UpdateCellParams) => {
      if (!newCell.id.startsWith("temp_")) {
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
        // Optimistically update the cell value
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
      }
      // For temporary cells, do not proceed with server mutation
      return {};
    },
    onError: (err, newCell, context) => {
      console.error("updateCell error:", {
        error: err,
        cellId: newCell.id,
        values: {
          text: newCell.valueText,
          number: newCell.valueNumber,
        },
      });

      // Only revert if it's a real cell
      if (!newCell.id.startsWith("temp_") && context?.previousData) {
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
        toast.error("Failed to update cell");
      }
      // If "Cell not found", likely a temp cell; do not revert
    },
    onSuccess: (result, variables) => {
      // Update the cache with the new cell value
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
                  cell.id === variables.id
                    ? {
                        ...cell,
                        valueText: variables.valueText ?? cell.valueText,
                        valueNumber: variables.valueNumber ?? cell.valueNumber,
                      }
                    : cell,
                ),
              })),
            })),
          };
        },
      );
    },
    onSettled: async () => {
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  const updateTempCell = (newCell: UpdateCellParams) => {
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
  };

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
    updateTempCell,
    renameColumn,
  };
}
