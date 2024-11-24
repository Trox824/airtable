export type ColumnType = "Text" | "Number";

export interface CellType {
  id: string;
  valueText: string | null;
  valueNumber: number | null;
  column: {
    id: string;
    type: ColumnType;
    name: string;
  };
  columnId: string;
  rowId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Row {
  id: string;
  tableId: string;
  cells: CellType[];
  createdAt: Date;
  updatedAt: Date;
}
