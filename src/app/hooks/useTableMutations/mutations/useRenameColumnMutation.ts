import { api } from "~/trpc/react";
import { type TableMutationsProps } from "../types";

export function useRenameColumnMutation(
  props: TableMutationsProps & {
    utils: ReturnType<typeof api.useUtils>;
  },
) {
  const { tableId, utils } = props;

  return api.columns.rename.useMutation({
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
}
