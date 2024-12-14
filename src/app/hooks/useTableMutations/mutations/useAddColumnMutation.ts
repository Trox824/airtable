import { api } from "~/trpc/react";
import cuid from "cuid";
import { type TableMutationsProps, type TempCellValues } from "../types";
import { mapSortConditionsToAPI } from "../utils";
import { type Cell, type SimpleColumn } from "../../../Types/types";
import { type ColumnType } from "@prisma/client";

type CreateColumnResponse = {
  column: {
    id: string;
    name: string;
    type: ColumnType;
  };
  cells: {
    id: string;
    rowId: string;
    valueText: string | null;
    valueNumber: number | null;
  }[];
};

export function useAddColumnMutation(
  props: TableMutationsProps & {
    utils: ReturnType<typeof api.useUtils>;
    updateCell: ReturnType<typeof api.cells.update.useMutation>;
  },
) {
  const {
    tableId,
    searchQuery,
    sortConditions = [],
    filterConditions,
    setIsTableCreating,
    utils,
    updateCell,
  } = props;
  const mappedSortConditions = mapSortConditionsToAPI(sortConditions);

  return api.columns.create.useMutation({
    onMutate: async (newColumn: {
      tableId: string;
      name: string;
      type: ColumnType;
    }) => {
      setIsTableCreating(true);
      await utils.columns.getByTableId.cancel({ tableId });

      const previousColumns = utils.columns.getByTableId.getData({ tableId });
      const tempColumnId = `temp_${cuid()}`;

      const existingRows = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      // Insert a temp column and cells optimistically
      if (existingRows) {
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
                  const tempCell: Cell = {
                    id: `temp_${cuid()}`,
                    valueText: null,
                    valueNumber: null,
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
                  return { ...row, cells: [...row.cells, tempCell] };
                }),
              })),
            };
          },
        );
      }

      const optimisticColumn: SimpleColumn = {
        id: tempColumnId,
        name: newColumn.name,
        type: newColumn.type,
      };

      utils.columns.getByTableId.setData({ tableId }, (oldColumns) => {
        const updatedColumns = [...(oldColumns ?? []), optimisticColumn];
        return updatedColumns;
      });

      return { previousColumns, tempColumnId };
    },

    // Adjust the `onSuccess` to handle the new response structure { column, cells }
    onSuccess: async (data: CreateColumnResponse, variables, context) => {
      const { column: newColumn, cells: newCells } = data;
      const { tempColumnId } = context;

      // Extract tempCellValues from the current cache
      const currentCacheData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

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

      // Update the column ID in the cache from the temp ID to the real ID
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

      // Replace tempColumnId in cells with the real newColumn.id
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
                  cell.columnId === tempColumnId
                    ? {
                        ...cell,
                        columnId: newColumn.id,
                        column: { ...cell.column, id: newColumn.id },
                      }
                    : cell,
                ),
              })),
            })),
          };
        },
      );

      // Now that we have real column and real cells in the database, we can run updateCell
      // to match the temp values we initially set.
      // Map each row's temp values to the newly created real cell IDs from `newCells`.
      const updatePromises: Promise<void>[] = [];
      const finalCacheData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      if (finalCacheData) {
        finalCacheData.pages.forEach((page) => {
          page.items.forEach((row) => {
            const tempValues = tempCellValues.get(row.id);
            if (!tempValues) return;

            // Find the corresponding newly created cell in `newCells` (from the server)
            const realCellFromServer = newCells.find(
              (c) =>
                c.rowId === row.id &&
                c.valueText === null &&
                c.valueNumber === null,
            );

            if (!realCellFromServer) return;

            // If there is a difference between tempValues and the actual cell data,
            // call updateCell to sync backend.
            const needsUpdate =
              tempValues.valueText !== realCellFromServer.valueText ||
              tempValues.valueNumber !== realCellFromServer.valueNumber;

            if (needsUpdate) {
              const updatePromise = updateCell
                .mutateAsync({
                  id: realCellFromServer.id,
                  valueText: tempValues.valueText,
                  valueNumber: tempValues.valueNumber,
                })
                .then(() => void 0);

              updatePromises.push(updatePromise);
            }
          });
        });

        await Promise.all(updatePromises);
      }

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
}
