import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { api } from "~/trpc/react";
import { BaseGrid } from "./BaseGrid";
import { useBaseOperations } from "~/app/hooks/useBaseOperations";
import HomePageNavbar from "./HomePageNavbar";
import { Sidebar } from "./sidebar";
import { ActionCards } from "./action-cards";

const HomePage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const {
    isOptimisticBase,
    handleCreateBase,
    deleteBase,
    isCreatingBase,
    pendingCreations,
  } = useBaseOperations();

  const {
    isLoading: apiLoading,
    error,
    data: bases,
  } = api.base.getAll.useQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="absolute h-full w-full overflow-hidden bg-[#F9FAFB]">
      <HomePageNavbar onLogout={handleLogout} />
      <div className="z-10 flex h-[calc(100%-48px)] flex-row">
        <Sidebar />
        <div className="flex-1 px-4 pt-8 sm:px-8 lg:px-12">
          <h1 className="font-main-content-sans text-at-half-black pb-6 text-[27px] font-[675] leading-[1.26]">
            Home
          </h1>
          <ActionCards />
          <div className="my-10 border-t">
            {/* Content can be added here if needed */}
          </div>
          <BaseGrid
            bases={bases ?? []}
            isLoading={apiLoading}
            isCreatingBase={isCreatingBase}
            pendingCreations={pendingCreations}
            creatingBases={pendingCreations}
            isOptimisticBase={isOptimisticBase}
            onCreateBase={handleCreateBase}
            onDeleteBase={(baseId) => deleteBase({ id: baseId })}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
