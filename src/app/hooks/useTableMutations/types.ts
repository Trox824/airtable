import { ColumnType } from "@prisma/client";
import {
  type SortCondition,
  type FilterCondition,
  SimpleColumn,
} from "../../Types/types";

export interface TableMutationsProps {
  tableId: string;
  searchQuery: string;
  sortConditions?: SortCondition[];
  filterConditions?: FilterCondition[];
  columns: SimpleColumn[];
  setIsTableCreating: (isCreating: boolean) => void;
  refetchData: () => Promise<void>;
}

export interface TempCellValues {
  valueText: string | null;
  valueNumber: number | null;
}

export interface UpdateCellParams {
  id: string;
  valueText?: string | null;
  valueNumber?: number | null;
}
