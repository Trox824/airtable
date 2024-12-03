import React, { Suspense } from "react";
import { Navbar } from "~/app/_components/home/navbar";
import { NavbarSkeleton } from "~/app/loading/NavbarSkeleton";
import { TableTabs } from "~/app/_components/home/TableTabs";
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    baseId: string;
    tableId: string;
    viewId: string;
  }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { baseId, tableId, viewId } = await params;

  return (
    <>
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar BaseId={baseId} />
      </Suspense>

      {children}
    </>
  );
}
