"use client";
import { useState, useRef, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { SortModal } from "./SortModal";
import FilterModal from "./FilterModal";
import { ColumnType } from "@prisma/client";
import {
  FilterCondition,
  SimpleColumn,
  SortedColumn,
} from "../../../Types/types";
import { type SortCondition } from "../../../Types/types";
import { HideModal } from "./HideModal";
import { type VisibilityState, type OnChangeFn } from "@tanstack/react-table";
import { api } from "~/trpc/react";
interface ToolbarProps {
  handleSearch: (query: string) => void;
  openViewBar: boolean;
  setOpenViewBar: (open: boolean) => void;
  openSortModal: boolean;
  setOpenSortModal: (open: boolean) => void;
  openFilterModal: boolean;
  setOpenFilterModal: (open: boolean) => void;
  columns: SimpleColumn[] | undefined;
  loadingColumns: boolean;
  onSort: (conditions: SortCondition[]) => void;
  viewId: string;
  sortConditions?: SortCondition[];
  setSortedColumns: (columns: SortedColumn[]) => void;
  filterConditions: FilterCondition[];
  setFilterConditions: React.Dispatch<React.SetStateAction<FilterCondition[]>>;

  columnVisibility: VisibilityState;
  onColumnVisibilityChange: OnChangeFn<VisibilityState>;
  setColumns: (columns: SimpleColumn[]) => void;
}

export default function Toolbar({
  handleSearch,
  openViewBar,
  setOpenViewBar,
  openSortModal,
  setOpenSortModal,
  openFilterModal,
  setOpenFilterModal,
  columns,
  loadingColumns,
  onSort,
  viewId,
  sortConditions = [],
  setSortedColumns,
  filterConditions,
  setFilterConditions,

  columnVisibility,
  onColumnVisibilityChange,
  setColumns,
}: ToolbarProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const sortButtonRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const [openHideModal, setOpenHideModal] = useState(false);
  const hideButtonRef = useRef<HTMLDivElement>(null);

  const updateColumnOrderMutation = api.view.updateColumnOrder.useMutation({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sortButtonRef.current &&
        !sortButtonRef.current.contains(event.target as Node) &&
        openSortModal
      ) {
        setOpenSortModal(false);
      }
      if (
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node) &&
        openFilterModal
      ) {
        setOpenFilterModal(false);
      }
      if (
        hideButtonRef.current &&
        !hideButtonRef.current.contains(event.target as Node) &&
        openHideModal
      ) {
        setOpenHideModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    openSortModal,
    setOpenSortModal,
    openFilterModal,
    setOpenFilterModal,
    openHideModal,
    setOpenHideModal,
  ]);

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchValue("");
      handleSearch("");
    }
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    handleSearch(value);
  };

  const toggleViewBar = () => {
    setOpenViewBar(!openViewBar);
  };

  const handleToggleVisibility = (
    columnId: string,
    newVisibility?: Record<string, boolean>,
  ) => {
    if (columnId === "__ALL__" && newVisibility) {
      onColumnVisibilityChange(newVisibility);
    } else {
      onColumnVisibilityChange((prev) => ({
        ...prev,
        [columnId]: !prev[columnId],
      }));
    }
  };

  const handleColumnReorder = (startIndex: number, endIndex: number) => {
    if (!columns) return;

    const newColumns = [...columns];
    const [removed] = newColumns.splice(startIndex, 1);
    if (removed) {
      newColumns.splice(endIndex, 0, removed);
    }

    // Update local state
    setColumns(newColumns);

    // Save to database with view-specific order
    const columnsWithOrder = newColumns.map((col, index) => ({
      id: col.id,
      order: index,
    }));

    updateColumnOrderMutation.mutate({
      viewId,
      columns: columnsWithOrder,
    });
  };

  return (
    <div className="fixed left-0 right-0 top-[calc(theme(spacing.navbar)+2rem)] z-30 flex h-toolbar w-full items-center justify-between border-b border-gray-300 bg-white px-1 py-[5px] text-xs text-gray-700">
      <div className="flex items-center gap-x-3">
        <button
          onClick={toggleViewBar}
          className={`flex cursor-pointer items-center gap-x-2 rounded-sm border border-gray-200/10 p-2 hover:bg-gray-200/60 ${
            openViewBar ? "bg-gray-200" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-list"
          >
            <path d="M3 12h.01"></path>
            <path d="M3 18h.01"></path>
            <path d="M3 6h.01"></path>
            <path d="M8 12h13"></path>
            <path d="M8 18h13"></path>
            <path d="M8 6h13"></path>
          </svg>
          <div>View</div>
        </button>
        <div>|</div>
        <button className="flex cursor-pointer items-center gap-x-2 rounded-sm p-2 hover:bg-gray-200/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-grid2x2"
          >
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
            <path d="M3 12h18"></path>
            <path d="M12 3v18"></path>
          </svg>
          <div>Grid View</div>
        </button>

        <div className="relative" ref={hideButtonRef}>
          <button
            onClick={() => setOpenHideModal(true)}
            className={`flex cursor-pointer items-center gap-x-2 rounded-sm p-2 ${
              Object.values(columnVisibility).includes(false)
                ? "bg-purple-300/40 hover:bg-purple-300/60"
                : "hover:bg-gray-200/60"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`lucide lucide-eye-off ${
                Object.values(columnVisibility).includes(false)
                  ? "text-purple-600"
                  : ""
              }`}
            >
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
              <line x1="2" y1="2" x2="22" y2="22"></line>
            </svg>
            <div
              className={
                Object.values(columnVisibility).includes(false)
                  ? "text-purple-600"
                  : ""
              }
            >
              Hide
            </div>
          </button>

          {openHideModal && (
            <HideModal
              viewId={viewId}
              columns={columns}
              columnVisibility={columnVisibility}
              onToggleVisibility={handleToggleVisibility}
              onColumnReorder={handleColumnReorder}
            />
          )}
        </div>
        <button className="flex cursor-pointer items-center gap-x-2 rounded-sm p-2 hover:bg-gray-200/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-list"
          >
            <path d="M3 12h.01"></path>
            <path d="M3 18h.01"></path>
            <path d="M3 6h.01"></path>
            <path d="M8 12h13"></path>
            <path d="M8 18h13"></path>
            <path d="M8 6h13"></path>
          </svg>
          <div>List</div>
        </button>
        <div className="relative" ref={filterButtonRef}>
          <button
            onClick={() => setOpenFilterModal(true)}
            className={`flex cursor-pointer items-center gap-x-2 rounded-sm p-2 ${
              filterConditions.length > 0
                ? "bg-orange-300/40 hover:bg-red-300/60"
                : "hover:bg-gray-200/60"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`lucide lucide-list-filter ${
                filterConditions.length > 0 ? "text-red-600" : ""
              }`}
            >
              <path d="M3 6h18"></path>
              <path d="M7 12h10"></path>
              <path d="M10 18h4"></path>
            </svg>
            <div className={filterConditions.length > 0 ? "text-red-600" : ""}>
              Filter
            </div>
          </button>

          {openFilterModal && (
            <FilterModal
              columns={columns}
              loading={loadingColumns}
              viewId={viewId}
              filterConditions={filterConditions}
              setFilterConditions={setFilterConditions}
            />
          )}
        </div>
        <button className="flex cursor-pointer items-center gap-x-2 rounded-sm p-2 hover:bg-gray-200/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-group"
          >
            <path d="M3 7V5c0-1.1.9-2 2-2h2"></path>
            <path d="M17 3h2c1.1 0 2 .9 2 2v2"></path>
            <path d="M21 17v2c0 1.1-.9 2-2 2h-2"></path>
            <path d="M7 21H5c-1.1 0-2-.9-2-2v-2"></path>
            <rect width="7" height="5" x="7" y="7" rx="1"></rect>
            <rect width="7" height="5" x="10" y="12" rx="1"></rect>
          </svg>
          <div>Group</div>
        </button>
        <div className="relative" ref={sortButtonRef}>
          <button
            onClick={() => setOpenSortModal(true)}
            className={`flex cursor-pointer items-center gap-x-2 rounded-sm p-2 ${
              sortConditions.length > 0
                ? "bg-blue-300/40 hover:bg-blue-300/60"
                : "hover:bg-gray-200/60"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`lucide lucide-arrow-up-down ${
                sortConditions.length > 0 ? "text-blue-600" : ""
              }`}
            >
              <path d="m21 16-4 4-4-4"></path>
              <path d="M17 20V4"></path>
              <path d="m3 8 4-4 4 4"></path>
              <path d="M7 4v16"></path>
            </svg>
            <div className={sortConditions.length > 0 ? "text-blue-600" : ""}>
              Sort
            </div>
          </button>

          {openSortModal && (
            <SortModal
              columns={columns}
              loading={loadingColumns}
              onSort={(conditions) => {
                onSort(conditions);
                const firstCondition = conditions[0];
                if (
                  conditions.length === 1 &&
                  sortConditions.length === 0 &&
                  columns &&
                  firstCondition?.columnId &&
                  firstCondition?.order
                ) {
                  const sortedColumn = columns.find(
                    (col) => col.id === firstCondition.columnId,
                  );
                  if (sortedColumn) {
                    setSortedColumns([
                      {
                        column: sortedColumn,
                        order:
                          firstCondition.order === "0-9" ||
                          firstCondition.order === "asc"
                            ? "asc"
                            : "desc",
                        ...sortedColumn,
                      },
                    ]);
                  }
                }
              }}
              viewId={viewId}
              initialSortConditions={sortConditions}
              setSortedColumns={setSortedColumns}
            />
          )}
        </div>
        <button className="flex cursor-pointer items-center gap-x-2 rounded-sm p-2 hover:bg-gray-200/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-paint-bucket"
          >
            <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"></path>
            <path d="m5 2 5 5"></path>
            <path d="M2 13h15"></path>
            <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"></path>
          </svg>
          <div>Theme</div>
        </button>
        <button className="flex cursor-pointer items-center gap-x-2 rounded-sm p-2 hover:bg-gray-200/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
          >
            <path
              d="M3.78233 2.21713C3.70732 2.14212 3.60557 2.09998 3.49949 2.09998C3.3934 2.09998 3.29166 2.14212 3.21664 2.21713L1.21664 4.21713C1.06044 4.37334 1.06044 4.62661 1.21664 4.78282C1.37285 4.93903 1.62612 4.93903 1.78233 4.78282L3.09949 3.46566L3.09949 11.5343L1.78233 10.2171C1.62612 10.0609 1.37285 10.0609 1.21664 10.2171C1.06043 10.3733 1.06043 10.6266 1.21664 10.7828L3.21664 12.7828C3.29166 12.8578 3.3934 12.9 3.49949 12.9C3.60557 12.9 3.70731 12.8578 3.78233 12.7828L5.78233 10.7828C5.93854 10.6266 5.93854 10.3733 5.78233 10.2171C5.62612 10.0609 5.37285 10.0609 5.21664 10.2171L3.89949 11.5343L3.89949 3.46566L5.21664 4.78282C5.37285 4.93903 5.62612 4.93903 5.78233 4.78282C5.93854 4.62661 5.93854 4.37334 5.78233 4.21713L3.78233 2.21713ZM8.49998 3.99997C8.22383 3.99997 7.99998 4.22382 7.99998 4.49997C7.99998 4.77611 8.22383 4.99997 8.49998 4.99997H14.5C14.7761 4.99997 15 4.77611 15 4.49997C15 4.22382 14.7761 3.99997 14.5 3.99997H8.49998ZM7.99998 7.49997C7.99998 7.22382 8.22383 6.99997 8.49998 6.99997H14.5C14.7761 6.99997 15 7.22382 15 7.49997C15 7.77611 14.7761 7.99997 14.5 7.99997H8.49998C8.22383 7.99997 7.99998 7.77611 7.99998 7.49997ZM8.49998 9.99997C8.22383 9.99997 7.99998 10.2238 7.99998 10.5C7.99998 10.7761 8.22383 11 8.49998 11H14.5C14.7761 11 15 10.7761 15 10.5C15 10.2238 14.7761 9.99997 14.5 9.99997H8.49998Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            ></path>
          </svg>
          <div>Sort List</div>
        </button>
        <button className="flex cursor-pointer items-center gap-x-2 rounded-sm p-2 hover:bg-gray-200/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-share"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" x2="12" y1="2" y2="15"></line>
          </svg>
          <div>Share</div>
        </button>
      </div>
      <div className="relative">
        <button
          className="flex cursor-pointer items-center gap-x-2 rounded-sm p-2 hover:bg-gray-200/60"
          onClick={toggleSearch}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-search"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </button>
        {isSearchVisible && (
          <div className="absolute right-0 top-full mt-1 flex w-[300px] items-center">
            <input
              type="text"
              value={searchValue}
              placeholder="Search..."
              className="w-full rounded border-2 border-gray-300 p-2 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={onSearchChange}
              autoFocus
            />
            <button
              onClick={toggleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
