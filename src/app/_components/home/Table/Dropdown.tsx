import { useState, useEffect } from "react";
import { type ColumnType } from "@prisma/client";

interface AddColumnDropdownProps {
  dropdownRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
  isOpen: boolean;
  onClose: () => void;
  onCreateColumn: (name: string, type: ColumnType) => void;
}

export function AddColumnDropdown({
  dropdownRef,
  buttonRef,
  isOpen,
  onClose,
  onCreateColumn,
}: AddColumnDropdownProps) {
  const [dropdownPosition, setDropdownPosition] = useState<{
    vertical: "top" | "bottom";
    horizontal: "left" | "right";
  }>({ vertical: "bottom", horizontal: "left" });

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current || !buttonRef.current) return;
      const target = event.target as Node;
      if (
        dropdownRef.current.contains(target) ||
        buttonRef.current.contains(target)
      ) {
        return;
      }
      onClose();
    };

    const updateDropdownPosition = () => {
      if (buttonRef.current && dropdownRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = dropdownRef.current.offsetHeight;
        const dropdownWidth = dropdownRef.current.offsetWidth;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        const spaceBelow = windowHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const spaceRight = windowWidth - buttonRect.left;

        setDropdownPosition({
          vertical:
            spaceBelow < dropdownHeight && spaceAbove > spaceBelow
              ? "top"
              : "bottom",
          horizontal: spaceRight < dropdownWidth ? "right" : "left",
        });
      }
    };

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("resize", updateDropdownPosition);
    updateDropdownPosition();

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen, onClose, buttonRef, dropdownRef]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-64 rounded-md bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5"
      style={{
        [dropdownPosition.vertical === "top" ? "bottom" : "top"]: "10px",
        [dropdownPosition.horizontal === "right" ? "right" : "left"]: "0",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            name="name"
            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-[13px] font-normal text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Field Name"
            required
          />
        </div>
        <div className="mt-2 flex flex-col rounded-md border p-1 shadow">
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.closest("form")!;
              const formData = new FormData(form);
              const name = formData.get("name") as string;
              if (name) {
                onCreateColumn(name, "Text");
              }
            }}
            className="cursor-pointer rounded-md p-1 pl-4 text-left text-[13px] font-normal text-gray-700 hover:bg-gray-100"
          >
            Text
          </button>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.closest("form")!;
              const formData = new FormData(form);
              const name = formData.get("name") as string;
              if (name) {
                onCreateColumn(name, "Number");
              }
            }}
            className="cursor-pointer rounded-md p-1 pl-4 text-left text-[13px] font-normal text-gray-700 hover:bg-gray-100"
          >
            Number
          </button>
        </div>
      </form>
    </div>
  );
}
