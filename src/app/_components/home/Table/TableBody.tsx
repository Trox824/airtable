import {
  CellContext,
  type ColumnDef,
  flexRender,
  type Table,
} from "@tanstack/react-table";
import { type Row } from "./types";
import { CellRenderer } from "./CellRender";
import { useMemo } from "react";

interface TableBodyProps {
  table: Table<Row>;
  columns: ColumnDef<Row>[];
  handleAddRow: () => void;
  setEditing: (editing: boolean) => void;
}

export function TableBody({
  table,
  columns,
  handleAddRow,
  setEditing,
}: TableBodyProps) {
  const renderRow = useMemo(
    () =>
      table.getRowModel().rows.map((row) => {
        return (
          <tr
            key={row.id}
            className="group flex h-8"
            style={{ width: table.getCenterTotalSize() }}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="flex border-b-[0.8px] border-r-[0.8px] bg-white text-[13px] font-normal"
                style={{
                  width: cell.column.getSize(),
                }}
                onClick={() => {
                  if (cell.column.id !== "select") {
                    setEditing(true);
                  }
                }}
              >
                {cell.column.id === "select" ? (
                  <div className="flex h-full w-5 items-center justify-center">
                    <span className="text-[13px] font-normal">
                      {row.index + 1}
                    </span>
                  </div>
                ) : (
                  <CellRenderer
                    info={
                      cell.getContext() as CellContext<
                        Row,
                        string | number | null
                      >
                    }
                    setEditing={setEditing}
                    meta={table.options.meta}
                  />
                )}
              </td>
            ))}
          </tr>
        );
      }),
    [table.getRowModel().rows, setEditing, table.getCenterTotalSize()],
  );

  return (
    <tbody className="relative z-0">
      {renderRow}
      <tr
        className="flex h-8 cursor-pointer border-b-[0.8px] border-r-[0.8px] bg-white hover:bg-[#f8f8f8]"
        onClick={handleAddRow}
        style={{
          width: table.getCenterTotalSize(),
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
}
