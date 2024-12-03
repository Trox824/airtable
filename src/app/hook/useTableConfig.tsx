import { useMemo, useCallback } from "react";
import { getCoreRowModel, type ColumnDef } from "@tanstack/react-table";
import { type Row } from "../Types/types";

interface TableConfigProps<T extends Row> {
  rows: T[];
  tableColumns: ColumnDef<T, unknown>[];
  rowSelection: Record<string, boolean>;
  columnSizing: Record<string, number>;
  setColumnSizing: (sizing: Record<string, number>) => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
  updateCell: (params: {
    id: string;
    valueText?: string;
    valueNumber?: number;
  }) => void;
}

export const useTableConfig = <T extends Row>({
  rows,
  tableColumns,
  rowSelection,
  columnSizing,
  setColumnSizing,
  setRowSelection,
  updateCell,
}: TableConfigProps<T>) => {
  const handleColumnSizingChange = useCallback(
    (
      updaterOrValue:
        | Record<string, number>
        | ((prev: Record<string, number>) => Record<string, number>),
    ) => {
      if (typeof updaterOrValue === "function") {
        setColumnSizing(updaterOrValue(columnSizing));
      } else {
        setColumnSizing(updaterOrValue);
      }
    },
    [setColumnSizing, columnSizing],
  );

  const handleRowSelectionChange = useCallback(
    (
      updaterOrValue:
        | Record<string, boolean>
        | ((prev: Record<string, boolean>) => Record<string, boolean>),
    ) => {
      if (typeof updaterOrValue === "function") {
        setRowSelection(updaterOrValue(rowSelection));
      } else {
        setRowSelection(updaterOrValue);
      }
    },
    [setRowSelection, rowSelection],
  );

  const handleUpdateData = useCallback(
    (rowIndex: number, columnId: string, value: unknown) => {
      const row = rows[rowIndex];
      if (!row) return;

      const cell = row.cells.find((c) => c.columnId === columnId);
      if (!cell) return;

      updateCell({
        id: cell.id,
        valueText: cell.column.type === "Text" ? String(value) : undefined,
        valueNumber: cell.column.type === "Number" ? Number(value) : undefined,
      });
    },
    [rows, updateCell],
  );

  return useMemo(
    () => ({
      data: rows,
      columns: tableColumns,
      state: {
        rowSelection,
        columnSizing,
      },
      onColumnSizingChange: handleColumnSizingChange,
      columnResizeMode: "onChange" as const,
      enableColumnResizing: true,
      enableRowSelection: true,
      onRowSelectionChange: handleRowSelectionChange,
      getCoreRowModel: getCoreRowModel(),
      meta: {
        updateData: handleUpdateData,
      },
    }),
    [
      rows,
      tableColumns,
      rowSelection,
      columnSizing,
      handleColumnSizingChange,
      handleRowSelectionChange,
      handleUpdateData,
    ],
  );
};
