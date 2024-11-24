import { type Table, flexRender } from "@tanstack/react-table";
import { type Row } from "./types";
import { AddColumnDropdown } from "./Dropdown";
import { type ColumnType } from "@prisma/client";
import { RefObject, Dispatch, SetStateAction } from "react";

interface TableHeaderProps {
  table: Table<Row>;
  isDropdownOpen: boolean;
  buttonRef: RefObject<HTMLButtonElement>;
  dropdownRef: RefObject<HTMLDivElement>;
  onCreateColumn: (name: string, type: ColumnType) => void;
  setIsDropdownOpen: Dispatch<SetStateAction<boolean>>;
}

export function TableHeader({
  table,
  isDropdownOpen,
  buttonRef,
  dropdownRef,
  onCreateColumn,
  setIsDropdownOpen,
}: TableHeaderProps) {
  return (
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
