import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, type RefObject } from "react";

export function useTableVirtualizer(
  containerRef: RefObject<HTMLDivElement>,
  rowCount: number,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
) {
  return useVirtualizer<Element, Element>({
    count: rowCount,
    getScrollElement: () => containerRef.current as unknown as Element,
    estimateSize: useCallback(() => 32, []),
    overscan: 20,
    onChange: (instance) => {
      const virtualItems = instance.getVirtualItems();
      const lastItem = virtualItems[virtualItems.length - 1];
      if (!lastItem) return;

      if (
        lastItem.index >= Math.floor(rowCount * 0.65) &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage();
      }
    },
  });
}
