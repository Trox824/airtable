import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import cuid from "cuid";
import { type Row, type SimpleColumn } from "../Types/types";
import { type ColumnType } from "@prisma/client";
import {
  type SortCondition,
  type FilterCondition,
  UpdateCellParams,
  Cell,
  RowWithCells,
} from "../Types/types";

// Add this interface near the top of the file with other types
interface TempCellValues {
  valueText: string | null;
  valueNumber: number | null;
}

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
    onMutate: async (newColumn: {
      tableId: string;
      name: string;
      type: ColumnType;
    }) => {
      setIsTableCreating(true);
      await utils.columns.getByTableId.cancel({ tableId });
      const previousColumns = utils.columns.getByTableId.getData({ tableId });

      // Generate temporary IDs
      const tempColumnId = `temp_${cuid()}`;

      // Create optimistic column with temporary cells for existing rows
      const existingRows = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      // Create temporary cells for each row
      existingRows?.pages.forEach((page) => {
        page.items.forEach((row) => {
          const tempCell: Cell = {
            id: `temp_${cuid()}`,
            valueText: newColumn.type === "Text" ? "" : null,
            valueNumber: newColumn.type === "Number" ? null : null,
            column: {
              type: newColumn.type,
              id: tempColumnId,
              name: newColumn.name,
            },
            columnId: tempColumnId,
            rowId: row.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Update the row with the new temporary cell
          utils.rows.getByTableId.setInfiniteData(
            {
              tableId,
              limit: 500,
              searchQuery,
              sortConditions: mappedSortConditions,
              filterConditions,
            },
            (oldData) => ({
              ...oldData!,
              pages: oldData!.pages.map((page) => ({
                ...page,
                items: page.items.map((item) =>
                  item.id === row.id
                    ? { ...item, cells: [...item.cells, tempCell] }
                    : item,
                ),
              })),
            }),
          );
        });
      });

      const optimisticColumn: SimpleColumn = {
        id: tempColumnId,
        name: newColumn.name,
        type: newColumn.type,
      };

      utils.columns.getByTableId.setData({ tableId }, (oldColumns) => [
        ...(oldColumns ?? []),
        optimisticColumn,
      ]);

      return { previousColumns, tempColumnId };
    },

    onSuccess: async (newColumn, variables, context) => {
      const { tempColumnId } = context;

      // First, get the current cache state before any updates
      const currentCacheData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      // Store the temporary values
      const tempCellValues = new Map<string, TempCellValues>();
      currentCacheData?.pages.forEach((page) => {
        page.items.forEach((row) => {
          const tempCell = row.cells.find(
            (cell) => cell.columnId === tempColumnId,
          );
          if (tempCell) {
            tempCellValues.set(row.id, {
              valueText: tempCell.valueText,
              valueNumber: tempCell.valueNumber,
            });
          }
        });
      });

      // Update the columns cache with the real column ID
      utils.columns.getByTableId.setData({ tableId }, (oldColumns) =>
        (oldColumns ?? []).map((col) =>
          col.id === tempColumnId
            ? {
                ...col,
                id: newColumn.id,
                name: newColumn.name,
                type: newColumn.type,
              }
            : col,
        ),
      );

      // Invalidate and wait for the new data
      await utils.rows.getByTableId.invalidate({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      // After invalidation, update the cache with the stored temporary values
      utils.rows.getByTableId.setInfiniteData(
        {
          tableId,
          limit: 500,
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
              items: page.items.map((row) => {
                const tempValues = tempCellValues.get(row.id);
                if (!tempValues) return row;

                return {
                  ...row,
                  cells: row.cells.map((cell) => {
                    if (cell.columnId === newColumn.id) {
                      return {
                        ...cell,
                        valueText: tempValues.valueText,
                        valueNumber: tempValues.valueNumber,
                      };
                    }
                    return cell;
                  }),
                };
              }),
            })),
          };
        },
      );

      // Step 3: After updating the cache, fetch the updated rows data from the cache
      // and commit the temporary cell values to the backend.
      const cachedData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });
      console.log("cachedData", JSON.stringify(cachedData, null, 2));
      if (cachedData && tempColumnId) {
        const updatePromises: Promise<void>[] = [];
        cachedData.pages.forEach((page) => {
          page.items.forEach((row) => {
            const realCell = row.cells.find(
              (cell) => cell.columnId === newColumn.id,
            );
            if (realCell && !realCell.id.startsWith("temp_")) {
              // Persist the optimistically set values to the backend

              const updatePromise = updateCell
                .mutateAsync({
                  id: realCell.id,
                  valueText: realCell.valueText,
                  valueNumber: realCell.valueNumber,
                })
                .then(() => void 0); // Ensure promise resolves to void
              updatePromises.push(updatePromise);
            }
          });
        });

        // Wait for all cell updates to complete
        await Promise.all(updatePromises);
      }

      // Finally, turn off the "creating" state
      setIsTableCreating(false);
    },

    onError: (err, newColumn, context) => {
      setIsTableCreating(false);
      if (context?.previousColumns) {
        utils.columns.getByTableId.setData(
          { tableId },
          context.previousColumns,
        );
      }
    },
  });

  const addRow = api.rows.create.useMutation({
    onMutate: async () => {
      setIsTableCreating(true);
      await utils.rows.getByTableId.cancel({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      const previousData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
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
          limit: 500,
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
              return condition.order === "9-0" || condition.order === "desc";
            });

            newPages[0] = {
              ...newPages[0],
              items: shouldInsertAtStart
                ? [optimisticRow, ...newPages[0].items]
                : [...newPages[0].items, optimisticRow],
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
            limit: 500,
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

      // Fetch the latest tempRow from the cache
      const cachedData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      let tempRow: Row | undefined;
      if (cachedData) {
        for (const page of cachedData.pages) {
          tempRow = page.items.find((row) => row.id === tempRowId);
          if (tempRow) break;
        }
      }

      // If we found a temp row, update each cell with its values
      if (tempRow) {
        const updatePromises = newRow.cells.map((newCell) => {
          const tempCell = tempRow.cells.find(
            (cell) => cell.columnId === newCell.columnId,
          );

          if (tempCell) {
            return updateCell.mutate({
              id: newCell.id,
              valueText: tempCell.valueText,
              valueNumber: tempCell.valueNumber,
            });
          }
        });

        // Wait for all cell updates to complete
        await Promise.all(updatePromises);
      }

      // Update the cache with the new row ID but preserve temp values
      utils.rows.getByTableId.setInfiniteData(
        {
          tableId,
          limit: 500,
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
              items: page.items.map((row) => {
                if (row.id === tempRowId) {
                  return {
                    ...newRow,
                    cells: newRow.cells.map((newCell) => {
                      const tempCell = tempRow?.cells.find(
                        (cell) => cell.columnId === newCell.columnId,
                      );
                      return {
                        ...newCell,
                        valueText: tempCell?.valueText ?? newCell.valueText,
                        valueNumber:
                          tempCell?.valueNumber ?? newCell.valueNumber,
                      };
                    }),
                  };
                }
                return row;
              }),
            })),
          };
        },
      );

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
          limit: 500,
          searchQuery,
          sortConditions: mappedSortConditions,
          filterConditions,
        });

        const previousData = utils.rows.getByTableId.getInfiniteData({
          tableId,
          limit: 500,
          searchQuery,
          sortConditions: mappedSortConditions,
          filterConditions,
        });

        // Optimistically update the cell value
        utils.rows.getByTableId.setInfiniteData(
          {
            tableId,
            limit: 500,
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
            limit: 500,
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
          limit: 500,
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
  });

  const updateTempCell = (newCell: UpdateCellParams) => {
    utils.rows.getByTableId.setInfiniteData(
      {
        tableId,
        limit: 500,
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
