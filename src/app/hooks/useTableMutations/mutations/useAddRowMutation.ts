import { api } from "~/trpc/react";
import cuid from "cuid";
import { toast } from "react-hot-toast";
import { type TableMutationsProps } from "../types";
import { mapSortConditionsToAPI, sortRowsByConditions } from "../utils";
import { type Row, type SimpleColumn } from "../../../Types/types";

export function useAddRowMutation(
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
    columns,
    setIsTableCreating,
    utils,
    updateCell,
  } = props;
  const mappedSortConditions = mapSortConditionsToAPI(sortConditions);

  return api.rows.create.useMutation({
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
      const optimisticRow: Row = {
        id,
        tableId,
        cells: columns.map((column: SimpleColumn) => ({
          id: `temp_${cuid()}`,
          valueText: "",
          valueNumber: null,
          column: {
            type: column.type,
            id: column.id,
            name: column.name,
          },
          columnId: column.id,
          rowId: id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
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
          if (!oldData) {
            return {
              pages: [{ items: [optimisticRow] }],
              pageParams: [],
            };
          }

          const newPages = [...oldData.pages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              items: [...newPages[0].items, optimisticRow],
            };

            if (sortConditions.length > 0) {
              const sortedItems = sortRowsByConditions(
                newPages[0].items,
                sortConditions,
                columns,
              );

              newPages[0] = {
                ...newPages[0],
                items: sortedItems,
              };
            }
          }

          return {
            ...oldData,
            pages: newPages,
          };
        },
      );

      return { previousData, optimisticRow };
    },

    onSuccess: async (newRow, variables, context) => {
      const tempRowId = context?.optimisticRow?.id;
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

      if (tempRow) {
        const updatePromises = newRow.cells
          .map((newCell) => {
            const tempCell = tempRow?.cells.find(
              (cell) => cell.columnId === newCell.columnId,
            );
            if (
              tempCell &&
              (tempCell.valueText !== "" || tempCell.valueNumber !== null)
            ) {
              return updateCell.mutateAsync({
                id: newCell.id,
                valueText: tempCell.valueText,
                valueNumber: tempCell.valueNumber,
              });
            }
            return null;
          })
          .filter(
            (promise): promise is ReturnType<typeof updateCell.mutateAsync> =>
              promise !== null,
          );

        try {
          await Promise.all(updatePromises);
        } catch (error) {
          console.error("Error updating cells:", error);
          toast.error("Failed to update some cell values");
        }
      }

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
                        valueText: tempCell?.valueText ?? "",
                        valueNumber: tempCell?.valueNumber ?? null,
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
  });
}
