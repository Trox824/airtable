import { type ColumnDef } from "@tanstack/react-table";
import { ColumnType, FilterOperator } from "@prisma/client";

export interface ColumnMeta {
  type: ColumnType;
  name: string;
}

export type SimpleColumn = {
  name: string;
  id: string;
  type: ColumnType;
};
export type SortCondition = {
  columnId: string;
  order: "0-9" | "9-0" | "asc" | "desc";
};
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
export type SortedColumn = {
  column: SimpleColumn;
  order: "asc" | "desc";
};

export type FilterCondition = {
  columnId: string;
  operator: FilterOperator;
  value: string | null;
};
// Cell type
export interface Cell {
  id: string;
  valueText: string | null;
  valueNumber: number | null;
  column: {
    type: ColumnType;
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
    updateData: (rowIndex: number, cellId: string, value: unknown) => void;
  }

  interface ColumnMeta<TData, TValue> {
    type: ColumnType;
    name: string;
  }
}

export type { ColumnType } from "@prisma/client";

export interface UpdateCellParams {
  id: string;
  valueText?: string | null;
  valueNumber?: number | null;
}

export type BaseType = {
  id: string;
  name: string;
  tables: {
    id: string;
    name: string;
    views: {
      id: string;
      name: string;
    }[];
  }[];
};
