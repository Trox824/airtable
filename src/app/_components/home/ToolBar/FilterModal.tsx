import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { SimpleColumn, FilterCondition } from "../Table/types";
import { api } from "~/trpc/react";
import { ColumnType, FilterOperator } from "@prisma/client";

interface FilterModalProps {
  columns: SimpleColumn[] | undefined;
  loading: boolean;
  viewId: string;
  filterConditions: FilterCondition[];
  setFilterConditions: (conditions: FilterCondition[]) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  columns,
  loading,
  viewId,
  filterConditions,
  setFilterConditions,
}) => {
  const [selectedColumns, setSelectedColumns] = useState<
    (SimpleColumn | null)[]
  >(
    filterConditions.map(
      (condition) =>
        columns?.find((col) => col.id === condition.columnId) ?? null,
    ),
  );
  console.log(filterConditions);
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>(
    {},
  );
  const [inputValues, setInputValues] = useState<string[]>(
    filterConditions.map((condition) => condition.value ?? ""),
  );
  const [selectedOperators, setSelectedOperators] = useState<FilterOperator[]>(
    filterConditions.map((condition) => condition.operator),
  );

  const [openOperatorDropdowns, setOpenOperatorDropdowns] = useState<
    Record<number, boolean>
  >({});

  const [visibleFilterForms, setVisibleFilterForms] = useState<number>(
    filterConditions.length,
  );

  const dropdownRef = useRef<HTMLDivElement>(null); // Moved ref to parent container

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdowns({});
        setOpenOperatorDropdowns({});

        // Optionally, handle adding condition only if necessary
        // Removed automatic handleAddCondition to prevent unintended additions
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedColumns, selectedOperators, inputValues]);

  const utils = api.useUtils();
  const saveFiltersMutation = api.view.saveFilterConditions.useMutation({
    onSuccess: () => {
      void utils.view.invalidate();
    },
    onError: (error) => {
      console.error("Failed to save filters:", error);
    },
  });

  const handleAddCondition = () => {
    if (selectedColumns[0] && selectedOperators[0]) {
      const newCondition: FilterCondition = {
        columnId: selectedColumns[0].id,
        operator: selectedOperators[0],
        value: inputValues[0] ?? null,
      };
      const newConditions = [...filterConditions, newCondition];

      setFilterConditions(newConditions);

      saveFiltersMutation.mutate({
        viewId,
        filters: newConditions.map((condition) => ({
          ...condition,
          value: condition.value ?? undefined,
        })),
      });

      setSelectedColumns([null]);
      setSelectedOperators([FilterOperator.GreaterThan]);
      setInputValues([""]);
    }
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = filterConditions.filter((_, i) => i !== index);

    // Update visibleFilterForms count
    setVisibleFilterForms((prev) => prev - 1);

    // Update related state arrays
    setSelectedColumns((prev) => prev.filter((_, i) => i !== index));
    setSelectedOperators((prev) => prev.filter((_, i) => i !== index));
    setInputValues((prev) => prev.filter((_, i) => i !== index));

    // Optimistically update the UI
    setFilterConditions(newConditions);

    // Then perform the server mutation
    saveFiltersMutation.mutate(
      {
        viewId,
        filters: newConditions.map((condition) => ({
          ...condition,
          value: condition.value ?? undefined,
        })),
      },
      {
        // Rollback on error
        onError: () => {
          setFilterConditions(filterConditions);
          setVisibleFilterForms((prev) => prev + 1); // Restore the count
          // Optionally show an error toast/notification here
        },
      },
    );
  };

  const operatorLabels: Record<FilterOperator, string> = {
    [FilterOperator.GreaterThan]: "greater than",
    [FilterOperator.SmallerThan]: "less than",
    [FilterOperator.IsEmpty]: "is empty",
    [FilterOperator.IsNotEmpty]: "is not empty",
    [FilterOperator.Equals]: "equals",
    [FilterOperator.Contains]: "contains",
  };

  const remainingColumns = columns?.filter(
    (column) =>
      !filterConditions.some((condition) => condition.columnId === column.id) &&
      !selectedColumns.some((selected) => selected?.id === column.id),
  );

  const handleAddFilterForm = () => {
    if (remainingColumns && remainingColumns.length > 0) {
      setVisibleFilterForms((prev) => prev + 1);
      setSelectedOperators((prev) => [...prev, FilterOperator.GreaterThan]);
      setSelectedColumns((prev) => [...prev, null]);
      setInputValues((prev) => [...prev, ""]);
    }
  };

  const handleRemoveFilterForm = (index: number) => {
    setVisibleFilterForms((prev) => prev - 1);
    setOpenDropdowns((prev) => {
      const newDropdowns = { ...prev };
      delete newDropdowns[index];
      return newDropdowns;
    });
    setOpenOperatorDropdowns((prev) => {
      const newDropdowns = { ...prev };
      delete newDropdowns[index];
      return newDropdowns;
    });
  };

  const getOperatorsForColumn = (column: SimpleColumn | null) => {
    if (!column) return [];

    if (column.type === ColumnType.Text) {
      return [FilterOperator.IsEmpty, FilterOperator.IsNotEmpty];
    }

    return [FilterOperator.GreaterThan, FilterOperator.SmallerThan];
  };

  const handleColumnChange = (index: number, column: SimpleColumn | null) => {
    const newSelectedColumns = [...selectedColumns];
    newSelectedColumns[index] = column;
    setSelectedColumns(newSelectedColumns);

    // Reset operator and input when column changes
    const newSelectedOperators = [...selectedOperators];
    newSelectedOperators[index] =
      column && column.type === ColumnType.Text
        ? FilterOperator.IsEmpty
        : FilterOperator.GreaterThan;
    setSelectedOperators(newSelectedOperators);

    const newInputValues = [...inputValues];
    newInputValues[index] = "";
    setInputValues(newInputValues);
  };

  const handleOperatorChange = (index: number, operator: FilterOperator) => {
    const newSelectedOperators = [...selectedOperators];
    newSelectedOperators[index] = operator;
    setSelectedOperators(newSelectedOperators);
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputValues = [...inputValues];
    newInputValues[index] = value;
    setInputValues(newInputValues);
  };
  console.log(selectedColumns, selectedOperators, inputValues);
  const handleApplyFilter = () => {
    const newConditions = selectedColumns
      .slice(0, visibleFilterForms)
      .map((column, index) => {
        if (!column || !selectedOperators[index]) return null;

        const noValueOperators = [
          FilterOperator.IsEmpty.toString(),
          FilterOperator.IsNotEmpty.toString(),
        ];

        const value = noValueOperators.includes(
          selectedOperators[index].toString(),
        )
          ? null
          : (inputValues[index] ?? null);

        return {
          columnId: column.id,
          operator: selectedOperators[index],
          value,
        };
      })
      .filter((condition): condition is FilterCondition => condition !== null);

    // Optimistically update the UI
    setFilterConditions(newConditions);

    // Store the previous conditions for rollback
    const previousConditions = filterConditions;

    // Perform the server mutation
    saveFiltersMutation.mutate(
      {
        viewId,
        filters: newConditions.map((condition) => ({
          ...condition,
          value: condition.value ?? undefined,
        })),
      },
      {
        onSuccess: () => {
          // Reset the form state after successful save
          setVisibleFilterForms(newConditions.length);
          setSelectedColumns(
            newConditions.map(
              (condition) =>
                columns?.find((col) => col.id === condition.columnId) ?? null,
            ),
          );
          setSelectedOperators(
            newConditions.map((condition) => condition.operator),
          );
          setInputValues(
            newConditions.map((condition) => condition.value ?? ""),
          );

          // Add a new empty form after successful apply
          handleAddFilterForm();
        },
        onError: () => {
          setFilterConditions(previousConditions);
        },
      },
    );
  };

  return (
    <div className="absolute top-full mt-1 flex w-max min-w-96 rounded-sm border bg-white p-4 text-xs shadow-lg">
      <div
        className="relative flex h-full w-full flex-col gap-y-3 text-xs text-gray-500"
        ref={dropdownRef} // Moved ref here to encompass all dropdowns
      >
        <span>In this view, show records where:</span>

        {/* Combined Filter Forms (including existing conditions) */}
        {Array.from({ length: visibleFilterForms }).map((_, index) => (
          <div key={index} className="flex w-full items-center gap-x-2">
            {/* Column Dropdown */}
            <div className="relative">
              <button
                className="flex w-60 items-center justify-between gap-x-2 border p-2 hover:bg-gray-100"
                onClick={() => {
                  setOpenDropdowns((prev) => ({
                    ...prev,
                    [index]: !prev[index],
                  }));
                }}
              >
                <div>{selectedColumns[index]?.name ?? "Select a column"}</div>
                <ChevronDown size={16} />
              </button>
              {openDropdowns[index] &&
                remainingColumns &&
                remainingColumns.length > 0 && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-60 rounded-sm border bg-white shadow-lg">
                    {remainingColumns.map((column) => (
                      <div
                        key={column.id}
                        className="cursor-pointer p-2 hover:bg-gray-100"
                        onClick={() => {
                          handleColumnChange(index, column);
                          setOpenDropdowns((prev) => ({
                            ...prev,
                            [index]: false,
                          }));
                        }}
                      >
                        {column.name}
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Operator Dropdown */}
            <div className="relative">
              <button
                className="flex w-32 items-center justify-between gap-x-2 border p-2 hover:bg-gray-100"
                onClick={() => {
                  setOpenOperatorDropdowns((prev) => ({
                    ...prev,
                    [index]: !prev[index],
                  }));
                }}
              >
                <div>
                  {selectedOperators[index]
                    ? operatorLabels[selectedOperators[index]]
                    : "Select operator"}
                </div>
                <ChevronDown size={16} />
              </button>
              {openOperatorDropdowns[index] && (
                <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-sm border bg-white shadow-lg">
                  {getOperatorsForColumn(selectedColumns[index] ?? null).map(
                    (operator) => (
                      <div
                        key={operator}
                        className="cursor-pointer p-2 hover:bg-gray-100"
                        onClick={() => {
                          handleOperatorChange(index, operator);
                          setOpenOperatorDropdowns((prev) => ({
                            ...prev,
                            [index]: false,
                          }));
                        }}
                      >
                        {operatorLabels[operator]}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Input Field (only for applicable operators) */}
            {selectedOperators[index] !== FilterOperator.IsEmpty &&
              selectedOperators[index] !== FilterOperator.IsNotEmpty && (
                <input
                  className="w-32 border p-2"
                  placeholder="Enter value..."
                  value={inputValues[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                />
              )}
            <button
              onClick={() => handleRemoveCondition(index)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} strokeWidth={1} />
            </button>
          </div>
        ))}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleAddFilterForm}
            className="flex items-center gap-x-2 text-blue-500 disabled:opacity-50"
            disabled={!remainingColumns?.length}
          >
            <Plus size={16} />
            <span>Add condition</span>
          </button>

          <button
            onClick={handleApplyFilter}
            className="rounded-sm bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            disabled={loading}
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
