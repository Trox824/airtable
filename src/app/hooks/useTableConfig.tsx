// src/app/hook/useTableConfig.ts

import { useMemo, useCallback } from "react";
import { getCoreRowModel, type ColumnDef } from "@tanstack/react-table";
import { type Row, type UpdateCellParams } from "../Types/types";

interface TableConfigProps {
  rows: Row[];
  tableColumns: ColumnDef<Row, unknown>[];
  rowSelection: Record<string, boolean>;
  columnSizing: Record<string, number>;
  setColumnSizing: (sizing: Record<string, number>) => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
  updateCell: {
    mutate: (params: UpdateCellParams) => void;
  };
  updateTempCell: (params: UpdateCellParams) => void;
}

export const useTableConfig = ({
  rows,
  tableColumns,
  rowSelection,
  columnSizing,
  setColumnSizing,
  setRowSelection,
  updateCell,
  updateTempCell,
}: TableConfigProps) => {
  // Handle column sizing changes
  const handleColumnSizingChange = useCallback(
    (
      updaterOrValue:
        | Record<string, number>
        | ((prev: Record<string, number>) => Record<string, number>),
    ) => {
      setColumnSizing(
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnSizing)
          : updaterOrValue,
      );
    },
    [setColumnSizing, columnSizing],
  );

  // Handle row selection changes
  const handleRowSelectionChange = useCallback(
    (
      updaterOrValue:
        | Record<string, boolean>
        | ((prev: Record<string, boolean>) => Record<string, boolean>),
    ) => {
      setRowSelection(
        typeof updaterOrValue === "function"
          ? updaterOrValue(rowSelection)
          : updaterOrValue,
      );
    },
    [setRowSelection, rowSelection],
  );

  // Handle updating cell data
  const handleUpdateData = useCallback(
    (rowIndex: number, columnId: string, value: unknown) => {
      const row = rows[rowIndex];
      if (!row) {
        console.error("Row not found", { rowIndex });
        return;
      }

      const cell = row.cells.find((c) => c.columnId === columnId);
      if (!cell) {
        console.error("Cell not found", { rowIndex, columnId });
        return;
      }

      const column = tableColumns.find((col) => col.id === columnId);
      const columnType = column?.meta?.type;

      if (!columnType) {
        console.error("Column type not found");
        return;
      }

      const updateParams: UpdateCellParams = {
        id: cell.id,
        valueText: columnType === "Text" ? String(value ?? "") : null,
        valueNumber:
          columnType === "Number"
            ? value === null || value === ""
              ? null
              : Number(value)
            : null,
      };

      if (cell.id.startsWith("temp_")) {
        updateTempCell(updateParams);
      } else {
        updateCell.mutate(updateParams);
      }
    },
    [rows, tableColumns, updateCell, updateTempCell],
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
