"use client";

import { Table } from "@prisma/client";
import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import React from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { AddTableDropdown } from "./Table/AddTableDropdown";
interface TableTabsProps {
  baseId: string;
  tableId: string;
  viewId: string;
}
interface TableWithCount {
  id: string;
  name: string;
  baseId: string;
  views: {
    id: string;
    name: string;
  }[];
  _count: {
    columns: number;
    rows: number;
  };
}
export function TableTabs({ baseId, tableId, viewId }: TableTabsProps) {
  const router = useRouter();
  const { data: tables = [] } = api.tables.getByBaseId.useQuery<
    TableWithCount[]
  >({ baseId });

  const [isCreating, setIsCreating] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string>(tableId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<string>(viewId);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const utils = api.useUtils();

  // New useEffect to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, buttonRef]);

  // Mutation to create a table with optimistic update
  const createTable = api.tables.create.useMutation({
    onMutate: async (newTable) => {
      await utils.tables.getByBaseId.cancel({ baseId });
      const previousTables = utils.tables.getByBaseId.getData({ baseId });
      const tempTableId = uuidv4();
      const tempViewId = uuidv4();

      const tempTable: TableWithCount = {
        id: tempTableId,
        name: newTable.name,
        baseId: newTable.baseId,
        views: [{ id: tempViewId, name: "Grid view" }],
        _count: {
          columns: 0,
          rows: 0,
        },
      };

      utils.tables.getByBaseId.setData(
        { baseId },
        (old: TableWithCount[] = []) => [...old, tempTable],
      );

      setSelectedTableId(tempTable.id);
      setSelectedViewId(tempViewId);
      setIsCreating(false);

      // Navigate with view ID
      router.push(`/${baseId}/${tempTableId}/${tempViewId}`);
      return { previousTables, tempTableId, tempViewId };
    },
    onSuccess: (createdTable, _, context) => {
      utils.tables.getByBaseId.setData(
        { baseId },
        (old: TableWithCount[] | undefined) =>
          old?.map((table) =>
            table.id === context?.tempTableId
              ? {
                  ...createdTable,
                  _count: {
                    columns: 0,
                    rows: 0,
                  },
                }
              : table,
          ),
      );
      // Navigate to the real view ID
      router.replace(
        `/${baseId}/${createdTable.id}/${createdTable.views[0]?.id}`,
      );
    },
    onError: (error, _, context) => {
      if (context?.previousTables) {
        utils.tables.getByBaseId.setData({ baseId }, context.previousTables);
      }
      console.error("Error creating table:", error);
    },
  });

  const handleCreateTable = () => {
    setIsDropdownOpen(true);
  };

  const handleSubmitNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTableName.trim()) {
      createTable.mutate({ baseId, name: newTableName.trim() });
      setNewTableName("");
      setIsCreating(false);
    }
  };

  const handleTableClick = (table: TableWithCount) => {
    setSelectedTableId(table.id);
    const targetViewId =
      table.id === tableId && viewId ? viewId : table.views[0]?.id;

    if (targetViewId) {
      setSelectedViewId(targetViewId);
      router.push(`/${baseId}/${table.id}/${targetViewId}`);
    }
  };

  useEffect(() => {
    const cachedTableId = localStorage.getItem(`selectedTable-${baseId}`);
    if (cachedTableId && tables.some((table) => table.id === cachedTableId)) {
      setSelectedTableId(cachedTableId);
    }
  }, [baseId, tables]);

  useEffect(() => {
    localStorage.setItem(`selectedTable-${baseId}`, selectedTableId);
  }, [selectedTableId, baseId]);

  return (
    <div className="fixed left-0 right-0 top-navbar z-40 h-8 bg-teal-500 text-white">
      <div className="flex h-8 flex-row justify-between">
        {/* Left side content */}
        <div className="flex w-full flex-row items-center overflow-scroll rounded-tr-lg bg-white [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Active tab indicator */}
          <div
            className={`h-full w-3 ${
              tables.length > 1 && tables[0] && selectedTableId === tables[0].id
                ? "rounded-br-sm"
                : ""
            } bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]`}
          ></div>

          {tables.map((table, index) => (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`-ml-[1px] h-full cursor-pointer bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)] ${
                tables[index] && tables[index + 1]?.id === selectedTableId
                  ? "rounded-br-sm"
                  : tables[index] && tables[index - 1]?.id === selectedTableId
                    ? "rounded-bl-sm"
                    : ""
              }`}
            >
              <div
                className={`relative flex h-full items-center p-3 ${
                  selectedTableId !== table.id ? "" : "rounded-t-sm bg-white"
                }`}
              >
                <span
                  className={`max-w-[200px] truncate text-[13px] font-medium ${
                    selectedTableId !== table.id
                      ? "text-white"
                      : "text-gray-700"
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
              </div>
            </div>
          ))}
          <div
            tabIndex={0}
            role="button"
            aria-label="Search all tables"
            className={`pointer focus-visible-opaque focus-container flex h-full flex-none cursor-pointer items-center justify-center ${
              selectedTableId === tables[tables.length - 1]?.id
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
          <div className="h-5"></div>
          <div
            onClick={handleCreateTable}
            ref={buttonRef as unknown as React.RefObject<HTMLDivElement>}
            className="relative flex h-full cursor-pointer items-center bg-teal-500 px-2 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"
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
              {tables.length === 0 && (
                <p className="text-[13px] font-normal">Add or import</p>
              )}
            </span>
          </div>
          {isDropdownOpen && (
            <AddTableDropdown
              dropdownRef={dropdownRef}
              buttonRef={buttonRef}
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              baseId={baseId}
              onTableCreated={(tableId: string) => {
                setSelectedTableId(tableId);
                router.push(`/${baseId}/${tableId}`);
              }}
            />
          )}
          <div className="h-full flex-grow rounded-tr-lg bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"></div>
        </div>

        <div className="w-2"></div>
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
