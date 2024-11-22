"use client";

import { Table } from "@prisma/client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import React from "react";

interface TableTabsProps {
  tables: Table[];
  currentTableId: string;
  baseId: string;
}
export function TableTabs({
  tables = [],
  currentTableId,
  baseId,
}: TableTabsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [localTables, setLocalTables] = useState<Table[]>(tables);
  const [selectedTableId, setCurrentTableId] = useState<string>(currentTableId);

  const utils = api.useUtils();
  const createTable = api.tables.create.useMutation({
    onMutate: async (newTable) => {
      // Create a temporary table
      const tempTable: Table = {
        id: `temp-${Date.now()}`,
        name: newTable.name,
        baseId: newTable.baseId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistically add the temp table to the local state
      setLocalTables((prev) => [...prev, tempTable]);
      setCurrentTableId(tempTable.id);
      setIsCreating(false);

      return { tempTable };
    },
    onSuccess: (created, _, context) => {
      if (context?.tempTable) {
        // Replace the temp table with the real one
        setLocalTables((prev) =>
          prev.map((table) =>
            table.id === context.tempTable.id ? created : table,
          ),
        );
        setCurrentTableId(created.id);
      }
      void utils.tables.getByBaseId.invalidate({ baseId });
    },
    onError: (_, __, context) => {
      if (context?.tempTable) {
        // Remove the temp table if the creation failed
        setLocalTables((prev) =>
          prev.filter((table) => table.id !== context.tempTable.id),
        );
      }
    },
  });

  const handleCreateTable = () => {
    setIsCreating(true);
  };

  const handleSubmitNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTableName.trim()) {
      createTable.mutate({ baseId, name: newTableName.trim() });
      setNewTableName("");
      setIsCreating(false);
    }
  };

  // Load the cached table ID on component mount
  useEffect(() => {
    const cachedTableId = localStorage.getItem(`selectedTable-${baseId}`);
    if (
      cachedTableId &&
      localTables.some((table) => table.id === cachedTableId)
    ) {
      setCurrentTableId(cachedTableId);
    }
  }, [baseId, localTables]);

  // Update localStorage when table selection changes
  useEffect(() => {
    localStorage.setItem(`selectedTable-${baseId}`, selectedTableId);
  }, [selectedTableId, baseId]);

  return (
    <div className="relative h-8 bg-teal-500 text-white">
      <div className="flex h-8 flex-row justify-between">
        {/* Left side content */}
        <div className="flex w-full flex-row items-center overflow-scroll rounded-tr-lg bg-white [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Active tab */}
          <div
            className={`h-full w-3 ${
              localTables.length > 1 &&
              localTables[0] &&
              selectedTableId === localTables[0].id
                ? "rounded-br-sm"
                : ""
            } bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]`}
          ></div>

          {localTables.map((table, index) => (
            <div
              key={table.id}
              onClick={() => setCurrentTableId(table.id)}
              className={`h-full bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)] ${
                localTables[index] &&
                localTables[index + 1]?.id === selectedTableId
                  ? "rounded-br-sm"
                  : localTables[index] &&
                      localTables[index - 1]?.id === selectedTableId
                    ? "rounded-bl-sm"
                    : ""
              }`}
            >
              <div
                className={`relative flex h-full items-center pl-3 ${
                  selectedTableId !== table.id ? "" : "rounded-t-sm bg-white"
                }`}
              >
                <span
                  className={`max-w-[200px] truncate text-[13px] font-medium ${
                    selectedTableId !== table.id
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  {table.name}
                </span>
                {selectedTableId === table.id && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    className="ml-2 flex-shrink-0 fill-black"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 6l4 4 4-4H4z" />
                  </svg>
                )}
                <div className="ml-2 h-[13px] border-r-[1px] border-white/10"></div>
              </div>
            </div>
          ))}

          {/* Search all tables button */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Search all tables"
            className={`pointer focus-visible-opaque focus-container flex h-full flex-none items-center justify-center ${
              selectedTableId === localTables[localTables.length - 1]?.id
                ? "rounded-bl-sm"
                : ""
            } bg-teal-500 px-1.5 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="parent-focus-visible-current-color flex-none"
              style={{ shapeRendering: "geometricPrecision" }}
            >
              <path d="M4 6l4 4 4-4H4z" fill="currentColor" />
            </svg>
          </div>

          {/* Modified Add or import section */}
          <div className="h-5"></div>
          {isCreating ? (
            <form
              onSubmit={handleSubmitNewTable}
              className="flex h-full items-center bg-teal-500 px-2 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"
            >
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Table name"
                className="h-6 w-32 rounded px-2 text-sm text-gray-900"
                autoFocus
                onBlur={() => {
                  if (!newTableName.trim()) {
                    setIsCreating(false);
                  }
                }}
              />
            </form>
          ) : (
            <div
              onClick={handleCreateTable}
              className="flex h-full items-center bg-teal-500 px-2 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"
            >
              <span className="flex cursor-pointer flex-row items-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  className="mr-1 stroke-white"
                  xmlns="http://www.w3.org/2000/svg"
                  strokeWidth="2"
                  fill="none"
                >
                  <path d="M8 1v14M1 8h14" />
                </svg>
                {tables.length === 5 && (
                  <p className="text-[13px] font-normal">Add or import</p>
                )}
              </span>
            </div>
          )}

          {/* New div to take up remaining space */}
          <div className="h-full flex-grow rounded-tr-lg bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"></div>
        </div>
        <div className="w-2"></div>
        {/* Right side content */}
        <div className="flex flex-row">
          <div className="pointer flex h-8 items-center rounded-tl-[8px] bg-black/10 px-4">
            <div className="flex items-center">
              <div className="text-[13px] font-normal">Extensions</div>
            </div>
          </div>
          <div className="pointer flex h-8 items-center bg-black/10 px-4">
            <div className="flex items-center">
              <div className="item-center flex text-[13px] font-normal">
                Tools
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
