import { api } from "~/trpc/react";
import { type TableMutationsProps } from "./types";
import { useAddColumnMutation } from "./mutations/useAddColumnMutation";
import { useAddRowMutation } from "./mutations/useAddRowMutation";
import { useUpdateCellMutation } from "./mutations/useUpdateCellMutation";
import { useRenameColumnMutation } from "./mutations/useRenameColumnMutation";
import { mapSortConditionsToAPI } from "./utils";

export function useTableMutations(props: TableMutationsProps) {
  const utils = api.useUtils();
  const mappedSortConditions = mapSortConditionsToAPI(props.sortConditions);

  const updateCell = useUpdateCellMutation({ ...props, utils });
  const addColumn = useAddColumnMutation({ ...props, utils, updateCell });
  const addRow = useAddRowMutation({ ...props, utils, updateCell });
  const renameColumn = useRenameColumnMutation({ ...props, utils });

  const updateTempCell = (newCell: {
    id: string;
    valueText?: string | null;
    valueNumber?: number | null;
  }) => {
    utils.rows.getByTableId.setInfiniteData(
      {
        tableId: props.tableId,
        limit: 500,
        searchQuery: props.searchQuery,
        sortConditions: mappedSortConditions,
        filterConditions: props.filterConditions,
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

  return {
    addColumn,
    addRow,
    updateCell,
    updateTempCell,
    renameColumn,
  };
}
