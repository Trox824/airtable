import { api } from "~/trpc/react";
import { type SortCondition, type FilterCondition } from "../Types/types";
import { useMemo, useCallback } from "react";
import { type Prisma, type FilterOperator } from "@prisma/client";
import { type UseInfiniteQueryOptions } from "@tanstack/react-query";

type RowWithCells = Prisma.RowGetPayload<{
  include: {
    cells: {
      include: {
        column: { select: { type: true } };
      };
    };
  };
}>;

type PaginatedResponse = {
  items: RowWithCells[];
  nextCursor?: string;
};

export function useTableQuery(
  tableId: string,
  searchQuery: string,
  sortConditions: SortCondition[],
  filterConditions: FilterCondition[],
) {
  const queryParams = useMemo(
    () => ({
      tableId,
      limit: 100,
      searchQuery,
      sortConditions: sortConditions.map((condition) => ({
        columnId: condition.columnId,
        order:
          condition.order === "0-9" || condition.order === "asc"
            ? ("asc" as const)
            : ("desc" as const),
      })),
      filterConditions: filterConditions.map((condition) => ({
        columnId: condition.columnId,
        operator: condition.operator,
        value: condition.value,
      })),
    }),
    [tableId, searchQuery, sortConditions, filterConditions],
  );

  const getNextPageParam = useCallback((lastPage: PaginatedResponse) => {
    return lastPage.nextCursor;
  }, []);

  const getPreviousPageParam = useCallback((firstPage: PaginatedResponse) => {
    return firstPage.nextCursor;
  }, []);

  const queryOptions = useMemo(
    () =>
      ({
        getNextPageParam,
        getPreviousPageParam,
        refetchOnWindowFocus: false,
        staleTime: 30000,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: false,
        retry: 1,
        refetchInterval: false as const,
        refetchOnReconnect: false,
        queryKey: ["rows", queryParams],
        initialPageParam: undefined,
      }) satisfies UseInfiniteQueryOptions<
        PaginatedResponse,
        PaginatedResponse,
        PaginatedResponse,
        [string, typeof queryParams]
      >,
    [getNextPageParam, getPreviousPageParam],
  );

  return api.rows.getByTableId.useInfiniteQuery(queryParams, queryOptions);
}
