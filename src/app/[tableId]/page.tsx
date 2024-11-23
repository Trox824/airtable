import React from "react";
import { Navbar } from "~/app/_components/home/navbar";
import { TableTabs } from "~/app/_components/home/TableTabs";
import { api } from "~/trpc/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loading from "~/app/loading/page";
import { TableTabsSkeleton } from "~/app/loading/tableTabsSkeleton";
import { NavbarSkeleton } from "~/app/loading/NavbarSkeleton";
import { DataTable } from "~/app/_components/home/DataTable";
import { columns } from "tailwindcss/defaultTheme";
import Toolbar from "~/app/_components/home/toolBar";
interface PageProps {
  params: Promise<{
    tableId: string;
  }>;
}

// Split the content into smaller suspense boundaries
async function NavbarContent({ tableId }: { tableId: string }) {
  const bases = await api.base.getAll();
  const currentBase = bases.find((base) => base.id === tableId);

  if (!currentBase) {
    notFound();
  }

  return <Navbar currentBase={currentBase} allBases={bases} />;
}

async function TabsContent({ tableId }: { tableId: string }) {
  const tables = await api.tables.getByBaseId({ baseId: tableId });
  const reversedTables = tables.reverse();

  return (
    <TableTabs
      tables={reversedTables}
      currentTableId={reversedTables[0]?.id ?? ""}
      baseId={tableId}
    />
  );
}

export default async function TablePage({ params }: PageProps) {
  const { tableId } = await params;

  if (!tableId) {
    notFound();
  }

  // Sample data - you might want to move this to a separate file later

  return (
    <>
      <Suspense fallback={<NavbarSkeleton />}>
        <NavbarContent tableId={tableId} />
      </Suspense>
      <Suspense fallback={<TableTabsSkeleton />}>
        <TabsContent tableId={tableId} />
      </Suspense>
      <Toolbar />
      <DataTable />
    </>
  );
}
