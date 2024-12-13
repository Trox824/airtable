import { useEffect, useState } from "react";
import { type CellContext } from "@tanstack/react-table";
import { type Row } from "../../../Types/types";
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
  onCellUpdate?: () => Promise<void>;
}

export const CellRenderer = memo(function CellRenderer({
  info,
  setEditing,
  meta,
  isHighlighted,
  searchQuery,
  onCellUpdate,
}: CellRendererProps) {
  const [localValue, setLocalValue] = useState<string | number | null>(
    info.getValue(),
  );
  const [isEditing, setIsEditing] = useState(false);

  const columnType = info.table.getColumn(info.column.id)?.columnDef
    .meta as ColumnMeta;

  useEffect(() => {
    setLocalValue(info.getValue());
  }, [info.getValue()]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (columnType.type === "Number") {
      if (newValue === "") {
        setLocalValue(null);
      } else {
        const parsedNumber = Number(newValue);
        if (!isNaN(parsedNumber)) {
          setLocalValue(parsedNumber);
        } else {
          toast.error("This column only accepts numbers");
        }
      }
    } else if (columnType.type === "Text") {
      setLocalValue(newValue);
    }
  };

  const onBlur = async () => {
    setIsEditing(false);
    setEditing?.(false);

    if (localValue === info.getValue()) return;

    const valueToUpdate =
      typeof localValue === "string" && localValue.trim() === ""
        ? null
        : localValue;

    meta?.updateData(info.row.index, info.column.id, valueToUpdate);
    if (onCellUpdate) {
      await onCellUpdate();
    }
  };

  const onFocus = () => {
    setIsEditing(true);
    setEditing?.(true);
  };

  if (isEditing) {
    return (
      <input
        value={localValue ?? ""}
        onChange={handleChange}
        onBlur={onBlur}
        type={columnType?.type === "Number" ? "number" : "text"}
        className="flex h-full w-full items-center rounded border-2 border-blue-500 bg-transparent px-2 outline-none"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            void onBlur();
          }
        }}
      />
    );
  }
  const cellValue = localValue;

  const highlightedText =
    searchQuery && cellValue ? (
      <span>
        {cellValue
          .toString()
          .split(new RegExp(`(${searchQuery})`, "gi"))
          .map((part, i) =>
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
      onClick={onFocus}
      onFocus={onFocus}
      tabIndex={0}
      data-row-index={info.row.index}
      data-column-index={info.table.getColumn(info.column.id)?.getIndex()}
    >
      {highlightedText}
    </div>
  );
});
