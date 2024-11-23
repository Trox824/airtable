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
  [key: string]: string | number; // More specific union type instead of any
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

// Function to create column configuration
const createColumn = (id: string, header: string, displayType: string) => {
  return columnHelper.accessor(id, {
    header: () => (
      <div className="contentWrapper">
        <div className="flex items-center gap-2">
          <div className="relative" title={displayType}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="flex-none"
            >
              <use
                fill="currentColor"
                fillOpacity="0.75"
                href="/icons/icon_definitions.svg#TextAlt"
              />
            </svg>
          </div>
          <span className="name">
            <div className="flex w-full items-center justify-between">
              <div className="truncate-pre">{header}</div>
              <div className="flex items-center">
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
              </div>
            </div>
          </span>
        </div>
      </div>
    ),
    cell: (info) => (
      <div className="w-full p-1.5">{info.getValue() as string}</div>
    ),
  });
};

export function DataTable() {
  const [rowSelection, setRowSelection] = useState({});
  const [tableData, setTableData] = useState<Row[]>(data); // Convert static data to state

  // Convert columns to state
  const [columns, setColumns] = useState(() => [
    // Selection Column
    columnHelper.display({
      id: "select",
      cell: ({ row }) => (
        <span className="flex items-center">
          <span className="ml-2 w-2 text-center text-[12px] font-light text-gray-500">
            {row.original.id}
          </span>
        </span>
      ),
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="h-3 w-3 rounded border-gray-300"
        />
      ),
      size: 40,
    }),
    // Reusable columns
    createColumn("name", "Name", "Single line text"),
    createColumn("notes", "Notes", "Multi-line text"),
    createColumn("assignee", "Assignee", "Single line text"),
    createColumn("status", "Status", "Single line text"),
  ]);

  // Add function to handle new columns
  const handleAddColumn = () => {
    const newColumnId = `newColumn${columns.length + 1}`;
    const newColumn = columnHelper.accessor(newColumnId, {
      header: "New Column",
      cell: (info) => (
        <div
          className="w-full p-1.5"
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            const newValue = e.currentTarget.textContent ?? "";
            setTableData((prevData) =>
              prevData.map((row) =>
                row.id === info.row.original.id
                  ? { ...row, [newColumnId]: newValue }
                  : row,
              ),
            );
          }}
        >
          {info.getValue() ?? ""}
        </div>
      ),
    });

    setColumns((prevColumns) => [...prevColumns, newColumn]);
    setTableData((prevData) =>
      prevData.map((row) => ({ ...row, [newColumnId]: "" })),
    );
  };

  // Add function to handle new rows
  const handleAddRow = () => {
    const newRow: Row = {
      id: tableData.length + 1,
      name: "",
      notes: "",
      assignee: "",
      status: "",
    };

    // Add empty values for any dynamic columns
    columns.forEach((column) => {
      if (
        column.id &&
        !["select", "name", "notes", "assignee", "status"].includes(column.id)
      ) {
        newRow[column.id] = "";
      }
    });

    setTableData((prevData) => [...prevData, newRow]);
  };

  // Initialize the table instance
  const table = useReactTable({
    data: tableData,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[calc(theme(spacing.navbar)+2rem+theme(spacing.toolbar))] flex flex-row overflow-auto bg-[#f8f8f8]">
      <table className="relative w-full cursor-pointer border-r-0 p-0">
        {/* Table Header */}
        <thead className="z-10 h-8">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="flex h-8">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="relative box-border flex h-8 min-w-16 cursor-pointer border-b border-r-[0.8px] border-r-gray-300 bg-[#f1f6ff] p-0 leading-6"
                  style={{
                    width: header.column.id === "select" ? "72px" : "174px",
                  }}
                >
                  {header.isPlaceholder ? null : (
                    <div className="relative flex h-full w-full flex-grow items-center">
                      <span className="relative h-auto w-full overflow-clip pl-2 text-start text-[13px] font-normal">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </span>
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
              {/* Add Column Button in Header */}
              <th
                onClick={handleAddColumn}
                className="relative box-border flex h-8 min-w-16 cursor-pointer border-b border-r-[0.8px] border-r-gray-300 bg-[#f1f6ff] p-0 leading-6 hover:bg-[#f8f8f8]"
                style={{ width: "40px" }} // Reduced width since it's just a button
              >
                <span
                  className="m-auto text-[25px] font-thin text-gray-600 hover:text-gray-800"
                  title="Add Column"
                >
                  +
                </span>
              </th>
            </tr>
          ))}
        </thead>

        {/* Table Body */}
        <tbody className="relative z-0">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="absolute z-0 flex h-8"
              style={{ top: `${row.index * 32}px`, left: 0, width: "100%" }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="flex border-b-[0.8px] border-r-[0.8px] bg-white text-[13px] font-normal hover:bg-[#f8f8f8]"
                  style={{
                    width: cell.column.id === "select" ? "72px" : "174px",
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
              {/* Removed the extra cell */}
            </tr>
          ))}

          {/* Update Add New Row Button */}
          <tr
            className="absolute flex h-8 border-b-[0.8px] border-r-[0.8px] bg-white hover:bg-[#f8f8f8]"
            style={{
              top: `${table.getRowModel().rows.length * 32}px`,
              left: 0,
              width: `${(columns.length - 1) * 174 + 72}px`,
            }}
            onClick={handleAddRow} // Added onClick to the <tr>
          >
            <td className="flex w-full items-center px-2">
              <button className="text-gray-600 hover:text-gray-800">+</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
