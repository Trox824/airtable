"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import Toolbar from "~/app/_components/home/ToolBar/toolBar";
import ViewSideBar from "~/app/_components/home/Table/ViewSideBar";
import { DataTable } from "~/app/_components/home/Table/DataTable";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import {
  type SortCondition,
  type SortedColumn,
  type FilterCondition,
} from "../../../Types/types";
import { TableTabs } from "~/app/_components/home/TableTabs";
export default function TablePage() {
  const { tableId, baseId, viewId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [openViewBar, setOpenViewBar] = useState(false);
  const [openSortModal, setOpenSortModal] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [sortConditions, setSortConditions] = useState<SortCondition[]>([]);
  const [sortedColumns, setSortedColumns] = useState<SortedColumn[]>([]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    [],
  );
  const [isTableCreating, setIsTableCreating] = useState(false);

  const { data: columns, isLoading: loadingColumns } =
    api.columns.getByTableId.useQuery({ tableId: tableId as string });

  const { data: initialSortConditions, isLoading } =
    api.view.getSortConditions.useQuery({
      viewId: viewId as string,
    });

  const { data: initialFilterConditions } =
    api.view.getFilterConditions.useQuery({
      viewId: viewId as string,
    });

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

  const handleSort = useCallback((conditions: SortCondition[]) => {
    setSortConditions(conditions);
  }, []);

  const memoizedColumns = useMemo(() => columns, [columns]);
  const memoizedSortConditions = useMemo(
    () => sortConditions,
    [sortConditions],
  );
  const memoizedSortedColumns = useMemo(() => sortedColumns, [sortedColumns]);
  const memoizedFilterConditions = useMemo(
    () => filterConditions,
    [filterConditions],
  );

  const memoizedTableId = useMemo(() => tableId as string, [tableId]);
  const memoizedSearchQuery = useMemo(() => searchQuery, [searchQuery]);

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
      />
      <div className="mt-[calc(theme(spacing.navbar)+2rem+theme(spacing.toolbar))] flex">
        {/* Sidebar */}
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
            loadingColumns={loadingColumns}
            sortConditions={memoizedSortConditions}
            sortedColumns={memoizedSortedColumns}
            filterConditions={memoizedFilterConditions}
            isTableCreating={isTableCreating}
            setIsTableCreating={setIsTableCreating}
          />
        </div>
      </div>
    </div>
  );
}
