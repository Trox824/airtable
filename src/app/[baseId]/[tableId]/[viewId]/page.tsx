"use client";
// 1. Import grouping
import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { type VisibilityState, type OnChangeFn } from "@tanstack/react-table";

// Local imports
import Toolbar from "~/app/_components/home/ToolBar/toolBar";
import ViewSideBar from "~/app/_components/home/Table/ViewSideBar";
import { DataTable } from "~/app/_components/home/Table/DataTable";
import { TableTabs } from "~/app/_components/home/TableTabs";
import { api } from "~/trpc/react";
import {
  type SortCondition,
  type SortedColumn,
  type FilterCondition,
  SimpleColumn,
} from "../../../Types/types";

export default function TablePage() {
  // 2. Route params
  const { tableId, baseId, viewId } = useParams();

  // 3. API queries
  const { data: columns, isLoading: loadingColumns } =
    api.columns.getByTableId.useQuery({ tableId: tableId as string });
  const { data: initialSortConditions } = api.view.getSortConditions.useQuery({
    viewId: viewId as string,
  });
  const { data: initialFilterConditions } =
    api.view.getFilterConditions.useQuery({
      viewId: viewId as string,
    });
  const { data: columnOrder } = api.view.getColumnOrder.useQuery({
    viewId: viewId as string,
  });
  const { data: initialVisibility } = api.view.getColumnVisibility.useQuery(
    { viewId: viewId as string },
    {
      // Ensure the query stays fresh
      staleTime: 0,
      // Optional: refetch on window focus
      refetchOnWindowFocus: true,
    },
  );

  // 4. UI state
  const [openViewBar, setOpenViewBar] = useState(false);
  const [openSortModal, setOpenSortModal] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [isTableCreating, setIsTableCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 5. Table state
  const [sortConditions, setSortConditions] = useState<SortCondition[]>([]);
  const [sortedColumns, setSortedColumns] = useState<SortedColumn[]>([]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    [],
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [localColumns, setLocalColumns] = useState<SimpleColumn[]>([]);

  // Add utils for invalidation
  const utils = api.useUtils();

  // 6. Effects
  useEffect(() => {
    if (initialSortConditions && columns) {
      setSortedColumns(
        initialSortConditions
          .map((condition) => ({
            column: columns.find((col) => col.id === condition.columnId)!,
            order: condition.order,
          }))
          .filter((sort) => sort.column !== undefined),
      );
      setSortConditions(initialSortConditions);
    }
  }, [initialSortConditions, columns]);

  useEffect(() => {
    if (initialFilterConditions) {
      setFilterConditions(initialFilterConditions);
    }
  }, [initialFilterConditions]);

  useEffect(() => {
    if (columns && columnOrder) {
      const orderedColumns = [...columns].sort((a, b) => {
        const orderA =
          columnOrder.find((o) => o.columnId === a.id)?.order ?? Infinity;
        const orderB =
          columnOrder.find((o) => o.columnId === b.id)?.order ?? Infinity;
        return orderA - orderB;
      });
      setLocalColumns(orderedColumns);
    } else if (columns) {
      setLocalColumns(columns);
    }
  }, [columns, columnOrder]);

  useEffect(() => {
    if (initialVisibility?.columnVisibility) {
      try {
        const parsedVisibility = JSON.parse(
          initialVisibility.columnVisibility as string,
        ) as VisibilityState;
        setColumnVisibility(parsedVisibility);
      } catch (error) {
        console.error("Failed to parse column visibility:", error);
      }
    }
  }, []);

  // 7. Memoized values
  const memoizedColumns = useMemo(() => localColumns, [localColumns]);
  const memoizedTableId = useMemo(() => tableId as string, [tableId]);
  const memoizedSearchQuery = useMemo(() => searchQuery, [searchQuery]);
  const memoizedSortConditions = useMemo(
    () => sortConditions,
    [sortConditions],
  );
  const memoizedSortedColumns = useMemo(() => sortedColumns, [sortedColumns]);
  const memoizedFilterConditions = useMemo(
    () => filterConditions,
    [filterConditions],
  );

  // 8. Handlers
  const handleSort = useCallback((conditions: SortCondition[]) => {
    setSortConditions(conditions);
  }, []);

  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> = useCallback(
    (updaterOrValue) => {
      const newVisibility =
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnVisibility)
          : updaterOrValue;

      setColumnVisibility(newVisibility);
    },
    [],
  );

  // 9. Render
  return (
    <div className="relative">
      <TableTabs
        tableId={tableId as string}
        baseId={baseId as string}
        viewId={viewId as string}
        setIsTableCreating={setIsTableCreating}
      />
      <Toolbar
        handleSearch={setSearchQuery}
        openViewBar={openViewBar}
        setOpenViewBar={setOpenViewBar}
        openSortModal={openSortModal}
        setOpenSortModal={setOpenSortModal}
        openFilterModal={openFilterModal}
        setOpenFilterModal={setOpenFilterModal}
        columns={memoizedColumns}
        loadingColumns={loadingColumns}
        onSort={handleSort}
        viewId={viewId as string}
        sortConditions={memoizedSortConditions}
        setSortedColumns={setSortedColumns}
        filterConditions={memoizedFilterConditions}
        setFilterConditions={setFilterConditions}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        setColumns={setLocalColumns}
      />
      <div className="mt-[calc(theme(spacing.navbar)+2rem+theme(spacing.toolbar))] flex">
        <div
          className={`transition-all duration-300 ${openViewBar ? "w-[300px]" : "w-0"}`}
        >
          {openViewBar && (
            <ViewSideBar
              baseId={baseId as string}
              tableId={tableId as string}
              viewId={viewId as string}
            />
          )}
        </div>
        <div className="flex-1">
          <DataTable
            tableId={memoizedTableId}
            searchQuery={memoizedSearchQuery}
            columns={memoizedColumns}
            sortConditions={memoizedSortConditions}
            sortedColumns={memoizedSortedColumns}
            filterConditions={memoizedFilterConditions}
            isTableCreating={isTableCreating}
            setIsTableCreating={setIsTableCreating}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
          />
        </div>
      </div>
    </div>
  );
}
