import { useCallback, memo } from "react";
import {
  CellContext,
  type ColumnDef,
  flexRender,
  type Table,
  type Cell,
} from "@tanstack/react-table";
import { type Row } from "./types";
import { CellRenderer } from "./CellRender";
import { useVirtualizer } from "@tanstack/react-virtual";
interface TableBodyProps {
  table: Table<Row>;
  columns: ColumnDef<Row>[];
  handleAddRow: () => void;
  setEditing: (editing: boolean) => void;
  searchQuery: string;
  virtualizer: ReturnType<typeof useVirtualizer>;
}

const MemoizedCellRenderer = memo(CellRenderer);

export const TableBody = memo(function TableBody({
  table,
  columns,
  handleAddRow,
  setEditing,
  searchQuery,
  virtualizer,
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

  return (
    <tbody>
      {paddingTop > 0 && (
        <tr>
          <td colSpan={columns.length} style={{ height: `${paddingTop}px` }} />
        </tr>
      )}

      {virtualRows.map((virtualRow) => {
        const row = table.getRowModel().rows[virtualRow.index];
        if (!row) return null;

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
            {row.getVisibleCells().map((cell, cellIndex) => {
              const value = cell.getValue();
              const displayValue = value?.toString() ?? "";
              const isMatch =
                searchQuery &&
                displayValue
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) &&
                cell.column.id !== "select";

              return (
                <td
                  key={cell.id}
                  className={`flex border-b-[0.8px] border-r-[0.8px] text-[13px] font-normal transition-colors ${
                    isMatch ? "bg-yellow-200" : "bg-white"
                  } overflow-scroll whitespace-nowrap bg-white [-ms-overflow-style:none] [scrollbar-width:none] group-hover:bg-gray-100 [&::-webkit-scrollbar]:hidden`}
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
