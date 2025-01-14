import { useCallback, memo, useEffect, useState } from "react";
import {
  CellContext,
  type ColumnDef,
  type Table,
  type Cell,
} from "@tanstack/react-table";
import { FilterCondition, SortedColumn, type Row } from "../../../Types/types";
import { CellRenderer } from "./CellRender";
import { useVirtualizer } from "@tanstack/react-virtual";

interface TableBodyProps {
  table: Table<Row>;
  columns: ColumnDef<Row>[];
  handleAddRow: () => void;
  setEditing: (editing: boolean) => void;
  searchQuery: string;
  virtualizer: ReturnType<typeof useVirtualizer>;
  sortedColumns: SortedColumn[];
  filterConditions: FilterCondition[];
  columnVisibility: Record<string, boolean>;
}

const MemoizedCellRenderer = memo(CellRenderer);

export const TableBody = memo(function TableBody({
  table,
  columns,
  handleAddRow,
  setEditing,
  searchQuery,
  virtualizer,
  sortedColumns,
  filterConditions,
  columnVisibility,
}: TableBodyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderCell = useCallback(
    (cell: Cell<Row, unknown>, value: unknown) => {
      if (!mounted) return null;

      const cellContext = {
        ...cell,
        table,
        cell: cell,
      } as CellContext<Row, string | number | null>;

      if (cell.column.id === "select") {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <span className="-ml-1 text-[13px] font-normal">
              {cell.row.index + 1}
            </span>
          </div>
        );
      }
      return (
        <MemoizedCellRenderer
          info={cellContext}
          setEditing={setEditing}
          meta={table.options.meta}
          searchQuery={searchQuery}
        />
      );
    },
    [searchQuery, setEditing, table.options.meta, mounted],
  );

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? virtualizer.getTotalSize() -
        (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  const allRows = table.getRowModel().rows;
  const isColumnSorted = useCallback(
    (columnId: string) => {
      return sortedColumns.some(
        (sortedCol) => sortedCol.column.id === columnId,
      );
    },
    [sortedColumns],
  );

  const isColumnFiltered = useCallback(
    (columnId: string) => {
      return filterConditions.some(
        (filterCond) => filterCond.columnId === columnId,
      );
    },
    [filterConditions],
  );

  const handleAddRowWithLogging = () => {
    handleAddRow();
  };

  return (
    <tbody>
      {paddingTop > 0 && (
        <tr>
          <td colSpan={columns.length} style={{ height: `${paddingTop}px` }} />
        </tr>
      )}

      {virtualRows.map((virtualRow) => {
        const row = allRows[virtualRow.index];
        const isPlaceholder = row?.id === "placeholder";

        return (
          <tr
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className={`group flex h-8 transition-colors hover:bg-gray-100`}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: table.getCenterTotalSize(),
            }}
          >
            {isPlaceholder ? (
              <td colSpan={columns.length} className="p-2 text-center">
                Loading more records...
              </td>
            ) : (
              row?.getVisibleCells().map((cell) => {
                const value = cell.getValue();
                const isSorted = isColumnSorted(cell.column.id);
                const isFiltered = isColumnFiltered(cell.column.id);
                const columnId = cell.column.id;
                if (columnVisibility[columnId] === false) return null;

                return (
                  <td
                    key={cell.id}
                    className={`flex overflow-scroll whitespace-nowrap border-b-[0.8px] border-r-[0.8px] text-[13px] font-normal [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                      isFiltered
                        ? "bg-orange-300/40 hover:bg-orange-300/60"
                        : isSorted
                          ? "bg-blue-200 hover:bg-blue-300"
                          : "bg-white hover:bg-gray-100"
                    }`}
                    style={{
                      width: cell.column.getSize(),
                    }}
                    onClick={() => {
                      if (cell.column.id !== "select") {
                        setEditing(true);
                      }
                    }}
                  >
                    {renderCell(cell, value)}
                  </td>
                );
              })
            )}
          </tr>
        );
      })}

      {paddingBottom > 0 && (
        <tr>
          <td
            colSpan={columns.length}
            style={{ height: `${paddingBottom}px` }}
          />
        </tr>
      )}

      {filterConditions.length > 0 ? (
        <tr
          className="flex border-b-[0.8px] border-r-[0.8px] bg-white"
          style={{
            width: table.getCenterTotalSize(),
            backgroundColor: "white",
            position: "absolute",
            top: virtualizer.getTotalSize(),
          }}
        >
          <td
            colSpan={columns.length}
            className="flex w-full items-center justify-center py-2 text-sm italic text-gray-500"
          >
            Cannot add new rows while filters are active
          </td>
        </tr>
      ) : (
        <tr
          className="flex cursor-pointer border-b-[0.8px] border-r-[0.8px] bg-white hover:bg-[#f8f8f8]"
          onClick={handleAddRowWithLogging}
          style={{
            width: table.getCenterTotalSize(),
            backgroundColor: "white",
            position: "absolute",
            top: virtualizer.getTotalSize(),
          }}
        >
          <td
            className="flex items-center px-2"
            style={{ width: table.getAllColumns()[0]?.getSize() }}
          >
            <button className="text-gray-600 hover:text-gray-800">+</button>
          </td>
          {table
            .getAllColumns()
            .slice(1)
            .map((column) => (
              <td key={column.id} style={{ width: column.getSize() }} />
            ))}
        </tr>
      )}
    </tbody>
  );
});
