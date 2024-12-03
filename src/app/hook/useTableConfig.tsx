// src/app/hook/useTableConfig.ts

import { useMemo, useCallback } from "react";
import { getCoreRowModel, type ColumnDef } from "@tanstack/react-table";
import { type Row } from "../Types/types";
import { type ColumnMeta } from "../Types/types"; // Ensure you have this type defined

interface TableConfigProps<T extends Row> {
  rows: T[];
  tableColumns: ColumnDef<T, unknown>[];
  rowSelection: Record<string, boolean>;
  columnSizing: Record<string, number>;
  setColumnSizing: (sizing: Record<string, number>) => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
  updateCell: (params: {
    id: string;
    valueText?: string | null;
    valueNumber?: number | null;
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
      if (!row) return;
      const cell = row.cells.find((c) => c.columnId === columnId);
      if (!cell) return;
      const columnDef = tableColumns.find((col) => col.id === columnId);
      if (!columnDef) {
        console.warn(`Column with ID "${columnId}" not found.`);
        return;
      }

      // Extract column metadata (ensure you have `ColumnMeta` defined appropriately)
      const columnMeta = columnDef.meta as ColumnMeta | undefined;
      if (!columnMeta) {
        console.warn(`Column metadata for "${columnId}" is undefined.`);
        return;
      }

      const columnType = columnMeta.type;

      // Prepare the update object based on column type
      const updateObj: {
        id: string;
        valueText?: string | null;
        valueNumber?: number | null;
      } = { id: cell.id };

      if (columnType === "Number") {
        // Ensure the value is a number or null
        const numberValue =
          value !== null && value !== undefined ? Number(value) : null;
        updateObj.valueNumber = isNaN(numberValue as number)
          ? null
          : (numberValue as number);
        updateObj.valueText = null; // Reset valueText
      } else if (columnType === "Text") {
        // Ensure the value is a string or null
        const textValue =
          value !== null && value !== undefined ? String(value) : null;
        updateObj.valueText = textValue;
        updateObj.valueNumber = null; // Reset valueNumber
      } else {
        // Handle other column types if any
        // For now, we can ignore or throw an error
        console.warn(`Unsupported column type: ${columnType}`);
        return;
      }

      // Call the mutation to update the cell
      updateCell(updateObj);
    },
    [rows, tableColumns, updateCell],
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
