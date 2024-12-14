import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AddTableDropdownProps {
  dropdownRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
  isOpen: boolean;
  onClose: () => void;
  baseId: string;
  createTable: (data: { name: string; baseId: string }) => void;
  createWithFakeData: (data: {
    name: string;
    baseId: string;
    rowCount: number;
  }) => void;
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
  const [rowCount, setRowCount] = useState("100");

  useEffect(() => {
    if (!isOpen || !buttonRef.current || !dropdownRef.current) return;

    const updateDropdownPosition = () => {
      const buttonRect = buttonRef.current!.getBoundingClientRect();
      const top = buttonRect.bottom - 50; // 8px gap
      const left = buttonRect.left;
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
      rowCount: parseInt(rowCount),
    });
  };
  return (
    isOpen && (
      <div
        ref={dropdownRef}
        className="absolute z-50 w-80 rounded-md bg-white px-4 pt-4 shadow-lg ring-1 ring-black ring-opacity-5"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Table Name
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Number of Rows
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={rowCount}
                onChange={(e) => setRowCount(e.target.value)}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500">Max: 30,000</span>
            </div>
          </div>

          <div className="mb-4 flex flex-col space-y-2">
            <button
              type="submit"
              disabled={!tableName.trim()}
              className="w-full cursor-pointer rounded-sm bg-white p-2 text-center text-sm font-normal text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Empty Table
            </button>
            <div className="border-t border-gray-200"></div>
            <button
              type="button"
              onClick={handleAddFakeData}
              disabled={!tableName.trim() || isCreatingWithFakeData}
              className="w-full cursor-pointer rounded-sm bg-white p-2 text-center text-sm font-normal text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreatingWithFakeData ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Creating...</span>
                </span>
              ) : (
                `Add Sample Rows`
              )}
            </button>
          </div>
        </form>
      </div>
    )
  );
}
