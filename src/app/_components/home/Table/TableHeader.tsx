import { type Table, flexRender, type ColumnDef } from "@tanstack/react-table";

import { type Row, type ColumnMeta } from "./types";
import { AddColumnDropdown } from "./AddColDropdown";
import { type ColumnType } from "@prisma/client";
import { RefObject, Dispatch, SetStateAction, useMemo, useState } from "react";

interface TableHeaderProps {
  table: Table<Row>;
  isDropdownOpen: boolean;
  buttonRef: RefObject<HTMLButtonElement>;
  dropdownRef: RefObject<HTMLDivElement>;
  onCreateColumn: (name: string, type: ColumnType) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  setIsDropdownOpen: Dispatch<SetStateAction<boolean>>;
}

export function TableHeader({
  table,
  isDropdownOpen,
  buttonRef,
  dropdownRef,
  onCreateColumn,
  onRenameColumn,
  setIsDropdownOpen,
}: TableHeaderProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleDoubleClick = (columnId: string) => {
    const column = table.getAllColumns().find((col) => col.id === columnId);
    const currentName = (column?.columnDef.meta as ColumnMeta).name ?? "";

    setEditingColumnId(columnId);
    setEditingName(currentName);
  };

  const handleRename = (columnId: string) => {
    if (editingName.trim()) {
      onRenameColumn(columnId, editingName.trim());
    }
    setEditingColumnId(null);
  };

  return (
    <thead className="z-10 h-8">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="flex h-8">
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              className={`relative box-border flex h-8 cursor-pointer border-b border-r-[0.8px] border-r-gray-300 bg-[#f1f6ff] p-0 leading-6 ${
                header.column.getIsResizing() ? "select-none" : ""
              }`}
              style={{
                width: header.getSize(),
                position: "relative",
                userSelect: "none",
              }}
            >
              {header.isPlaceholder ? null : (
                <div className="relative flex h-full w-full flex-grow items-center">
                  {editingColumnId === header.column.id ? (
                    <input
                      className="m-1 h-6 w-[calc(100%-8px)] rounded border px-1 text-[13px] font-medium focus:outline-none"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(header.column.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(header.column.id);
                        if (e.key === "Escape") setEditingColumnId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`relative h-auto w-full overflow-hidden pl-2 text-start text-[13px] font-normal ${
                        header.getSize() < 70 ? "truncate" : ""
                      }`}
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      onDoubleClick={() => handleDoubleClick(header.column.id)}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </span>
                  )}
                  <span className="flex-end relative bottom-0 right-0 top-0 flex h-full items-center pl-1 pr-1.5"></span>
                </div>
              )}
              {header.column.getCanResize() && (
                <div
                  onMouseDown={header.getResizeHandler()}
                  onTouchStart={header.getResizeHandler()}
                  className={`absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none bg-transparent hover:bg-gray-300 ${
                    header.column.getIsResizing()
                      ? "bg-blue-500 opacity-100"
                      : "opacity-0 hover:opacity-100"
                  }`}
                  style={{
                    transform: "translateX(50%)",
                  }}
                />
              )}
            </th>
          ))}
          <th
            className="relative box-border flex h-8 min-w-16 cursor-pointer border-b border-r-[0.8px] border-r-gray-300 bg-[#f1f6ff] p-0 leading-6 hover:bg-[#f8f8f8]"
            style={{ width: "40px" }}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <div className="relative m-auto">
              <button
                ref={buttonRef}
                className="m-auto text-[25px] font-thin text-gray-600 hover:text-gray-800 focus:outline-none"
                title="Add Column"
              >
                +
              </button>
              {isDropdownOpen && (
                <AddColumnDropdown
                  dropdownRef={dropdownRef}
                  buttonRef={buttonRef}
                  isOpen={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                  onCreateColumn={onCreateColumn}
                />
              )}
            </div>
          </th>
        </tr>
      ))}
    </thead>
  );
}
