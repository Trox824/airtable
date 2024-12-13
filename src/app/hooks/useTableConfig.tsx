// src/app/hook/useTableConfig.ts

import { useMemo, useCallback } from "react";
import {
  getCoreRowModel,
  type ColumnDef,
  type VisibilityState,
  type OnChangeFn,
} from "@tanstack/react-table";
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
  state: {
    columnVisibility: VisibilityState;
  };
  onColumnVisibilityChange: OnChangeFn<VisibilityState>;
  refetchData: () => Promise<void>;
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
  state: { columnVisibility },
  onColumnVisibilityChange,
  refetchData,
}: TableConfigProps) => {
  // Handle column visibility changes
  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> = useCallback(
    (updaterOrValue) => {
      onColumnVisibilityChange(updaterOrValue);
    },
    [onColumnVisibilityChange],
  );

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
    async (rowIndex: number, columnId: string, value: unknown) => {
      const row = rows[rowIndex];
      if (!row) {
        console.error("Row not found", { rowIndex });
        return;
      }
      const cell = row.cells.find((c) => c.columnId === columnId);
      if (!cell) {
        console.log("Cell not found", { rowIndex, columnId });
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
        valueText:
          columnType === "Text"
            ? value === null || value === undefined
              ? ""
              : typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : typeof value === "string"
                  ? value
                  : typeof value === "number" || typeof value === "boolean"
                    ? value.toString()
                    : ""
            : null,
        valueNumber:
          columnType === "Number"
            ? value === null || value === ""
              ? null
              : Number(value)
            : null,
      };

      try {
        if (cell.id.startsWith("temp_")) {
          updateTempCell(updateParams);
        } else {
          updateCell.mutate(updateParams);
        }
      } catch (error) {
        console.error("Error updating cell:", error);
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
        columnVisibility,
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
      onColumnVisibilityChange: handleColumnVisibilityChange,
    }),
    [
      rows,
      tableColumns,
      rowSelection,
      columnSizing,
      handleColumnSizingChange,
      handleRowSelectionChange,
      handleUpdateData,
      columnVisibility,
      handleColumnVisibilityChange,
    ],
  );
};
