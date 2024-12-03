import { useState, useEffect, useRef } from "react";
import { type ColumnType } from "@prisma/client";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

interface AddTableDropdownProps {
  dropdownRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
  isOpen: boolean;
  onClose: () => void;
  baseId: string;
  onTableCreated: (tableId: string) => void;
}
export function AddTableDropdown({
  dropdownRef,
  buttonRef,
  isOpen,
  onClose,
  baseId,
  onTableCreated,
}: AddTableDropdownProps) {
  const router = useRouter();
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [tableName, setTableName] = useState("");
  const utils = api.useUtils();

  const createWithFakeData = api.tables.createWithDefaults.useMutation({
    onMutate: async (newTable) => {
      await utils.tables.getByBaseId.cancel({ baseId });
      const previousTables = utils.tables.getByBaseId.getData({ baseId });

      const tempTableId = uuidv4();
      const tempViewId = uuidv4();
      const tempTable = {
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
        ...old,
        tempTable,
      ]);

      onTableCreated(tempTableId);

      router.push(`/${baseId}/${tempTableId}/${tempViewId}`);

      return { previousTables, tempTableId, tempViewId };
    },
    onSuccess: (result) => {
      onClose();
      if (result.id && result.views?.[0]?.id) {
        router.replace(`/${baseId}/${result.id}/${result.views[0].id}`);
      }
    },
    onError: (error, _, context) => {
      if (context?.previousTables) {
        utils.tables.getByBaseId.setData({ baseId }, context.previousTables);
      }
      alert(`Error creating table with fake data: ${error.message}`);
    },
  });

  const createTableMutation = api.tables.create.useMutation({
    onMutate: async (newTable) => {
      await utils.tables.getByBaseId.cancel({ baseId });
      const previousTables = utils.tables.getByBaseId.getData({ baseId });

      const tempTableId = uuidv4();
      const tempViewId = uuidv4();
      const tempTable = {
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
        ...old,
        tempTable,
      ]);

      onTableCreated(tempTableId);

      router.push(`/${baseId}/${tempTableId}/${tempViewId}`);

      return { previousTables, tempTableId, tempViewId };
    },

    onSuccess: (createdTable) => {
      onTableCreated(createdTable.id);
      setTableName("");
      onClose();
      router.replace(
        `/${baseId}/${createdTable.id}/${createdTable.views[0]?.id}`,
      );
    },

    onError: (_, __, context) => {
      if (context?.previousTables) {
        utils.tables.getByBaseId.setData({ baseId }, context.previousTables);
      }
    },
  });

  useEffect(() => {
    if (!isOpen || !buttonRef.current || !dropdownRef.current) return;

    const updateDropdownPosition = () => {
      const buttonRect = buttonRef.current!.getBoundingClientRect();
      const dropdownRect = dropdownRef.current!.getBoundingClientRect();

      const top = buttonRect.bottom - 50; // 8px gap
      const left = buttonRect.left + window.scrollX;

      setDropdownPosition({ top, left });
    };

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition);
    };
  }, [isOpen, buttonRef, dropdownRef]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (tableName.trim()) {
      createTableMutation.mutate({
        name: tableName.trim(),
        baseId: baseId,
      });
    }
  };

  const handleAddFakeData = async () => {
    if (!tableName.trim()) {
      alert("Please enter a table name first");
      return;
    }

    try {
      createWithFakeData.mutate({
        name: tableName.trim(),
        baseId: baseId,
      });
    } catch (error) {
      console.error("Error creating table with fake data:", error);
      alert("Failed to create table with fake data");
    }
  };

  return (
    isOpen && (
      <div
        ref={dropdownRef}
        className="absolute z-50 w-64 rounded-md bg-white px-4 pt-4 shadow-lg ring-1 ring-black ring-opacity-5"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4 flex flex-col space-y-2">
            <button
              type="submit"
              disabled={!tableName.trim()}
              className="cursor-pointer rounded-sm p-2 pl-4 text-left text-sm font-normal text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Empty Table
            </button>
            <div className="border-t border-gray-200"></div>
            <button
              type="button"
              onClick={handleAddFakeData}
              disabled={!tableName.trim() || createWithFakeData.isPending}
              className="cursor-pointer rounded-sm p-2 pl-4 text-left text-sm font-normal text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createWithFakeData.isPending ? "Creating..." : "Add Sample Data"}
            </button>
          </div>
        </form>
      </div>
    )
  );
}
