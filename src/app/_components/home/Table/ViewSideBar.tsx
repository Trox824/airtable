import { Search, Grid2x2Plus } from "lucide-react";
import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ViewSideBar = ({
  baseId,
  tableId,
  viewId,
}: {
  baseId: string;
  tableId: string;
  viewId: string;
}) => {
  const router = useRouter();

  const {
    data: views,
    isLoading,
    refetch,
  } = api.view.getAll.useQuery({
    tableId,
  });

  const [optimisticViews, setOptimisticViews] = useState(() => views ?? []);

  // Update optimisticViews when views data changes
  useEffect(() => {
    if (views) {
      setOptimisticViews(views);
    }
  }, [views]);

  const createViewMutation = api.view.create.useMutation({
    onMutate: async (newView) => {
      const previousViews = views ?? [];
      setOptimisticViews((old) => [
        ...old,
        {
          id: "temp-id",
          name: newView.name,
          tableId: newView.tableId,
          createdAt: new Date(), // Default value
          updatedAt: new Date(), // Default value
        },
      ]);

      // Return a context object with the snapshotted value
      return { previousViews };
    },
    onError: (err, newView, context) => {
      // Rollback to the previous value if context is available
      if (context?.previousViews) {
        setOptimisticViews(context.previousViews);
      }
    },
  });

  const handleCreateView = () => {
    createViewMutation.mutate({
      tableId,
      name: "New View",
    });
  };

  return (
    <div className="relative flex h-[calc(100vh-theme(spacing.navbar)-2rem-theme(spacing.toolbar))] w-full flex-col border-r border-gray-200 bg-white text-xs">
      {/* Search Section */}
      <div className="px-4 py-2">
        <div className="mb-4 flex items-center gap-x-2 border-b border-gray-200">
          <Search size={16} />
          <input
            placeholder="Find a view"
            className="w-full py-3 outline-none focus:outline-none"
          />
        </div>
      </div>

      {/* Views List Section */}
      <div className="flex-grow overflow-auto px-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          optimisticViews.map((view) => (
            <div
              key={view.id}
              className={`flex cursor-pointer items-center gap-x-2 rounded-sm p-2 ${
                view.id === viewId
                  ? "bg-[rgba(196,236,255,0.7)] text-black hover:bg-[rgba(196,236,255,0.9)]"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => router.push(`/${baseId}/${tableId}/${view.id}`)}
            >
              <Grid2x2Plus
                size={16}
                stroke={view.id === viewId ? "white" : "blue"}
              />
              <div className="flex-grow">{view.name}</div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Button Section */}
      <div className="border-t bg-white px-4 py-2">
        <button
          onClick={handleCreateView}
          className="flex w-full items-center gap-x-2 rounded-sm bg-blue-500 p-2 text-white active:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-500"
        >
          <Grid2x2Plus size={16} />
          <div>Create a new grid view</div>
        </button>
      </div>
    </div>
  );
};

export default ViewSideBar;
