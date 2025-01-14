"use client";

import { Table } from "@prisma/client";
import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import React from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { AddTableDropdown } from "./Table/AddTableDropdown";
import { TableTabsSkeleton } from "~/app/loading/tableTabsSkeleton";

interface TableTabsProps {
  baseId: string;
  tableId: string;
  viewId: string;
  setIsTableCreating: (isCreating: boolean) => void;
  isTableCreating: boolean;
  isCreatingWithFakeData: boolean;
  setIsCreatingWithFakeData: (isCreatingWithFakeData: boolean) => void;
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

export function TableTabs({
  baseId,
  tableId,
  viewId,
  setIsTableCreating,
  isTableCreating,
  isCreatingWithFakeData,
  setIsCreatingWithFakeData,
}: TableTabsProps) {
  const router = useRouter();
  const { data: tables = [], isLoading } = api.tables.getByBaseId.useQuery<
    TableWithCount[]
  >({ baseId });

  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<string>("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const utils = api.useUtils();

  const createWithFakeData = api.tables.createWithDefaults.useMutation({
    onMutate: async (newTable) => {
      setIsCreatingWithFakeData(true);

      await Promise.resolve();

      await utils.tables.getByBaseId.cancel({ baseId });
      await utils.columns.getByTableId.cancel();

      const previousTables = utils.tables.getByBaseId.getData({ baseId });

      const tempTableId = `temp-${uuidv4()}`;
      const tempViewId = `temp-${uuidv4()}`;

      const optimisticTable: TableWithCount = {
        id: tempTableId,
        name: newTable.name,
        baseId: newTable.baseId,
        views: [{ id: tempViewId, name: "Grid view" }],
        _count: {
          columns: 0,
          rows: 0,
        },
      };

      utils.tables.getByBaseId.setData({ baseId }, (old = []) => [
        ...(old ?? []),
        optimisticTable,
      ]);

      utils.columns.getByTableId.setData({ tableId: tempTableId }, []);

      setSelectedTableId(tempTableId);
      setIsDropdownOpen(false);
      localStorage.setItem(`selectedTable-${baseId}`, tempTableId);

      router.push(`/${baseId}/${tempTableId}/${tempViewId}`, { scroll: false });

      return { previousTables, tempTableId, tempViewId };
    },

    onSuccess: (result, _, context) => {
      if (!context) return;

      utils.tables.getByBaseId.setData({ baseId }, (old = []) =>
        (old ?? [])
          .filter((table) => table.id !== context.tempTableId)
          .concat({
            id: result.id,
            name: result.name,
            baseId: result.baseId,
            views: result.views,
            _count: {
              columns: 2,
              rows: 2,
            },
          }),
      );

      setSelectedTableId(result.id);
      localStorage.setItem(`selectedTable-${baseId}`, result.id);
      router.replace(`/${baseId}/${result.id}/${result.views[0]?.id}`, {
        scroll: false,
      });
    },

    onError: (error, _, context) => {
      setIsCreatingWithFakeData(false);
      if (context?.previousTables) {
        utils.tables.getByBaseId.setData({ baseId }, context.previousTables);
        utils.columns.getByTableId.setData(
          { tableId: context.tempTableId },
          undefined,
        );
      }
      alert(`Error creating table with fake data: ${error.message}`);
    },
    onSettled: () => {
      setIsCreatingWithFakeData(false);
    },
  });

  const createTableMutation = api.tables.create.useMutation({
    onMutate: async (newTable) => {
      setIsTableCreating(true);

      await utils.tables.getByBaseId.cancel({ baseId });
      await utils.columns.getByTableId.cancel();

      const previousTables = utils.tables.getByBaseId.getData({ baseId });

      const tempTableId = `temp-${uuidv4()}`;
      const tempViewId = `temp-${uuidv4()}`;

      const optimisticTable: TableWithCount = {
        id: tempTableId,
        name: newTable.name,
        baseId: newTable.baseId,
        views: [{ id: tempViewId, name: "Grid view" }],
        _count: {
          columns: 0,
          rows: 0,
        },
      };

      utils.tables.getByBaseId.setData({ baseId }, (old = []) => [
        ...(old ?? []),
        optimisticTable,
      ]);

      utils.columns.getByTableId.setData({ tableId: tempTableId }, []);

      setSelectedTableId(tempTableId);
      setIsDropdownOpen(false);
      localStorage.setItem(`selectedTable-${baseId}`, tempTableId);

      router.push(`/${baseId}/${tempTableId}/${tempViewId}`, { scroll: false });

      return { previousTables, tempTableId, tempViewId };
    },

    onSuccess: (createdTable, _, context) => {
      if (!context) return;

      utils.tables.getByBaseId.setData({ baseId }, (old = []) =>
        (old ?? [])
          .filter((table) => table.id !== context.tempTableId)
          .concat({
            id: createdTable.id,
            name: createdTable.name,
            baseId: createdTable.baseId,
            views: createdTable.views,
            _count: {
              columns: 0,
              rows: 0,
            },
          }),
      );

      setSelectedTableId(createdTable.id);
      localStorage.setItem(`selectedTable-${baseId}`, createdTable.id);
      router.replace(
        `/${baseId}/${createdTable.id}/${createdTable.views[0]?.id}`,
        {
          scroll: false,
        },
      );

      setTimeout(() => {
        setIsTableCreating(false);
      }, 500);
    },

    onError: (_, __, context) => {
      if (context?.previousTables) {
        utils.tables.getByBaseId.setData({ baseId }, context.previousTables);
        utils.columns.getByTableId.setData(
          { tableId: context.tempTableId },
          undefined,
        );
      }
      setIsTableCreating(false);
      alert("Failed to create table. Please try again.");
    },
  });

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

  const handleCreateTable = () => {
    setIsDropdownOpen(true);
  };

  const handleTableClick = (table: TableWithCount) => {
    setSelectedTableId(table.id);
    localStorage.setItem(`selectedTable-${baseId}`, table.id);
    const targetViewId =
      table.id === tableId && viewId ? viewId : table.views[0]?.id;

    if (targetViewId) {
      setSelectedViewId(targetViewId);
      router.push(`/${baseId}/${table.id}/${targetViewId}`);
    }
  };

  useEffect(() => {
    const validTables = tables.filter((table) => !table.id.startsWith("temp-"));
    const cachedTableId = localStorage.getItem(`selectedTable-${baseId}`);
    if (
      cachedTableId &&
      validTables.some((table) => table.id === cachedTableId)
    ) {
      setSelectedTableId(cachedTableId);
    } else if (validTables.length > 0) {
      const defaultTableId = validTables.some((t) => t.id === tableId)
        ? tableId
        : (validTables[0]?.id ?? "");

      setSelectedTableId(defaultTableId);
      localStorage.setItem(`selectedTable-${baseId}`, defaultTableId);
    }
  }, [baseId, tables, tableId]);

  useEffect(() => {
    setSelectedTableId(tableId);
    setSelectedViewId(viewId);
  }, [tableId, viewId]);

  if (isLoading) {
    return <TableTabsSkeleton />;
  }

  return (
    <div className="fixed left-0 right-0 top-navbar z-40 h-8 bg-teal-500 text-white">
      <div className="flex h-8 flex-row justify-between">
        <div className="flex w-full flex-row items-center overflow-scroll rounded-tr-lg bg-white [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  {table.id.startsWith("temp-") && ""}
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

              <p className="text-[13px] font-normal">Add or import</p>
            </span>
          </div>
          {isDropdownOpen && (
            <AddTableDropdown
              dropdownRef={dropdownRef}
              buttonRef={buttonRef}
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              baseId={baseId}
              createTable={createTableMutation.mutate}
              createWithFakeData={createWithFakeData.mutate}
              isCreatingWithFakeData={createWithFakeData.isPending}
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
