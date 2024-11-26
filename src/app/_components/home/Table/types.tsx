import { type ColumnDef } from "@tanstack/react-table";
import { ColumnType } from "@prisma/client";

export interface ColumnMeta {
  type: ColumnType;
}

// Column type
export interface TableColumn {
  type: ColumnType;
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tableId: string;
  columnDef: ColumnDef<Row, string | number | null>;
}

// Cell type
export interface Cell {
  id: string;
  valueText: string | null;
  valueNumber: number | null;
  column: {
    type: ColumnType;
    name: string;
    id: string;
    tableId: string;
    createdAt: Date;
    updatedAt: Date;
    columnDef: ColumnDef<Row, string | number | null> | null;
  };
  columnId: string;
  rowId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Row type
export interface Row {
  id: string;
  tableId: string;
  cells: Cell[];
  createdAt: Date;
  updatedAt: Date;
}

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}
