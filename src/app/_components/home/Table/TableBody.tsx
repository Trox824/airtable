import { useCallback, memo, useEffect } from "react";
import {
  CellContext,
  type ColumnDef,
  flexRender,
  type Table,
  type Cell,
} from "@tanstack/react-table";
import { SortedColumn, type Row } from "./types";
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
}: TableBodyProps) {
  const renderCell = useCallback(
    (cell: Cell<Row, unknown>, value: unknown) => {
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

      const displayValue = value?.toString() ?? "";
      const matches =
        searchQuery &&
        displayValue.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        <MemoizedCellRenderer
          info={cellContext}
          setEditing={setEditing}
          meta={table.options.meta}
          isHighlighted={!!matches}
          searchQuery={searchQuery}
        />
      );
    },
    [searchQuery, setEditing, table.options.meta],
  );

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? virtualizer.getTotalSize() -
        (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  const allRows = table.getRowModel().rows;
  console.log(sortedColumns);
  const isColumnSorted = useCallback(
    (columnId: string) => {
      return sortedColumns.some(
        (sortedCol) => sortedCol.column.id === columnId,
      );
    },
    [sortedColumns],
  );

  return (
    <tbody>
      {paddingTop > 0 && (
        <tr>
          <td colSpan={columns.length} style={{ height: `${paddingTop}px` }} />
        </tr>
      )}

      {virtualRows.map((virtualRow) => {
        const row = allRows[virtualRow.index];
        if (!row || virtualRow.index >= allRows.length) return null;

        return (
          <tr
            key={row.id}
            data-index={virtualRow.index}
            className="group flex h-8 transition-colors hover:bg-gray-100"
            style={{
              width: table.getCenterTotalSize(),
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {row.getVisibleCells().map((cell) => {
              const value = cell.getValue();
              const isSorted = isColumnSorted(cell.column.id);

              return (
                <td
                  key={cell.id}
                  className={`flex overflow-scroll whitespace-nowrap border-b-[0.8px] border-r-[0.8px] text-[13px] font-normal [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                    isSorted
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
            })}
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

      <tr
        className="flex h-8 cursor-pointer border-b-[0.8px] border-r-[0.8px] bg-white hover:bg-[#f8f8f8]"
        onClick={handleAddRow}
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
    </tbody>
  );
});
