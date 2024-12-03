import { useEffect, useState } from "react";
import { type CellContext } from "@tanstack/react-table";
import { type Row } from "../../../Types/types";
import { type ColumnType } from "@prisma/client";
import { toast } from "sonner";
import { type ColumnMeta } from "../../../Types/types";
import { memo } from "react";
interface CellRendererProps {
  info: CellContext<Row, string | number | null>;
  setEditing?: (editing: boolean) => void;
  meta?: {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  };
  searchQuery?: string;
  isHighlighted?: boolean;
}

export const CellRenderer = memo(function CellRenderer({
  info,
  setEditing,
  meta,
  isHighlighted,
  searchQuery,
}: CellRendererProps) {
  const {
    getValue,
    row: { index },
    column: { id },
    table,
  } = info;
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const columnType = table.getColumn(id)?.columnDef.meta as ColumnMeta;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    setIsEditing(false);
    if (isValidValue(value, columnType.type)) {
      table.options.meta?.updateData(index, id, value);
    } else {
      setValue(initialValue);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (columnType.type === "Number") {
      if (newValue === "" || !isNaN(Number(newValue))) {
        setValue(newValue === "" ? null : Number(newValue));
      } else {
        toast.error("This column only accepts numbers");
        setValue(value);
      }
    } else if (columnType.type === "Text") {
      setValue(newValue);
    } else {
      toast.error("Invalid input type");
    }
  };

  const onFocus = () => {
    setIsEditing(true);
    setEditing?.(true);
  };

  if (isEditing) {
    return (
      <input
        value={value ?? ""}
        onChange={handleChange}
        onBlur={onBlur}
        type={columnType?.type === "Number" ? "number" : "text"}
        className="flex h-full w-full items-center rounded border-2 border-blue-500 bg-transparent px-2 outline-none"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onBlur();
          }
        }}
      />
    );
  }

  const cellValue = value?.toString() ?? "";
  const highlightedText =
    searchQuery && cellValue ? (
      <span>
        {cellValue.split(new RegExp(`(${searchQuery})`, "gi")).map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={i} className="bg-yellow-200">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </span>
    ) : (
      cellValue
    );

  return (
    <div
      className={`flex h-full w-full cursor-text items-center px-2`}
      onClick={() => onFocus()}
      onFocus={onFocus}
      tabIndex={0}
      data-row-index={index}
      data-column-index={table.getColumn(id)?.getIndex()}
    >
      {highlightedText}
    </div>
  );
});

function isValidValue(
  value: string | number | null,
  columnType?: string,
): boolean {
  if (value === null) return true;
  if (columnType === "Number") return typeof value === "number";
  if (columnType === "Text") return typeof value === "string";
  return false;
}
