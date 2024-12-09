import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AddTableDropdownProps {
  dropdownRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
  isOpen: boolean;
  onClose: () => void;
  baseId: string;
  createTable: (data: { name: string; baseId: string }) => void;
  createWithFakeData: (data: { name: string; baseId: string }) => void;
  isCreatingWithFakeData: boolean;
}
export function AddTableDropdown({
  dropdownRef,
  buttonRef,
  isOpen,
  onClose,
  baseId,
  createTable,
  createWithFakeData,
  isCreatingWithFakeData,
}: AddTableDropdownProps) {
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [tableName, setTableName] = useState("");

  useEffect(() => {
    if (!isOpen || !buttonRef.current || !dropdownRef.current) return;

    const updateDropdownPosition = () => {
      const buttonRect = buttonRef.current!.getBoundingClientRect();
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
      createTable({
        name: tableName.trim(),
        baseId: baseId,
      });
    }
  };
  const handleAddFakeData = () => {
    if (!tableName.trim()) {
      alert("Please enter a table name first");
      return;
    }
    createWithFakeData({
      name: tableName.trim(),
      baseId: baseId,
    });
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
              disabled={!tableName.trim() || isCreatingWithFakeData}
              className="cursor-pointer rounded-sm p-2 pl-4 text-left text-sm font-normal text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreatingWithFakeData ? "Creating..." : "Add Sample Data"}
            </button>
          </div>
        </form>
      </div>
    )
  );
}
