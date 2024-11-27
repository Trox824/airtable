import React, { Suspense } from "react";
import { Navbar } from "~/app/_components/home/navbar";
import { NavbarSkeleton } from "~/app/loading/NavbarSkeleton";
import { TableTabs } from "~/app/_components/home/TableTabs";
import ToolBar from "~/app/_components/home/toolBar";
import { redirect } from "next/navigation";
import { api } from "~/trpc/react";
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    baseId: string;
    tableId: string;
  }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { baseId, tableId } = await params;

  return (
    <>
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar BaseId={baseId} />
      </Suspense>
      <ToolBar />
      <TableTabs tableId={tableId} baseId={baseId} />
      {children}
    </>
  );
}
