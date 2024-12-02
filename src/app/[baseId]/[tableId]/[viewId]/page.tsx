"use client";
import { useState, useCallback, useEffect } from "react";
import Toolbar from "~/app/_components/home/ToolBar/toolBar";
import ViewSideBar from "~/app/_components/home/Table/ViewSideBar";
import { DataTable } from "~/app/_components/home/Table/DataTable";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { type SortCondition } from "~/app/_components/home/ToolBar/SortModal";
import { type SimpleColumn } from "~/app/_components/home/Table/types";

type SortedColumn = {
  column: SimpleColumn;
  order: "asc" | "desc";
};

export default function TablePage() {
  const { tableId, baseId, viewId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [openViewBar, setOpenViewBar] = useState(false);
  const [openSortModal, setOpenSortModal] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [sortConditions, setSortConditions] = useState<SortCondition[]>([]);
  const [sortedColumns, setSortedColumns] = useState<SortedColumn[]>([]);

  const { data: columns, isLoading: loadingColumns } =
    api.columns.getByTableId.useQuery({ tableId: tableId as string });

  const { data: initialSortConditions, isLoading } =
    api.view.getSortConditions.useQuery({
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

  const handleSort = useCallback((conditions: SortCondition[]) => {
    setSortConditions(conditions);
  }, []);

  return (
    <div className="relative">
      <Toolbar
        handleSearch={setSearchQuery}
        openViewBar={openViewBar}
        setOpenViewBar={setOpenViewBar}
        openSortModal={openSortModal}
        setOpenSortModal={setOpenSortModal}
        openFilterModal={openFilterModal}
        setOpenFilterModal={setOpenFilterModal}
        columns={columns}
        loadingColumns={loadingColumns}
        onSort={handleSort}
        viewId={viewId as string}
        sortConditions={sortConditions}
        setSortedColumns={setSortedColumns}
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

        {/* Main content */}
        <div className="flex-1">
          <DataTable
            tableId={tableId as string}
            searchQuery={searchQuery}
            columns={columns}
            loadingColumns={loadingColumns}
            sortConditions={sortConditions}
            sortedColumns={sortedColumns}
          />
        </div>
      </div>
    </div>
  );
}
