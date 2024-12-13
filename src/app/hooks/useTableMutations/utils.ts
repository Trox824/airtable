import {
  type SortCondition,
  type SimpleColumn,
  type Row,
} from "../../Types/types";

export function mapSortConditionsToAPI(
  conditions: SortCondition[] | undefined,
) {
  if (!conditions) return [];
  console.log("conditions", conditions);
  return conditions.map((condition) => ({
    columnId: condition.columnId,
    order: condition.order,
  })) as { columnId: string; order: "asc" | "desc" }[];
}

export function sortRowsByConditions(
  rows: Row[],
  sortConditions: SortCondition[],
  columns: SimpleColumn[],
): Row[] {
  return [...rows].sort((a, b) => {
    for (const condition of sortConditions) {
      const column = columns.find((col) => col.id === condition.columnId);
      if (!column) continue;

      const aCell = a.cells.find(
        (cell) => cell.columnId === condition.columnId,
      );
      const bCell = b.cells.find(
        (cell) => cell.columnId === condition.columnId,
      );

      let aValue: number | string | null = null;
      let bValue: number | string | null = null;

      if (column.type === "Number") {
        aValue = aCell?.valueNumber ?? null;
        bValue = bCell?.valueNumber ?? null;
      } else {
        aValue = (aCell?.valueText ?? "").toLowerCase();
        bValue = (bCell?.valueText ?? "").toLowerCase();
      }

      if (aValue !== bValue) {
        let comparison = 0;
        if (aValue == null && bValue != null) {
          comparison = -1;
        } else if (bValue == null && aValue != null) {
          comparison = 1;
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = Number(aValue) - Number(bValue);
        }

        return condition.order === "0-9" || condition.order === "asc"
          ? comparison
          : -comparison;
      }
    }
    return 0;
  });
}
