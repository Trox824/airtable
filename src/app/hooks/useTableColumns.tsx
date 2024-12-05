import { useMemo, useCallback } from "react";
import {
  CellContext,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  type Row,
  type ColumnMeta,
  type SimpleColumn,
} from "~/app/Types/types";
import { CellRenderer } from "~/app/_components/home/Table/CellRender";

export function useTableColumns(
  columns: SimpleColumn[] | undefined,
  setIsEditing: (value: boolean) => void,
) {
  // 1. Memoize the column helper first as it has no dependencies
  const columnHelper = useMemo(() => createColumnHelper<Row>(), []);

  // 2. Memoize the select column with stable dependencies
  const selectColumn = useMemo(
    () =>
      columnHelper.accessor((row) => row.id, {
        id: "select",
        enableResizing: false,
        size: 40,
        header: () => (
          <div className="flex h-full w-full items-center justify-center">
            <input type="checkbox" className="h-4 w-4" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
      }),
    [columnHelper],
  );

  // 3. Memoize the cell renderer
  const cellRenderer = useCallback(
    (info: CellContext<Row, string | number | null>) => (
      <CellRenderer info={info} setEditing={setIsEditing} />
    ),
    [setIsEditing],
  );

  // 4. Memoize the column map
  const columnMap = useMemo(() => {
    const map = new Map<string, ColumnMeta>();
    columns?.forEach((col) =>
      map.set(col.id, { type: col.type, name: col.name }),
    );
    return map;
  }, [columns]);

  // 5. Memoize the data columns
  const dataColumns = useMemo(
    () =>
      columns?.map((column) =>
        columnHelper.accessor(
          (row) => {
            const cell = row.cells.find((c) => c.columnId === column.id);
            return column.type === "Text"
              ? (cell?.valueText ?? "")
              : (cell?.valueNumber ?? null);
          },
          {
            id: column.id,
            meta: columnMap.get(column.id),
            header: column.name,
            cell: cellRenderer,
          },
        ),
      ) ?? [],
    [columns, columnMap, cellRenderer, columnHelper],
  );

  // 6. Final columns array
  return useMemo(
    () => [selectColumn, ...dataColumns],
    [selectColumn, dataColumns],
  );
}
