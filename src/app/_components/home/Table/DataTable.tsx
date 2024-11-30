// src/app/_components/home/Table/DataTable.tsx
"use client";
import { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
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
import cuid from "cuid";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "react-hot-toast";

interface DataTableProps {
  tableId: string;
  searchQuery: string;
}

export function DataTable({ tableId, searchQuery }: DataTableProps) {
  const [columnSizing, setColumnSizing] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const totalCountQuery = api.rows.totalCount.useQuery({ tableId });
  // API queries
  const { data: columns, isLoading: loadingColumns } =
    api.columns.getByTableId.useQuery({ tableId });
  const {
    data: rowsData,
    isLoading: loadingRows,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = api.rows.getByTableId.useInfiniteQuery(
    {
      tableId,
      limit: 100,
      searchQuery,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: false,
      getPreviousPageParam: (firstPage) => firstPage.nextCursor,
      retry: 1,
    },
  );

  const isLoading = loadingColumns || loadingRows;
  const utils = api.useUtils();

  // Mutations
  const addColumn = api.columns.create.useMutation({
    onMutate: async (newColumn) => {
      await utils.columns.getByTableId.cancel({ tableId });
      const previousColumns = utils.columns.getByTableId.getData({ tableId });
      const id = cuid();
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

  const addRow = api.rows.create.useMutation({
    onMutate: async () => {
      await utils.rows.getByTableId.cancel({
        tableId,
        limit: 100,
        searchQuery,
      });
      const previousData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 100,
        searchQuery,
      });

      const id = cuid();
      const emptyCells = (columns ?? []).map((column) => ({
        id: cuid(),
        valueText: null,
        valueNumber: null,
        column: {
          type: column.type,
          name: column.name,
          id: column.id,
          tableId: tableId,
        },
        columnId: column.id,
        rowId: id,
      }));

      const optimisticRow = {
        id,
        tableId,
        cells: emptyCells,
      } as Row;

      utils.rows.getByTableId.setInfiniteData(
        { tableId, limit: 100, searchQuery },
        (oldData) => {
          if (!oldData) return oldData;

          const newPages = [...(oldData.pages ?? [])];
          newPages[0] = {
            ...oldData.pages[0],
            items: [...(oldData.pages[0]?.items ?? []), optimisticRow],
            totalCount: (oldData.pages[0]?.totalCount ?? 0) + 1,
            nextCursor: oldData.pages[0]?.nextCursor,
          };
          return {
            pages: newPages,
            pageParams: oldData.pageParams,
          };
        },
      );

      return { previousData };
    },

    onError: (err, newRow, context) => {
      if (context?.previousData) {
        utils.rows.getByTableId.setInfiniteData(
          { tableId, limit: 100, searchQuery },
          context.previousData,
        );
      }
    },
    onSettled: async () => {
      await utils.rows.getByTableId.invalidate({ tableId });
    },
  });

  const rows = useMemo(
    () => rowsData?.pages.flatMap((page) => page.items) ?? [],
    [rowsData],
  );
  const columnMap = useMemo(() => {
    const map = new Map<string, ColumnMeta>();
    columns?.forEach((col) =>
      map.set(col.id, { type: col.type, name: col.name }),
    );
    return map;
  }, [columns]);

  // Column helper and table columns
  const columnHelper = createColumnHelper<Row>();

  // Define table columns based on separate column data
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

    const dataColumns =
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
            cell: (info) => (
              <CellRenderer info={info} setEditing={setIsEditing} />
            ),
          },
        ),
      ) ?? [];

    return [selectColumn, ...dataColumns];
  }, [columns, columnMap, setIsEditing]);

  const updateCell = api.cells.update.useMutation({
    onMutate: async (newCell) => {
      await utils.rows.getByTableId.cancel({
        tableId,
        limit: 100,
        searchQuery,
      });

      const previousData = utils.rows.getByTableId.getInfiniteData({
        tableId,
        limit: 100,
        searchQuery,
      });

      // Optimistically update the cell
      utils.rows.getByTableId.setInfiniteData(
        { tableId, limit: 100, searchQuery },
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

      return { previousData };
    },

    onError: (err, newCell, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.rows.getByTableId.setInfiniteData(
          { tableId, limit: 100, searchQuery },
          context.previousData,
        );
      }
      toast.error("Failed to update cell");
    },

    onSettled: async () => {
      // Sync with server
      await utils.rows.getByTableId.invalidate({
        tableId,
        limit: 100,
        searchQuery,
      });
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
          const row = tableData[rowIndex];
          if (!row) {
            console.error("Row not found:", {
              rowIndex,
              availableRows: rows.length,
            });
            return;
          }
          // Find the cell by its ID
          const cell = row.cells.find((c) => c.columnId === columnId);
          if (!cell) {
            console.error("Cell not found:", columnId);
            return;
          }

          updateCell.mutate({
            id: cell.id,
            valueText: cell.column.type === "Text" ? String(value) : undefined,
            valueNumber:
              cell.column.type === "Number" ? Number(value) : undefined,
          });
        },
      },
    }),
    [tableData, tableColumns, rowSelection, columnSizing, updateCell, rows],
  );
  const table = useReactTable<Row>(tableConfig as unknown as TableOptions<Row>);

  // Add virtualization ref
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Modify the virtualization configuration
  const rowVirtualizer = useVirtualizer({
    count: searchQuery
      ? (rowsData?.pages[0]?.totalCount ?? 0)
      : (totalCountQuery.data ?? 0),
    getScrollElement: () => tableContainerRef.current,
    estimateSize: useCallback(() => 32, []),
    overscan: 20,
    onChange: (instance) => {
      // Use getVirtualItems() to get the current visible range
      const virtualItems = instance.getVirtualItems();
      const lastItem = virtualItems[virtualItems.length - 1];

      if (!lastItem) return;

      const totalLoadedItems = rows.length;

      // Start loading next page when user scrolls past 70% of loaded items
      if (
        lastItem.index >= Math.floor(totalLoadedItems * 0.7) &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage();
      }
    },
  });
  return (
    <>
      <div className="fixed bottom-[40px] left-0 right-0 top-[calc(theme(spacing.navbar)+2rem+theme(spacing.toolbar))] flex flex-col bg-[#f8f8f8]">
        {isLoading ? (
          <TableLoading />
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="flex h-full flex-col">
              <div className="flex-none">
                <table
                  className="w-full cursor-pointer border-r-0"
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
                </table>
              </div>
              <div ref={tableContainerRef} className="flex-1 overflow-auto">
                <table
                  className="relative w-full cursor-pointer border-r-0"
                  style={{
                    width: table.getCenterTotalSize(),
                    height: `${rowVirtualizer.getTotalSize()}px`,
                  }}
                >
                  <TableBody
                    table={table}
                    columns={tableColumns as ColumnDef<Row>[]}
                    handleAddRow={handleAddRow}
                    setEditing={setIsEditing}
                    searchQuery={searchQuery}
                    virtualizer={
                      rowVirtualizer as unknown as ReturnType<
                        typeof useVirtualizer
                      >
                    }
                  />
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 h-[40px] w-full border-t border-gray-300 bg-white p-2 text-xs text-gray-500">
        {rows?.length} records
      </div>
    </>
  );
}

export function TableLoading() {
  return (
    <div className="text-center">
      <TableLoadingState />
    </div>
  );
}
