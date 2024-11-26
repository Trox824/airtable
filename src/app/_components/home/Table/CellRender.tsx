import { useEffect, useState } from "react";
import { type CellContext } from "@tanstack/react-table";
import { type Row } from "./types";
import { type ColumnType } from "@prisma/client";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { type ColumnMeta } from "./types";
interface CellRendererProps {
  info: CellContext<Row, string | number | null>;
  setEditing?: (editing: boolean) => void;
  meta?: {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  };
}

export const CellRenderer = ({ info }: CellRendererProps) => {
  const {
    getValue,
    row: { index },
    column: { id },
    table,
  } = info;
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);

  const columnType = table.getColumn(id)?.columnDef.meta as ColumnMeta;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    // Only update if the value matches the column type
    if (isValidValue(value, columnType.type)) {
      table.options.meta?.updateData(index, id, value);
    } else {
      // Reset to initial value if invalid
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
      // Handle other types if necessary
      toast.error("Invalid input type");
    }
  };

  // Ensure columnType is defined
  const inputType = columnType?.type === "Number" ? "number" : "text";

  return (
    <input
      value={value ?? ""}
      onChange={handleChange}
      onBlur={onBlur}
      type={inputType}
      className="flex h-full w-full items-center px-2 outline-none"
      onKeyDown={(e) => {
        // Prevent non-numeric input for number columns
        if (columnType.type === "Number") {
          const allowedKeys = [
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "Tab",
            ".",
            "-",
          ];
          if (!allowedKeys.includes(e.key) && isNaN(Number(e.key))) {
            e.preventDefault();
            toast.error("This column only accepts numbers");
          }
        }
      }}
    />
  );
};

function isValidValue(
  value: string | number | null,
  columnType?: string,
): boolean {
  if (value === null) return true;
  if (columnType === "Number") return typeof value === "number";
  if (columnType === "Text") return typeof value === "string";
  return false;
}
