import { useState, useEffect } from "react";

interface Table {
  id: string;
  name: string;
  // ... other table properties
  isPending?: boolean;
}

export function useLocalTables(
  baseId: string,
  initialTables: Table[],
): {
  tables: Table[];
  addLocalTable: (newTable: Table) => void;
  confirmTable: (tableId: string) => void;
  removeTable: (tableId: string) => void;
} {
  // Load tables from localStorage or use initial tables
  const [tables, setTables] = useState<Table[]>(() => {
    if (typeof window === "undefined") return initialTables;

    const cached = localStorage.getItem(`tables-${baseId}`);
    return cached ? (JSON.parse(cached) as Table[]) : initialTables;
  });

  // Update localStorage whenever tables change
  useEffect(() => {
    localStorage.setItem(`tables-${baseId}`, JSON.stringify(tables));
  }, [tables, baseId]);

  const addLocalTable = (newTable: Table) => {
    setTables((prev) => [...prev, { ...newTable, isPending: true }]);
  };

  const confirmTable = (tableId: string) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId ? { ...table, isPending: false } : table,
      ),
    );
  };

  const removeTable = (tableId: string) => {
    setTables((prev) => prev.filter((table) => table.id !== tableId));
  };

  return {
    tables,
    addLocalTable,
    confirmTable,
    removeTable,
  };
}
