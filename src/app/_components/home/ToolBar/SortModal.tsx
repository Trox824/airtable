import {
  LucideChevronDown,
  LucidePlus,
  LucideX,
  LucideSearch,
} from "lucide-react";
import { useState } from "react";
import { SimpleColumn, SortedColumn } from "../../../Types/types";
import { api } from "~/trpc/react";
import { type SortCondition } from "../../../Types/types";

interface SortModalProps {
  columns: SimpleColumn[] | undefined;
  loading: boolean;
  onSort: (conditions: SortCondition[]) => void;
  viewId: string;
  initialSortConditions: SortCondition[];
  setSortedColumns: (columns: SortedColumn[]) => void;
}

export function SortModal({
  columns,
  loading,
  onSort,
  viewId,
  initialSortConditions,
  setSortedColumns,
}: SortModalProps) {
  const [isSelectingColumn, setIsSelectingColumn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConditions, setSortConditions] = useState<SortCondition[]>(
    initialSortConditions,
  );
  const [activeColumnSelection, setActiveColumnSelection] = useState<
    number | null
  >(null);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null,
  );

  const utils = api.useUtils();

  const updateSort = api.view.updateSort.useMutation({
    onSuccess: () => {
      void utils.view.invalidate();
    },
  });

  const handleSortOrderChange = (
    index: number,
    order: "asc" | "desc" | "0-9" | "9-0",
  ) => {
    const newConditions = sortConditions.map((condition, i) => {
      if (i === index) {
        const normalizedOrder =
          order === "0-9" ? "asc" : order === "9-0" ? "desc" : order;
        return {
          ...condition,
          order: normalizedOrder,
        };
      }
      return condition;
    });
    setSortConditions(newConditions);
    onSort(newConditions);

    // Save to database
    void updateSort.mutate({
      viewId,
      sorts: newConditions.map((condition) => ({
        columnId: condition.columnId,
        direction: condition.order === "asc" ? "Ascending" : "Descending",
      })),
    });
  };

  const handleRemoveSort = (index: number) => {
    const newConditions = sortConditions.filter((_, i) => i !== index);
    setSortConditions(newConditions);
    onSort(newConditions);

    // Update sorted columns to remove the deleted condition
    const newSortedColumns =
      columns
        ?.filter((col) =>
          newConditions.some((condition) => condition.columnId === col.id),
        )
        .map((col) => ({
          column: col,
          order:
            newConditions.find((c) => c.columnId === col.id)?.order === "0-9" ||
            newConditions.find((c) => c.columnId === col.id)?.order === "asc"
              ? ("asc" as const)
              : ("desc" as const),
        })) ?? [];
    setSortedColumns(newSortedColumns);

    // Save to database
    void updateSort.mutate({
      viewId,
      sorts: newConditions.map((condition) => ({
        columnId: condition.columnId,
        direction:
          condition.order === "asc" || condition.order === "0-9"
            ? "Ascending"
            : "Descending",
      })),
    });
  };

  const handleColumnSelect = (column: SimpleColumn) => {
    let newConditions: SortCondition[];
    if (activeColumnSelection !== null) {
      newConditions = sortConditions.map((condition, index) =>
        index === activeColumnSelection
          ? { ...condition, columnId: column.id }
          : condition,
      );
    } else {
      newConditions = [
        ...sortConditions,
        {
          columnId: column.id,
          order: column.type === "Number" ? "0-9" : "asc",
        },
      ];
    }
    setSortConditions(newConditions);
    onSort(newConditions);
    setIsSelectingColumn(false);
    setActiveColumnSelection(null);
    setSearchQuery("");

    // Save to database immediately when column is selected
    void updateSort.mutate({
      viewId,
      sorts: newConditions.map((condition) => ({
        columnId: condition.columnId,
        direction: condition.order === "asc" ? "Ascending" : "Descending",
      })),
    });
  };

  const ColumnSelector = ({
    style,
    onSelect,
  }: {
    style?: React.CSSProperties;
    onSelect?: (column: SimpleColumn) => void;
  }) => (
    <div className="flex max-h-52 flex-col" style={style}>
      <div className="flex items-center gap-x-2">
        <LucideSearch className="text-blue-500" size={16} />
        <input
          placeholder="Find a field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 focus:outline-none"
        />
      </div>
      <div className="flex max-h-80 flex-col overflow-auto">
        {columns
          ?.filter((column) =>
            column.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((column) => (
            <div
              key={column.id}
              onClick={() =>
                onSelect ? onSelect(column) : handleColumnSelect(column)
              }
              className="flex cursor-pointer items-center gap-x-2 rounded-sm p-2 hover:bg-gray-200/60"
            >
              <div>{column.name}</div>
            </div>
          ))}
      </div>
    </div>
  );

  // Initial column selection view when no sort conditions exist
  if (sortConditions.length === 0) {
    return (
      <div className="absolute top-full mt-1 flex min-w-80 flex-col gap-y-3 rounded-sm border bg-white p-4 text-xs shadow-lg">
        <div className="border-b pb-2 text-xs font-semibold text-gray-600">
          Sort by
        </div>
        <ColumnSelector />
      </div>
    );
  }

  // Sort conditions view with potential dropdown
  return (
    <div className="absolute top-full z-40 mt-1 flex min-w-80 flex-col gap-y-3 rounded-sm border bg-white p-4 text-xs shadow-lg">
      <div className="border-b pb-2 text-xs font-semibold text-gray-600">
        Sort by
      </div>

      <div className="flex w-full flex-col items-center justify-between gap-x-2 gap-y-2">
        {sortConditions.map((condition, index) => {
          const selectedColumn = columns?.find(
            (col) => col.id === condition.columnId,
          );
          const isActive = activeColumnSelection === index;

          return (
            <div
              key={index}
              className="relative flex w-full items-center gap-x-2"
            >
              <div className="relative w-60">
                <button
                  className="flex w-full items-center justify-between gap-x-2 rounded-sm border p-2 hover:bg-gray-100"
                  onClick={() =>
                    setOpenDropdownIndex(
                      openDropdownIndex === index ? null : index,
                    )
                  }
                >
                  <div>{selectedColumn?.name ?? "Select Column"}</div>
                  <LucideChevronDown size={16} />
                </button>
                {openDropdownIndex === index && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-80 rounded-sm border bg-white p-4 shadow-lg">
                    <ColumnSelector
                      onSelect={(column) => {
                        handleColumnSelect(column);
                        setOpenDropdownIndex(null);
                      }}
                    />
                  </div>
                )}
              </div>
              <select
                className="flex w-28 items-center justify-between gap-x-2 rounded-sm border p-2 hover:bg-gray-100"
                value={
                  selectedColumn?.type === "Number"
                    ? condition.order === "asc"
                      ? "0-9"
                      : "9-0"
                    : condition.order
                }
                onChange={(e) =>
                  handleSortOrderChange(
                    index,
                    e.target.value as "asc" | "desc" | "0-9" | "9-0",
                  )
                }
              >
                {selectedColumn?.type === "Number" ? (
                  <>
                    <option value="0-9">0-9</option>
                    <option value="9-0">9-0</option>
                  </>
                ) : (
                  <>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </>
                )}
              </select>
              <button
                className="flex items-center gap-x-2 rounded-sm p-2 hover:bg-gray-100"
                onClick={() => handleRemoveSort(index)}
              >
                <LucideX size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Another Sort Button */}
      {sortConditions.length < (columns?.length ?? 0) && (
        <div className="relative flex items-center justify-between">
          <button
            className="flex items-center justify-between gap-x-2 text-gray-500 hover:text-gray-700"
            onClick={() => {
              setIsSelectingColumn(!isSelectingColumn);
              setActiveColumnSelection(null);
            }}
          >
            <LucidePlus size={16} />
            <span>Add another sort</span>
          </button>
          {isSelectingColumn && activeColumnSelection === null && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-80 rounded-sm border bg-white p-2 shadow-lg">
              <ColumnSelector />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
