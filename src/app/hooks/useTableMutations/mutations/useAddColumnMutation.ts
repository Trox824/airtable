import { api } from "~/trpc/react";
import cuid from "cuid";
import { type TableMutationsProps, type TempCellValues } from "../types";
import { mapSortConditionsToAPI } from "../utils";
import { type Cell, type SimpleColumn } from "../../../Types/types";
import { type ColumnType } from "@prisma/client";

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
      console.log("Starting onMutate with newColumn:", newColumn);
      setIsTableCreating(true);
      await utils.columns.getByTableId.cancel({ tableId });
      const previousColumns = utils.columns.getByTableId.getData({ tableId });
      console.log("Previous columns:", previousColumns);

      const tempColumnId = `temp_${cuid()}`;
      console.log("Generated temp column ID:", tempColumnId);

      const existingRows = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });
      console.log("Existing rows:", existingRows);

      existingRows?.pages.forEach((page) => {
        page.items.forEach((row) => {
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
          console.log("Created temp cell for row:", row.id, tempCell);

          utils.rows.getByTableId.setInfiniteData(
            {
              tableId,
              limit: 500,
              searchQuery,
              sortConditions: mappedSortConditions,
              filterConditions,
            },
            (oldData) => {
              const updatedData = {
                ...oldData!,
                pages: oldData!.pages.map((page) => ({
                  ...page,
                  items: page.items.map((item) =>
                    item.id === row.id
                      ? { ...item, cells: [...item.cells, tempCell] }
                      : item,
                  ),
                })),
              };
              console.log("Updated cache data for row:", row.id, updatedData);
              return updatedData;
            },
          );
        });
      });

      const optimisticColumn: SimpleColumn = {
        id: tempColumnId,
        name: newColumn.name,
        type: newColumn.type,
      };
      console.log("Created optimistic column:", optimisticColumn);

      utils.columns.getByTableId.setData({ tableId }, (oldColumns) => {
        const updatedColumns = [...(oldColumns ?? []), optimisticColumn];
        console.log("Updated columns cache:", updatedColumns);
        return updatedColumns;
      });

      return { previousColumns, tempColumnId };
    },

    onSuccess: async (newColumn, variables, context) => {
      console.log("onSuccess started with new column:", newColumn);
      console.log("Context:", context);
      const { tempColumnId } = context;

      const currentCacheData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });
      console.log("Current cache data:", currentCacheData);

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

      await utils.rows.getByTableId.invalidate({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

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

      const cachedData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 500,
        searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions,
      });

      if (cachedData && tempColumnId) {
        const updatePromises: Promise<void>[] = [];
        cachedData.pages.forEach((page) => {
          page.items.forEach((row) => {
            const realCell = row.cells.find(
              (cell) => cell.columnId === newColumn.id,
            );
            if (realCell && !realCell.id.startsWith("temp_")) {
              const updatePromise = updateCell
                .mutateAsync({
                  id: realCell.id,
                  valueText: realCell.valueText,
                  valueNumber: realCell.valueNumber,
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
