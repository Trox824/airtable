"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

// Define the structure of each row
type Row = {
  id: number;
  name: string;
  notes: string;
  assignee: string;
  status: string;
};

// Sample data for the table
const data: Row[] = [
  { id: 1, name: "Yo Yo", notes: "Ny", assignee: "Myha e", status: "Anh" },
  {
    id: 2,
    name: "whats up",
    notes: "my anem is",
    assignee: "anh",
    status: "arst",
  },
  {
    id: 3,
    name: "Hello? are",
    notes: "you ther",
    assignee: "",
    status: "arst",
  },
  {
    id: 4,
    name: "hey",
    notes: "nam here",
    assignee: "whats up",
    status: "arst",
  },
  { id: 5, name: "", notes: "", assignee: "", status: "" },
];

// Initialize column helper
const columnHelper = createColumnHelper<Row>();

export function DataTable() {
  const [rowSelection, setRowSelection] = useState({});

  // Define table columns
  const columns = [
    // Selection Column
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      size: 40,
    }),
    // Name Column
    columnHelper.accessor("name", {
      header: () => (
        <div className="flex items-center gap-2">
          Name
          <button className="text-gray-500">↓</button>
        </div>
      ),
    }),
    // Notes Column
    columnHelper.accessor("notes", {
      header: () => (
        <div className="flex items-center gap-2">
          Notes
          <button className="text-gray-500">↓</button>
        </div>
      ),
    }),
    // Assignee Column
    columnHelper.accessor("assignee", {
      header: () => (
        <div className="flex items-center gap-2">
          Assignee
          <button className="text-gray-500">↓</button>
        </div>
      ),
    }),
    // Status Column
    columnHelper.accessor("status", {
      header: () => (
        <div className="flex items-center gap-2">
          Status
          <button className="text-gray-500">↓</button>
        </div>
      ),
    }),
  ];

  // Initialize the table instance
  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="relative flex h-screen flex-row overflow-auto bg-[#f8f8f8]">
      <table className="relative top-0 cursor-pointer border-r-0 p-0">
        {/* Table Header */}
        <thead className="z-10 h-8">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="flex h-8">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border-b-at-table-bot-gray relative box-border flex h-8 min-w-16 cursor-pointer border-b bg-[#f5f5f5] p-0 leading-6 hover:bg-[#f8f8f8]"
                >
                  {header.isPlaceholder ? null : (
                    <div className="relative flex h-full w-[124px] flex-grow items-center">
                      <p className="relative h-auto w-full overflow-clip text-ellipsis whitespace-nowrap pl-2 text-start text-[13px]">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </p>
                      <span className="flex-end relative bottom-0 right-0 top-0 flex h-full items-center pl-1 pr-1.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          className="opacity-75"
                        >
                          <use
                            fill="currentColor"
                            fillOpacity="0.75"
                            href="/icons/icon_definitions.svg#ChevronDown"
                          />
                        </svg>
                      </span>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        {/* Table Body */}
        <tbody className="relative z-0">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="absolute z-0 flex h-8 bg-white hover:bg-[#f8f8f8]"
              style={{ top: `${row.index * 32}px`, left: 0, width: "100%" }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="focus:border-at-btn-primary flex border-b-[0.8px] border-r-[0.8px] bg-white"
                  style={{ width: "150px" }}
                >
                  <input
                    className="focus:shadow-at-focus-cell w-full text-ellipsis p-1.5 outline-none focus:z-50 focus:rounded-sm"
                    value={
                      flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      ) as string
                    }
                  />
                </td>
              ))}
            </tr>
          ))}

          {/* Add New Row Button */}
          <tr className="absolute flex h-8 w-full bg-white hover:bg-[#f8f8f8]">
            <td className="border-at-table-bot-gray h-8 w-full border-b-[0.8px] border-r-[0.8px]">
              <div className="absolute left-2 top-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="icon flex-none"
                >
                  <use
                    fill="currentColor"
                    href="/icons/icon_definitions.svg#Plus"
                  />
                </svg>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
