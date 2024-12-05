import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { api, RouterOutputs } from "~/trpc/react";
import { BaseType } from "../Types/types";

// Define the types for responses and optimistic operations
type BaseResponse = RouterOutputs["base"]["getAll"][number];
type OptimisticBase = BaseResponse & {
  isOptimistic?: boolean;
  status?: "creating" | "deleting" | "updating";
};

interface OptimisticOperation {
  type: "create" | "delete" | "update";
  timestamp: number;
}

export const useBaseOperations = () => {
  // Track all optimistic operations using a Map for better performance
  const [optimisticOperations, setOptimisticOperations] = useState<
    Map<string, OptimisticOperation>
  >(new Map());

  // Track pending base creations
  const [pendingCreations, setPendingCreations] = useState<Set<string>>(
    new Set(),
  );

  const queryClient = useQueryClient();
  const router = useRouter();

  // Helper function to check if a base is in any optimistic state
  const isOptimisticBase = (baseId: string): boolean => {
    return optimisticOperations.has(baseId);
  };

  // Mutation for creating a base with optimistic updates
  const createBase = api.base.create.useMutation({
    onMutate: async (newBase) => {
      // Cancel any outgoing refetches to prevent conflicts
      await queryClient.cancelQueries({ queryKey: ["base.getAll"] });

      // Snapshot the previous state
      const previousBases = queryClient.getQueryData<BaseResponse[]>([
        "base.getAll",
      ]);

      // Generate a temporary ID for the optimistic base
      const optimisticId = `temp-${uuidv4()}`;

      // Add to pending creations
      setPendingCreations((prev) => {
        const next = new Set(prev);
        next.add(optimisticId);
        return next;
      });

      const optimisticBase: OptimisticBase = {
        id: optimisticId,
        name: newBase.name,
        userId: "", // Assign appropriately
        createdAt: new Date(),
        updatedAt: new Date(),
        tables: [
          {
            id: `temp-table-${uuidv4()}`,
            name: "Untitled Table",
            baseId: optimisticId,
            createdAt: new Date(),
            updatedAt: new Date(),
            views: [{ id: `temp-view-${uuidv4()}`, name: "Grid view" }],
          },
        ],
        isOptimistic: true,
        status: "creating",
      };

      // Store in localStorage for persistence
      try {
        const existingBases = localStorage.getItem("optimisticBases");
        if (existingBases) {
          // Explicitly type the parsed bases
          const bases: Record<string, OptimisticBase> = JSON.parse(
            existingBases,
          ) as Record<string, OptimisticBase>;
          bases[optimisticId] = optimisticBase;
          localStorage.setItem("optimisticBases", JSON.stringify(bases));
        }
      } catch (error) {
        console.error("Failed to store optimistic base:", error);
      }

      // Add the optimistic operation to the Map
      setOptimisticOperations((prev) => {
        const next = new Map(prev);
        next.set(optimisticId, { type: "create", timestamp: Date.now() });
        return next;
      });

      // Update the cache with the optimistic base
      queryClient.setQueryData<OptimisticBase[]>(["base.getAll"], (old) => {
        if (!old) return [optimisticBase];
        return [...old, optimisticBase];
      });

      // Return context with previous data and optimistic ID
      return { previousBases, optimisticId };
    },
    onSuccess: (createdBase, _, context) => {
      if (!createdBase || !context) return;

      // Remove from pending creations
      setPendingCreations((prev) => {
        const next = new Set(prev);
        next.delete(context.optimisticId);
        return next;
      });

      // Clean up localStorage
      try {
        const existingBases = localStorage.getItem("optimisticBases");
        if (existingBases) {
          const bases: Record<string, OptimisticBase> = JSON.parse(
            existingBases,
          ) as Record<string, OptimisticBase>;
          delete bases[context.optimisticId];
          localStorage.setItem("optimisticBases", JSON.stringify(bases));
        }
      } catch (error) {
        console.error("Failed to clean up optimistic base:", error);
      }

      // Replace the optimistic base with the actual base from the server
      queryClient.setQueryData<OptimisticBase[]>(["base.getAll"], (old) => {
        if (!old) return [createdBase as unknown as OptimisticBase];
        return old.map((base) => {
          return {
            ...base,
            createdAt: new Date(),
            updatedAt: new Date(),
            baseId: base.id,
          };
        });
      });

      // Remove the optimistic operation from the Map
      setOptimisticOperations((prev) => {
        const next = new Map(prev);
        next.delete(context.optimisticId);
        return next;
      });

      // Navigate to the newly created base
      router.push(
        `/${createdBase.id}/${createdBase.firstTableId}/${createdBase.firstViewId}`,
      );
    },
    onError: (_, __, context) => {
      if (context?.previousBases) {
        // Revert to the previous state in case of an error
        queryClient.setQueryData(["base.getAll"], context.previousBases);
      }
      if (context?.optimisticId) {
        // Remove from pending creations on error
        setPendingCreations((prev) => {
          const next = new Set(prev);
          next.delete(context.optimisticId);
          return next;
        });

        // Clean up localStorage
        try {
          const existingBases = localStorage.getItem("optimisticBases");
          if (existingBases) {
            // Explicitly type the parsed bases
            const bases: Record<string, OptimisticBase> = JSON.parse(
              existingBases,
            ) as Record<string, OptimisticBase>;
            delete bases[context.optimisticId];
            localStorage.setItem("optimisticBases", JSON.stringify(bases));
          }
        } catch (error) {
          console.error("Failed to clean up optimistic base:", error);
        }

        // Remove the optimistic operation from the Map
        setOptimisticOperations((prev) => {
          const next = new Map(prev);
          next.delete(context.optimisticId);
          return next;
        });
      }
    },
  });

  // Mutation for deleting a base with optimistic updates
  const deleteBase = api.base.delete.useMutation({
    onMutate: async (deletedBase) => {
      // Cancel any outgoing refetches to prevent conflicts
      await queryClient.cancelQueries({ queryKey: ["base.getAll"] });

      // Snapshot the previous state
      const previousBases = queryClient.getQueryData<BaseResponse[]>([
        "base.getAll",
      ]);

      // Add the optimistic delete operation to the Map
      setOptimisticOperations((prev) => {
        const next = new Map(prev);
        next.set(deletedBase.id, { type: "delete", timestamp: Date.now() });
        return next;
      });

      // Mark the base as deleting in the cache
      queryClient.setQueryData<OptimisticBase[]>(["base.getAll"], (old) => {
        if (!old) return [];
        return old.map((base) =>
          base.id === deletedBase.id
            ? { ...base, status: "deleting" as const }
            : base,
        );
      });

      // Return context with previous data and deleted ID
      return { previousBases, deletedId: deletedBase.id };
    },
    onSuccess: (_, __, context) => {
      if (!context) return;

      // Remove the base from the cache
      queryClient.setQueryData<OptimisticBase[]>(["base.getAll"], (old) => {
        if (!old) return [];
        return old.filter((base) => base.id !== context.deletedId);
      });

      // Remove the optimistic operation from the Map
      setOptimisticOperations((prev) => {
        const next = new Map(prev);
        next.delete(context.deletedId);
        return next;
      });
    },
    onError: (_, __, context) => {
      if (context?.previousBases) {
        // Revert to the previous state in case of an error
        queryClient.setQueryData(["base.getAll"], context.previousBases);
      }
      if (context?.deletedId) {
        // Remove the optimistic operation from the Map
        setOptimisticOperations((prev) => {
          const next = new Map(prev);
          next.delete(context.deletedId);
          return next;
        });
      }
    },
  });

  return {
    isOptimisticBase,
    optimisticOperations,
    isCreatingBase: pendingCreations.size > 0,
    pendingCreations: Array.from(pendingCreations),
    handleCreateBase: async (baseName: string) => {
      await createBase.mutateAsync({ name: baseName });
    },
    deleteBase: deleteBase.mutate,
  };
};
