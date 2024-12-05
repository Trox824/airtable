import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { BaseType } from "~/app/Types/types";
import { useSession } from "next-auth/react";
interface CreateBaseResponse {
  id: string;
  name: string;
  firstTableId: string;
  firstViewId: string;
  tables: {
    name: string;
    views: {
      id: string;
      name: string;
    }[];
  }[];
}

export const useBaseOperations = () => {
  const session = useSession();
  const [pendingCreations, setPendingCreations] = useState<string[]>([]);
  const [deletingBases, setDeletingBases] = useState<string[]>([]);
  const router = useRouter();
  const utils = api.useUtils();
  const deleteBase = api.base.delete.useMutation({
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await utils.base.getAll.cancel();

      // Snapshot the previous value
      const previousBases = utils.base.getAll.getData();

      // Optimistically remove the base from the query cache
      utils.base.getAll.setData(undefined, (old) => {
        if (!old) return [];
        return old.filter((base) => base.id !== id);
      });

      return { previousBases };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context-value from onMutate
      if (context?.previousBases) {
        utils.base.getAll.setData(undefined, context.previousBases);
      }
    },
    onSettled: () => {
      void utils.base.getAll.invalidate();
    },
  });
  const createBase = api.base.create.useMutation({
    onSuccess: (newBase: CreateBaseResponse) => {
      const now = new Date();

      const completeNewBase = {
        id: newBase.id,
        name: newBase.name,
        userId: session.data?.user.id ?? "", // Get from session context
        createdAt: now,
        updatedAt: now,
        tables: newBase.tables.map((table) => ({
          id: newBase.firstTableId,
          name: table.name,
          baseId: newBase.id,
          createdAt: now,
          updatedAt: now,
          views: table.views,
        })),
      };

      utils.base.getAll.setData(undefined, (old) => {
        if (!old) return [completeNewBase];
        return [...old, completeNewBase];
      });
    },
    onSettled: () => {
      void utils.base.getAll.invalidate();
    },
  });

  const handleCreateBase = async (name: string) => {
    const optimisticId = `optimistic-${Date.now()}`;
    setPendingCreations((prev) => [...prev, optimisticId]);

    try {
      const result = await createBase.mutateAsync({
        name,
      });
      router.push(`/${result.id}/${result.firstTableId}/${result.firstViewId}`);
    } finally {
      setPendingCreations((prev) => prev.filter((id) => id !== optimisticId));
    }
  };

  const handleDelete = async (baseId: string) => {
    setDeletingBases((prev) => [...prev, baseId]);
    try {
      await deleteBase.mutateAsync({ id: baseId });
    } catch (error) {
      // Handle error if needed
      console.error("Failed to delete base:", error);
    } finally {
      setDeletingBases((prev) => prev.filter((id) => id !== baseId));
    }
  };

  const isOptimisticBase = (baseId: string) => {
    return pendingCreations.includes(baseId);
  };

  const isDeletingBase = (baseId: string) => {
    return deletingBases.includes(baseId);
  };

  return {
    isOptimisticBase,
    isDeletingBase,
    handleCreateBase,
    handleDelete,
    pendingCreations,
  };
};
