import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { type TableMutationsProps } from "../types";
import { mapSortConditionsToAPI, sortRowsByConditions } from "../utils";
import { type UpdateCellParams } from "../types";

export function useUpdateCellMutation(
  props: TableMutationsProps & {
    utils: ReturnType<typeof api.useUtils>;
  },
) {
  const {
    tableId,
    searchQuery,
    sortConditions = [],
    filterConditions,
    columns,
    utils,
    refetchData,
  } = props;
  const mappedSortConditions = mapSortConditionsToAPI(sortConditions);

  return api.cells.update.useMutation({
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

            const updatedPages = oldData.pages.map((page) => {
              const updatedItems = page.items.map((row) => ({
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
              }));

              const sortedItems = sortRowsByConditions(
                updatedItems,
                sortConditions,
                columns,
              );

              return {
                ...page,
                items: sortedItems,
              };
            });

            return {
              ...oldData,
              pages: updatedPages,
            };
          },
        );

        return { previousData };
      }
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
    },

    onSuccess: async (updatedCell, newCell) => {
      const updatedColumn = columns.find(
        (col) => col.id === updatedCell.columnId,
      );

      const isInSortConditions = sortConditions.some(
        (condition) => condition.columnId === updatedColumn?.id,
      );

      if (isInSortConditions) {
        utils.rows.getByTableId.setInfiniteData(
          {
            tableId,
            limit: 500,
            searchQuery,
            sortConditions: mappedSortConditions,
            filterConditions,
          },
          undefined,
        );

        await utils.rows.getByTableId.invalidate({
          tableId,
          limit: 500,
          searchQuery,
          sortConditions: mappedSortConditions,
          filterConditions,
        });

        await refetchData();
      }
    },
  });
}
