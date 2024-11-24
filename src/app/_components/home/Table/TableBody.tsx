import { type ColumnDef, flexRender, type Table } from "@tanstack/react-table";
import { type Row } from "./types";

interface TableBodyProps {
  table: Table<Row>;
  columns: ColumnDef<Row>[];
  handleAddRow: () => void;
}

export function TableBody({ table, columns, handleAddRow }: TableBodyProps) {
  return (
    <tbody className="relative z-0">
      {table.getRowModel().rows.map((row) => (
        <tr key={row.id} className="group flex h-8">
          {row.getVisibleCells().map((cell) => (
            <td
              key={cell.id}
              className="flex border-b-[0.8px] border-r-[0.8px] bg-white text-[13px] font-normal group-hover:bg-[#f8f8f8]"
              style={{
                width: cell.column.id === "select" ? "72px" : "174px",
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
      <tr
        className="flex h-8 cursor-pointer border-b-[0.8px] border-r-[0.8px] bg-white hover:bg-[#f8f8f8]"
        onClick={handleAddRow}
      >
        <td className="flex w-full items-center px-2">
          <button className="text-gray-600 hover:text-gray-800">+</button>
        </td>
        {columns?.map((_, idx) => <td key={idx} className="w-0"></td>)}
      </tr>
    </tbody>
  );
}
