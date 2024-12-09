// src/app/_components/home/Table/DataTable.tsx
"use client";
import { useState, useRef, memo, useCallback, useMemo, useEffect } from "react";
import { TableLoadingState } from "./TableLoading";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import { ColumnDef, useReactTable } from "@tanstack/react-table";
import { SortedColumn } from "../../../Types/types";
import { type ColumnType } from "@prisma/client";
import {
  type SimpleColumn,
  type FilterCondition,
  type SortCondition,
} from "../../../Types/types";
import { useTableQuery } from "~/app/hooks/useTableQuery";
import { useTableMutations } from "~/app/hooks/useTableMutations";
import { useTableColumns } from "~/app/hooks/useTableColumns";
import { useTableVirtualizer } from "~/app/hooks/useTableVirtualizer";
import { useTableConfig } from "~/app/hooks/useTableConfig";
import { type Row } from "../../../Types/types";
import { api } from "~/trpc/react";
interface UpdateCellParams {
  id: string;
  valueText?: string | null;
  valueNumber?: number | null;
}

interface DataTableProps {
  tableId: string;
  searchQuery: string;
  columns: SimpleColumn[] | undefined;
  sortConditions: SortCondition[];
  sortedColumns: SortedColumn[];
  filterConditions: FilterCondition[];
  isTableCreating: boolean;
  setIsTableCreating: (isCreating: boolean) => void;
}

const useTotalRowCount = (tableId: string, shouldRefetch: boolean) => {
  const [optimisticCount, setOptimisticCount] = useState(0);
  const totalCountQuery = api.rows.totalCount.useQuery(
    { tableId },
    { enabled: true },
  );

  useEffect(() => {
    if (totalCountQuery.data !== undefined) {
      setOptimisticCount(totalCountQuery.data);
    }
  }, [totalCountQuery.data]);

  return {
    totalRowCount: optimisticCount,
    incrementCount: () => setOptimisticCount((prev) => prev + 1),
  };
};

export const DataTable = memo(
  ({
    tableId,
    searchQuery,
    columns,
    sortConditions,
    sortedColumns,
    filterConditions,
    isTableCreating,
    setIsTableCreating,
  }: DataTableProps) => {
    // State
    const [columnSizing, setColumnSizing] = useState<Record<string, number>>(
      {},
    );
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
      {},
    );
    const [isEditing, setIsEditing] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [shouldRefetchCount, setShouldRefetchCount] = useState(false);

    const { totalRowCount, incrementCount } = useTotalRowCount(
      tableId,
      shouldRefetchCount,
    );

    // Refs
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Query data
    const {
      data: rowsData,
      isLoading: loadingRows,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
    } = useTableQuery(tableId, searchQuery, sortConditions, filterConditions);

    // Mutations
    const { addColumn, addRow, updateCell, updateTempCell, renameColumn } =
      useTableMutations(
        tableId,
        searchQuery,
        sortConditions,
        filterConditions,
        columns ?? [],
        setIsTableCreating,
      );

    // Memoize handlers
    const handleUpdateCell = useCallback(
      (params: UpdateCellParams) => {
        if (!params.id) {
          console.error("Cell ID is required for updates");
          return;
        }
        updateCell.mutate(params);
      },
      [updateCell],
    );

    // Memoize rows
    const rows = useMemo(
      () => rowsData?.pages.flatMap((page) => page.items) ?? [],
      [rowsData],
    );

    // Move useTableColumns to the top level
    const tableColumns = useTableColumns(columns, setIsEditing);

    // Update the memoized table columns to use the result instead of the hook
    const memoizedTableColumns = useMemo(() => tableColumns, [tableColumns]);

    // Table configuration with memoized values
    const tableConfig = useTableConfig({
      rows: rows as Row[],
      tableColumns: memoizedTableColumns as ColumnDef<Row>[],
      rowSelection,
      columnSizing,
      setColumnSizing,
      setRowSelection,
      updateCell: { mutate: handleUpdateCell },
      updateTempCell,
    });

    // Create table instance
    const table = useReactTable(tableConfig);

    // Handlers
    const handleCreateColumn = (name: string, type: ColumnType) => {
      addColumn.mutate({ tableId, name, type });
      setIsDropdownOpen(false);
    };

    const handleFetchNextPage = useCallback(() => {
      void fetchNextPage();
    }, [fetchNextPage]);

    // Move virtualizer declaration before its usage
    const virtualizer = useTableVirtualizer(
      tableContainerRef,
      totalRowCount,
      rows.length,
      hasNextPage,
      isFetchingNextPage,
      handleFetchNextPage,
    );

    const handleAddRow = useCallback(() => {
      incrementCount();
      addRow.mutate(
        { tableId },
        {
          onSuccess: () => {
            // Force virtualizer to recalculate after row addition
            virtualizer.measure();
            // Scroll to the bottom to show the new row
            if (tableContainerRef.current) {
              tableContainerRef.current.scrollTop =
                tableContainerRef.current.scrollHeight;
            }
          },
        },
      );
      setShouldRefetchCount(true);
    }, [addRow, tableId, incrementCount, virtualizer]);

    // Move handleFetchNextPage before virtualizer

    const handleRenameColumn = (columnId: string, name: string) => {
      renameColumn.mutate({ columnId, name });
    };

    // Reset the refetch flag after the mutation completes
    useEffect(() => {
      if (shouldRefetchCount && !addRow.isPending) {
        setShouldRefetchCount(false);
      }
    }, [shouldRefetchCount, addRow.isPending]);

    return (
      <>
        <div className="flex h-[calc(100vh-theme(spacing.navbar)-4.5rem-theme(spacing.toolbar))] flex-1 flex-col bg-[#f8f8f8]">
          {rows.length === 0 || columns?.length === 0 ? (
            <TableLoadingState loadingMessage={"Loading table..."} />
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
                      onCreateColumn={handleCreateColumn}
                      onRenameColumn={handleRenameColumn}
                      setIsDropdownOpen={setIsDropdownOpen}
                      sortedColumns={sortedColumns}
                    />
                  </table>
                </div>
                <div ref={tableContainerRef} className="flex-1 overflow-auto">
                  <table
                    className="relative w-full cursor-pointer border-r-0"
                    style={{
                      width: table.getCenterTotalSize(),
                      height: `${table.getTotalSize()}px`,
                    }}
                  >
                    <TableBody
                      table={table}
                      columns={memoizedTableColumns as ColumnDef<Row>[]}
                      virtualizer={virtualizer}
                      handleAddRow={handleAddRow}
                      setEditing={setIsEditing}
                      searchQuery={searchQuery}
                      sortedColumns={sortedColumns}
                      filterConditions={filterConditions}
                    />
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="fixed bottom-0 h-[40px] w-full border-t border-gray-300 bg-white p-2 text-xs text-gray-500">
          {rows.length} records
        </div>
      </>
    );
  },
);

// Add display name
DataTable.displayName = "DataTable";
