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

      if (tempColumnId) {
        const updatePromises: Promise<void>[] = [];
        currentCacheData?.pages.forEach((page) => {
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
