import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, type RefObject } from "react";

export function useTableVirtualizer(
  containerRef: RefObject<HTMLDivElement>,
  rowCount: number,
  currentRow: number,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
) {
  const virtualizer = useVirtualizer<Element, Element>({
    count: rowCount,
    getScrollElement: () => containerRef.current as unknown as Element,
    estimateSize: useCallback(() => 32, []),
    overscan: 20,
    onChange: (instance) => {
      const lastItem = instance.getVirtualItems().at(-1);
      if (!lastItem) return;

      if (
        lastItem.index >= currentRow - 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage();
      }
    },
  });

  // Force recalculation when rowCount changes
  useEffect(() => {
    virtualizer.measure();
  }, [rowCount, virtualizer]);

  return virtualizer;
}
