// src/app/_components/home/ToolBar/HideModal.tsx
import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { SimpleColumn } from "../../../Types/types";
import { api } from "~/trpc/react";
interface HideModalProps {
  viewId: string;
  columns: SimpleColumn[] | undefined;
  columnVisibility: Record<string, boolean>;
  onToggleVisibility: (
    columnId: string,
    newVisibility?: Record<string, boolean>,
  ) => void;
  onColumnReorder: (startIndex: number, endIndex: number) => void;
}

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange }) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-2.5 w-4 items-center rounded-full transition-colors ${
        checked ? "bg-green-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-2" : "translate-x-0.5"
        }`}
      />
    </button>
  );
};

export const HideModal: React.FC<HideModalProps> = ({
  viewId,
  columns,
  columnVisibility,
  onToggleVisibility,
  onColumnReorder,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const updateColumnVisibility = api.view.updateColumnVisibility.useMutation();

  if (!columns) return null;

  const filteredColumns = columns.filter((column) =>
    column.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleHideAll = () => {
    const newVisibility: Record<string, boolean> = {};
    columns?.forEach((column) => {
      newVisibility[column.id] = false;
    });
    // Update all columns at once using onColumnVisibilityChange
    onToggleVisibility("__ALL__", newVisibility);
  };

  const handleShowAll = () => {
    const newVisibility: Record<string, boolean> = {};
    columns?.forEach((column) => {
      newVisibility[column.id] = true;
    });
    // Update all columns at once using onColumnVisibilityChange
    onToggleVisibility("__ALL__", newVisibility);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Directly use the filtered indices since we're working with the visible list
    onColumnReorder(sourceIndex, destinationIndex);
  };

  const handleToggleVisibility = async (
    columnId: string,
    newVisibility?: Record<string, boolean>,
  ) => {
    const updatedVisibility = newVisibility ?? {
      ...columnVisibility,
      [columnId]: !columnVisibility[columnId],
    };

    // Update local state
    onToggleVisibility(columnId, newVisibility);

    // Save to database
    try {
      await updateColumnVisibility.mutateAsync({
        viewId,
        visibility: updatedVisibility,
      });
    } catch (error) {
      console.error("Failed to save column visibility:", error);
      // Optionally revert local state on error
    }
  };

  return (
    <div className="absolute top-full mt-1 flex w-72 flex-col rounded-sm border bg-white px-4 shadow-lg">
      {/* Search Field */}
      <div className="relative border-b-2 p-2">
        <input
          type="text"
          placeholder="Find a field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="focus:none w-full rounded-sm border-none bg-transparent px-2 py-1 text-sm outline-none focus:ring-gray-200"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-help-circle"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>
      </div>

      {/* Updated Column List with Drag and Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="column-list">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="max-h-64 overflow-y-auto py-1"
            >
              {filteredColumns.map((column, index) => (
                <Draggable
                  key={column.id}
                  draggableId={column.id}
                  index={index}
                  isDragDisabled={false}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`group flex h-8 items-center justify-between ${
                        snapshot.isDragging ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex flex-grow items-center rounded-sm px-2 hover:bg-gray-100">
                        <div className="flex h-full w-8 items-center">
                          <Switch
                            checked={columnVisibility[column.id] !== false}
                            onCheckedChange={() =>
                              handleToggleVisibility(column.id)
                            }
                          />
                        </div>
                        <span className="flex-1 text-xs text-gray-700">
                          {column.name}
                        </span>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-grip-vertical"
                        >
                          <circle cx="9" cy="12" r="1" />
                          <circle cx="9" cy="5" r="1" />
                          <circle cx="9" cy="19" r="1" />
                          <circle cx="15" cy="12" r="1" />
                          <circle cx="15" cy="5" r="1" />
                          <circle cx="15" cy="19" r="1" />
                        </svg>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Footer Buttons */}
      <div className="m-4 flex gap-x-4">
        <button
          onClick={handleHideAll}
          className="flex-1 rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-600 hover:bg-gray-300"
        >
          Hide all
        </button>
        <button
          onClick={handleShowAll}
          className="flex-1 rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-600 hover:bg-gray-300"
        >
          Show all
        </button>
      </div>
    </div>
  );
};
