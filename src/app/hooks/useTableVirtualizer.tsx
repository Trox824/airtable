import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, type RefObject } from "react";

export function useTableVirtualizer(
  containerRef: RefObject<HTMLDivElement>,
  rowCount: number,
  currentRow: number,
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
      // Get the last visible item
      const lastItem = instance.getVirtualItems().at(-1);

      if (!lastItem) return;
      console.log(lastItem.index);
      console.log(currentRow);
      if (
        lastItem.index >= currentRow - 25 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage();
      }
    },
  });
}
