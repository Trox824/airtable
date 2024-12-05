import React from "react";
import { BaseCard } from "./BaseCard";
import { BaseType } from "~/app/Types/types";

export interface BaseGridProps {
  bases: BaseType[];
  isLoading: boolean;
  isOptimisticBase: (baseId: string) => boolean; // Changed to a function
  onCreateBase: (name: string) => Promise<void>;
  onDeleteBase: (baseId: string) => void;
  creatingBases: string[];
}
const LoadingSkeletonCard = () => (
  <div className="mt-1 h-24 rounded-md border bg-white p-4">
    <div className="flex h-full w-full animate-pulse items-center">
      <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-lg bg-gray-200"></div>
      <div className="flex flex-col space-y-2">
        <div className="h-3.5 w-32 rounded bg-gray-200"></div>
        <div className="h-3 w-16 rounded bg-gray-200"></div>
      </div>
    </div>
  </div>
);
export const BaseGrid: React.FC<
  BaseGridProps & {
    isCreatingBase: boolean;
    pendingCreations: string[];
  }
> = ({
  bases,
  isLoading,
  pendingCreations,
  isOptimisticBase,
  isCreatingBase,
  onCreateBase,
  onDeleteBase,
}) => {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading ? (
        Array(3)
          .fill(0)
          .map((_, i) => <LoadingSkeletonCard key={i} />)
      ) : (
        <>
          {bases?.map((base) => (
            <BaseCard
              key={base.id}
              base={base}
              isOptimisticBase={isOptimisticBase(base.id)}
              onDelete={onDeleteBase}
            />
          ))}

          {pendingCreations.map((id) => (
            <LoadingSkeletonCard key={id} />
          ))}

          {!isLoading && (
            <div className="mt-1 h-24">
              <button
                onClick={() => void onCreateBase("Untitled Base")}
                className="shadow-at-main-nav hover:shadow-at-main-nav-hover flex h-full w-full items-center justify-center rounded-md border bg-white"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-400"
                >
                  <path
                    d="M12 4v16m8-8H4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
