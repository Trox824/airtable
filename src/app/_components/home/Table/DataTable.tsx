"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  CellContext,
} from "@tanstack/react-table";
import { useState, useMemo, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { CellType, ColumnType, Row } from "./types";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";

// Define a union type for cell values
type CellValue = string | number | null;

export function DataTable({ tableId }: { tableId: string }) {
  const [rowSelection, setRowSelection] = useState({});
  const { data: columns, isLoading: loadingColumns } =
    api.columns.getByTableId.useQuery({ tableId });
  const { data: rows, isLoading: loadingRows } = api.rows.getByTableId.useQuery(
    { tableId },
  );

  // State to manage dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Refs for handling outside clicks
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if either columns or rows are loading
  const isLoading = loadingColumns || loadingRows;

  // Skeleton loading UI
  const renderSkeleton = () => (
    <div className="skeleton-loader">
      {/* Add your skeleton loading styles here */}
      <div className="skeleton-header">Loading...</div>
      <div className="skeleton-row">Loading...</div>
      <div className="skeleton-row">Loading...</div>
    </div>
  );

  const utils = api.useUtils();
  const addColumn = api.columns.create.useMutation({
    onMutate: async (newColumn) => {
      await utils.columns.getByTableId.cancel({ tableId });
      const previousColumns = utils.columns.getByTableId.getData({ tableId });

      const id = "temp-id-" + Math.random().toString(36).substr(2, 9);
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
      // Always refetch after error or success
      await utils.columns.getByTableId.invalidate({ tableId });
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  const addRow = api.rows.create.useMutation({
    onMutate: async () => {
      // Cancel any outgoing refetches
      await utils.rows.getByTableId.cancel({ tableId });

      // Snapshot the previous value
      const previousRows = utils.rows.getByTableId.getData({ tableId });

      // Create empty cells for the new row
      const id = "temp-id-" + Math.random().toString(36).substr(2, 9);
      const emptyCells = (columns ?? []).map((column) => ({
        id: "temp-cell-id-" + Math.random().toString(36).substr(2, 9),
        valueText: null,
        valueNumber: null,
        column,
        columnId: column.id,
        rowId: id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const optimisticRow = {
        id,
        tableId,
        cells: emptyCells,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistically update to the new value
      utils.rows.getByTableId.setData({ tableId }, (oldRows) => [
        ...(oldRows ?? []),
        optimisticRow,
      ]);

      // Return a context object with the snapshotted value
      return { previousRows };
    },
    onError: (err, newRow, context) => {
      // Rollback to the previous value
      if (context?.previousRows) {
        utils.rows.getByTableId.setData({ tableId }, context.previousRows);
      }
    },
    onSettled: async () => {
      // Always refetch after error or success
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  // Initialize column helper
  const columnHelper = createColumnHelper<Row>();

  // TRPC Mutation for updating cells
  const updateCell = api.cells.update.useMutation({
    onMutate: async (updatedCell) => {
      await utils.rows.getByTableId.cancel({ tableId });

      const previousRows = utils.rows.getByTableId.getData({ tableId });

      utils.rows.getByTableId.setData({ tableId }, (oldRows) =>
        oldRows?.map((row) => ({
          ...row,
          cells: row.cells.map((cell) => {
            if (cell.id !== updatedCell.id) return cell;
            return {
              ...cell,
              valueText: updatedCell.valueText ?? cell.valueText,
              valueNumber: updatedCell.valueNumber ?? cell.valueNumber,
              updatedAt: new Date(),
            };
          }),
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

  // Define a union type for cell values
  type CellValue = string | number | null;

  // Convert columns to table format with proper typing
  const tableColumns: ColumnDef<Row, CellValue>[] = useMemo(() => {
    if (!columns) return [];

    return [
      // Selection Column
      columnHelper.display({
        id: "select",
        cell: ({ row }) => (
          <span className="flex items-center">
            <span className="ml-2 w-2 text-center text-[12px] font-light text-gray-500">
              {row.index + 1}
            </span>
          </span>
        ),
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-3 w-3 rounded border-gray-300"
          />
        ),
        size: 40,
      }),
      // Dynamic columns from database
      ...columns.map((column) =>
        columnHelper.accessor(
          (row) => {
            const cell = row.cells.find((c) => c.column.id === column.id);
            if (column.type === "Text") {
              return cell?.valueText ?? "";
            } else if (column.type === "Number") {
              return cell?.valueNumber ?? 0;
            }
            return null; // Fallback for unexpected types
          },
          {
            id: column.id,
            header: () => (
              <div className="contentWrapper">
                <div className="flex items-center gap-2">
                  <div className="relative" title={column.type}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      className="flex-none"
                    >
                      <use
                        fill="currentColor"
                        fillOpacity="0.75"
                        href="/icons/icon_definitions.svg#TextAlt"
                      />
                    </svg>
                  </div>
                  <span className="name">
                    <div className="flex w-full items-center justify-between">
                      <div className="truncate-pre">{column.name}</div>
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          className="opacity-75"
                        >
                          <use
                            fill="currentColor"
                            fillOpacity="0.75"
                            href="/icons/icon_definitions.svg#ChevronDown"
                          />
                        </svg>
                      </div>
                    </div>
                  </span>
                </div>
              </div>
            ),
            cell: (info) => <CellRenderer info={info} />,
          },
        ),
      ),
    ];
  }, [columns, updateCell, columnHelper]);

  // Define the CellRenderer with proper typing
  const CellRenderer = ({ info }: { info: CellContext<Row, CellValue> }) => {
    const { row, column, getValue } = info;
    const cell = row.original.cells.find((c) => c.column.id === column.id);
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState<
      string | number | null | undefined
    >(null);

    useEffect(() => {
      if (isEditing) {
        setInputValue(
          cell?.column.type === "Text"
            ? (cell?.valueText ?? "")
            : (cell?.valueNumber ?? 0),
        );
      }
    }, [isEditing, cell]);

    const handleClick = () => {
      setIsEditing(true);
    };

    const handleBlur = () => {
      if (cell) {
        if (cell.column.type === "Text" && typeof inputValue === "string") {
          updateCell.mutate({
            id: cell.id,
            valueText: inputValue,
          });
        } else if (
          cell.column.type === "Number" &&
          typeof inputValue === "number"
        ) {
          updateCell.mutate({
            id: cell.id,
            valueNumber: inputValue,
          });
        }
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleBlur();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(cell?.column.type === "Text" ? value : Number(value));
    };

    if (isEditing) {
      if (cell?.column.type === "Text") {
        return (
          <input
            type="text"
            value={inputValue ?? ""}
            autoFocus
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full rounded border border-gray-300 p-1.5"
          />
        );
      } else if (cell?.column.type === "Number") {
        return (
          <input
            type="number"
            value={inputValue ?? ""}
            autoFocus
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full rounded border border-gray-300 p-1.5"
          />
        );
      }
    }

    return (
      <div className="w-full p-1.5" onClick={handleClick} title="Click to edit">
        {getValue()}
      </div>
    );
  };

  const handleCreateColumn = (name: string, type: ColumnType) => {
    addColumn.mutate({
      tableId,
      name,
      type,
    });
    setIsDropdownOpen(false); // Close the dropdown after submission
  };

  // Update row creation
  const handleAddRow = () => {
    addRow.mutate({ tableId });
  };

  // Initialize table instance
  const table = useReactTable({
    data: rows ?? [],
    columns: tableColumns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 top-[calc(theme(spacing.navbar)+2rem+theme(spacing.toolbar))] flex flex-row overflow-auto bg-[#f8f8f8]">
        {isLoading ? (
          renderSkeleton()
        ) : (
          <table className="relative w-full cursor-pointer border-r-0 p-0">
            <TableHeader
              table={table}
              isDropdownOpen={isDropdownOpen}
              buttonRef={buttonRef}
              dropdownRef={dropdownRef}
              onCreateColumn={handleCreateColumn}
              setIsDropdownOpen={setIsDropdownOpen}
            />
            <TableBody
              table={table}
              columns={tableColumns as ColumnDef<Row>[]}
              handleAddRow={handleAddRow}
            />
          </table>
        )}
      </div>
    </>
  );
}
