import React, { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { ColumnType } from "@prisma/client";

type SimpleColumn = {
  name: string;
  id: string;
  type: ColumnType;
};

interface FilterModalProps {
  columns: SimpleColumn[] | undefined;
  loading: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({ columns, loading }) => {
  const [selectedColumn, setSelectedColumn] = useState<SimpleColumn | null>(
    null,
  );

  return (
    <div className="absolute top-full mt-1 flex w-max min-w-96 rounded-sm border bg-white p-4 text-xs shadow-lg">
      <div className="relative flex h-full w-full flex-col gap-y-3 text-xs text-gray-500">
        <span>In this view, show records</span>

        <div className="flex w-full items-center">
          <span className="mr-2">
            <span className="w-max p-2">where</span>
          </span>

          {/* Column Selector */}
          <div className="relative">
            <button className="flex w-60 items-center justify-between gap-x-2 border p-2 hover:bg-gray-100">
              <div>{selectedColumn?.name ?? "Select a column"}</div>
              <ChevronDown size={16} />
            </button>
            {/* Column Dropdown */}
            {columns && columns.length > 0 && (
              <div className="absolute left-0 top-full z-10 mt-1 w-60 rounded-sm border bg-white shadow-lg">
                {columns.map((column) => (
                  <div
                    key={column.id}
                    className="cursor-pointer p-2 hover:bg-gray-100"
                    onClick={() => setSelectedColumn(column)}
                  >
                    {column.name}
                  </div>
                ))}
              </div>
            )}
            {loading && (
              <div className="absolute left-0 top-full z-10 mt-1 w-60 rounded-sm border bg-white p-2 text-center shadow-lg">
                Loading columns...
              </div>
            )}
          </div>

          {/* Condition Selector */}
          <select className="w-32 border-y border-r p-2">
            <option value="includesString">contains</option>
            <option value="empty">is empty</option>
            <option value="notEmpty">is not empty</option>
          </select>

          {/* Value Input */}
          <input
            className="w-32 border-y border-r p-2"
            placeholder="Enter value..."
            value=""
          />

          {/* Delete Button */}
          <button className="flex w-max items-center justify-center border-y border-r p-2 text-gray-500">
            <Trash2 size={16} strokeWidth={1} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-x-5">
          <button className="flex items-center gap-x-2 text-blue-500">
            <Plus size={16} />
            <span>Add condition</span>
          </button>

          <button className="flex items-center gap-x-2">
            <Plus size={16} />
            <span>Add condition group</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
