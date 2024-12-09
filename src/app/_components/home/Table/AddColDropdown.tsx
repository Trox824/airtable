import { useState, useEffect } from "react";
import { type ColumnType } from "@prisma/client";
import {
  useFloating,
  offset,
  flip,
  shift,
  useClick,
  useInteractions,
  useRole,
  useDismiss,
} from "@floating-ui/react";

interface AddColumnDropdownProps {
  buttonRef: React.RefObject<HTMLButtonElement>;
  isOpen: boolean;
  onClose: () => void;
  onCreateColumn: (name: string, type: ColumnType) => void;
}

export function AddColumnDropdown({
  buttonRef,
  isOpen,
  onClose,
  onCreateColumn,
}: AddColumnDropdownProps) {
  const { x, y, strategy, refs, context } = useFloating({
    open: isOpen,
    onOpenChange: (isOpen: boolean) => !isOpen && onClose(),
    middleware: [
      offset({
        mainAxis: 8,
        alignmentAxis: -20,
      }),
      flip({
        fallbackAxisSideDirection: "start",
        crossAxis: true,
        mainAxis: true,
      }),
      shift({ padding: 8 }),
    ],
    placement: "bottom-start",
  });

  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    if (buttonRef.current) {
      refs.setReference(buttonRef.current);
    }
  }, [buttonRef, refs]);

  if (!isOpen) return null;

  return (
    <div
      ref={refs.setFloating}
      {...getFloatingProps()}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
        width: "max-content",
      }}
      className="z-50 w-64 rounded bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5"
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <input
            type="text"
            name="name"
            className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-[13px] font-normal text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Field Name"
            required
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="mt-2 flex flex-col rounded border p-1 shadow">
          {["Text", "Number"].map((type) => (
            <button
              key={type}
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                const form = e.currentTarget.closest("form")!;
                const formData = new FormData(form);
                const name = formData.get("name") as string;
                if (name) {
                  onCreateColumn(name, type as ColumnType);
                  onClose();
                }
              }}
              className="cursor-pointer rounded p-1 pl-4 text-left text-[13px] font-normal text-gray-700 hover:bg-gray-100"
            >
              {type}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
