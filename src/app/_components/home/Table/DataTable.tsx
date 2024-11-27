// src/app/_components/home/Table/DataTable.tsx
"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { api } from "~/trpc/react";
import { CellRenderer } from "./CellRender";
import { TableLoadingState } from "./TableLoading";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  type CellContext,
  ColumnDef,
  TableOptions,
} from "@tanstack/react-table";
import { Row, type ColumnMeta } from "./types";
import { ColumnType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

interface TableMeta {
  updateData: (rowIndex: number, columnId: string, value: unknown) => void;
}

export function DataTable({ tableId }: { tableId: string }) {
  const [columnSizing, setColumnSizing] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // API queries
  const { data: columns, isLoading: loadingColumns } =
    api.columns.getByTableId.useQuery({ tableId });

  const {
    data: rows,
    isLoading: loadingRows,
    error,
  } = api.rows.getByTableId.useQuery({ tableId });

  const isLoading = loadingColumns || loadingRows;
  const isNewTable = !isLoading && (!columns?.length || !rows?.length);
  const utils = api.useUtils();

  // Mutations
  const addColumn = api.columns.create.useMutation({
    onMutate: async (newColumn) => {
      await utils.columns.getByTableId.cancel({ tableId });
      const previousColumns = utils.columns.getByTableId.getData({ tableId });
      const id = uuidv4();
      const optimisticColumn = {
        id,
        tableId: newColumn.tableId,
        name: newColumn.name,
        type: newColumn.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      utils.columns.getByTableId.setData({ tableId }, (oldColumns) => [
        ...(oldColumns ?? []),
        optimisticColumn,
      ]);

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
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  const handleAddRowMutate = useCallback(async () => {
    console.log("Adding row");
    await utils.rows.getByTableId.cancel({ tableId });
    const previousRows = utils.rows.getByTableId.getData({ tableId });
    const id = uuidv4();
    const emptyCells = (columns ?? []).map((column) => ({
      id: "temp-cell-id-" + uuidv4(),
      valueText: null,
      valueNumber: null,
      column: {
        type: column.type,
        name: column.name,
        id: column.id,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        tableId: tableId,
        columnDef: tableColumns.find((col) => col.id === column.id) ?? null,
      },
      columnId: column.id,
      rowId: id,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }));

    const optimisticRow = {
      id,
      tableId,
      cells: emptyCells,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    } as Row;

    utils.rows.getByTableId.setData({ tableId }, (oldRows) => [
      ...(oldRows ?? []),
      optimisticRow,
    ]);

    return { previousRows };
  }, [tableId, utils]);

  const addRow = api.rows.create.useMutation({
    onMutate: handleAddRowMutate,
    onError: (err, newRow, context) => {
      if (context?.previousRows) {
        utils.rows.getByTableId.setData({ tableId }, context.previousRows);
      }
    },
    onSettled: async () => {
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  // Add initialization mutation
  const initializeTable = api.tables.initialize.useMutation({
    onSettled: async () => {
      await utils.columns.getByTableId.invalidate({ tableId });
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  // Add effect to handle initialization
  useEffect(() => {
    if (isNewTable) {
      initializeTable.mutate({ tableId });
    }
  }, [isNewTable, tableId]);

  // Column helper and table columns
  const columnHelper = createColumnHelper<Row>();

  const tableColumns = useMemo(() => {
    const selectColumn = columnHelper.accessor((row) => row.id, {
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
    });

    return [
      selectColumn,
      ...(columns ?? []).map((column) =>
        columnHelper.accessor(
          (row) => {
            const cell = row.cells.find((c) => c.columnId === column.id);
            if (column.type === "Text") {
              return cell?.valueText ?? "";
            } else if (column.type === "Number") {
              return cell?.valueNumber ?? null;
            }
            return null;
          },
          {
            id: column.id,
            meta: {
              type: column.type,
              name: column.name,
            } as ColumnMeta,
            header: column.name,
            cell: (info) => (
              <div className="flex items-center">
                <CellRenderer info={info} setEditing={setIsEditing} />
              </div>
            ),
          },
        ),
      ),
    ];
  }, [columns, setIsEditing]);

  const updateCell = api.cells.update.useMutation({
    onMutate: async (newCell) => {
      await utils.rows.getByTableId.cancel({ tableId });
      const previousRows = utils.rows.getByTableId.getData({ tableId });

      utils.rows.getByTableId.setData({ tableId }, (oldRows) =>
        oldRows?.map((row) => ({
          ...row,
          cells: row.cells.map((cell) =>
            cell.id === newCell.id ? { ...cell, ...newCell } : cell,
          ),
        })),
      );

      return { previousRows };
    },
    onError: (err, newCell, context) => {
      if (context?.previousRows) {
        utils.rows.getByTableId.setData({ tableId }, context.previousRows);
      }
    },
    onSettled: async () => {
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  // Add the rename mutation near other mutations
  const renameColumn = api.columns.rename.useMutation({
    onMutate: async (newColumn) => {
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

  // Handlers
  const handleCreateColumn = useCallback(
    (name: string, type: ColumnType) => {
      addColumn.mutate({ tableId, name, type });
      setIsDropdownOpen(false);
    },
    [addColumn, tableId],
  );

  const handleAddRow = useCallback(() => {
    addRow.mutate({ tableId });
  }, [addRow, tableId]);

  // Add the handler function near other handlers
  const handleRenameColumn = useCallback(
    (columnId: string, name: string) => {
      renameColumn.mutate({ columnId, name });
    },
    [renameColumn],
  );

  // Table setup
  const tableData = useMemo(
    () =>
      (rows ?? []).map((row) => ({
        ...row,
        cells: row.cells.map((cell) => ({
          ...cell,
          column: {
            ...cell.column,
            columnDef:
              tableColumns.find((col) => col.id === cell.columnId) ?? null,
          },
        })),
      })),
    [rows, tableColumns],
  );

  // Create table config outside of hooks
  const tableConfig = useMemo(
    () => ({
      data: tableData,
      columns: tableColumns,
      state: {
        rowSelection,
        columnSizing,
      },
      onColumnSizingChange: setColumnSizing,
      columnResizeMode: "onChange",
      enableColumnResizing: true,
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      getCoreRowModel: getCoreRowModel(),
      meta: {
        updateData: (rowIndex: number, columnId: string, value: unknown) => {
          const row = rows?.[rowIndex];
          const cell = row?.cells.find((c) => c.columnId === columnId);
          if (cell) {
            const isText = cell.column.type === "Text";
            updateCell.mutate({
              id: cell.id,
              valueText: isText ? (value as string) : undefined,
              valueNumber: !isText ? (value as number) : undefined,
            });
          }
        },
      } as TableMeta,
    }),
    [tableData, tableColumns, rowSelection, columnSizing, rows, updateCell],
  );
  const table = useReactTable<Row>(tableConfig as TableOptions<Row>);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 top-[calc(theme(spacing.navbar)+2rem+theme(spacing.toolbar))] flex flex-row overflow-auto bg-[#f8f8f8]">
        {isLoading || initializeTable.isPending ? (
          <div className="flex h-full w-full items-center justify-center">
            <TableLoading
              message={
                initializeTable.isPending
                  ? "Initializing table..."
                  : "Loading..."
              }
            />
          </div>
        ) : (
          <div className="w-fit">
            <table
              className="relative w-full cursor-pointer border-r-0 p-0"
              style={{ width: table.getCenterTotalSize() }}
            >
              <TableHeader
                table={table}
                isDropdownOpen={isDropdownOpen}
                buttonRef={buttonRef}
                dropdownRef={dropdownRef}
                onCreateColumn={handleCreateColumn}
                onRenameColumn={handleRenameColumn}
                setIsDropdownOpen={setIsDropdownOpen}
              />
              <TableBody
                table={table}
                columns={tableColumns as ColumnDef<Row>[]}
                handleAddRow={handleAddRow}
                setEditing={setIsEditing}
              />
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export function TableLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="text-center">
      <div className="mb-2">{message}</div>
      <TableLoadingState />
    </div>
  );
}
