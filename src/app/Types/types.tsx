import { type ColumnDef } from "@tanstack/react-table";
import { ColumnType, FilterOperator } from "@prisma/client";

// Define metadata for columns
export interface ColumnMeta {
  type: ColumnType;
  name: string;
}

// Define a simple column structure
export type SimpleColumn = {
  name: string;
  id: string;
  type: ColumnType;
};

// Define sorting conditions
export type SortCondition = {
  columnId: string;
  order: "0-9" | "9-0" | "asc" | "desc";
};

// Define a table column with additional metadata
export interface TableColumn {
  type: ColumnType;
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tableId: string;
  columnDef: ColumnDef<Row, string | number | null>;
}

// Define sorted column structure
export type SortedColumn = {
  column: SimpleColumn;
  order: "asc" | "desc";
};

// Define filter conditions
export type FilterCondition = {
  columnId: string;
  operator: FilterOperator;
  value: string | null;
};

// Define the structure of a cell
export interface Cell {
  id: string;
  valueText: string | null;
  valueNumber: number | null;
  column: {
    type: ColumnType;
    id?: string;
    name?: string;
  };
  columnId: string;
  rowId: string;
  createdAt: Date;
  updatedAt: Date;
}
export type RowWithCells = {
  id: string;
  cells: Cell[];
};

// Define the structure of a row
export interface Row {
  id: string;
  tableId: string;
  cells: Cell[];
  createdAt: Date;
  updatedAt: Date;
}

// Extend the react-table module to include custom metadata
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, cellId: string, value: unknown) => void;
  }

  interface ColumnMeta<TData, TValue> {
    type: ColumnType;
    name: string;
  }
}

// Export ColumnType from Prisma client
export type { ColumnType } from "@prisma/client";

// Define parameters for updating a cell
export interface UpdateCellParams {
  id: string;
  rowId?: string;
  columnId?: string;
  valueText?: string | null;
  valueNumber?: number | null;
}

// Define the base structure for a type
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

// Define the structure for local cell updates
export interface LocalCellUpdate {
  id: string;
  valueText?: string | null;
  valueNumber?: number | null;
  tempRowId?: string; // To track which temporary row this update belongs to
}

// Define a map type for local updates
export type LocalUpdatesMap = Record<string, LocalCellUpdate>;
