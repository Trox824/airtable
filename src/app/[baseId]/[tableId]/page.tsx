"use client";
import React from "react";
import { DataTable } from "~/app/_components/home/Table/DataTable";
import { Navbar } from "~/app/_components/home/navbar";
import { TableTabs } from "~/app/_components/home/TableTabs";
import ToolBar from "~/app/_components/home/toolBar";
import { api } from "~/trpc/react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TableTabsSkeleton } from "~/app/loading/tableTabsSkeleton";
import { NavbarSkeleton } from "~/app/loading/NavbarSkeleton";
import { useParams } from "next/navigation";

interface PageProps {
  params: Promise<{
    baseId: string;
    tableId: string;
  }>;
}

export default function TablePage({ params }: PageProps) {
  const { baseId, tableId } = useParams();

  if (!baseId || !tableId) {
    notFound();
  }
  return (
    <>
      <Suspense fallback={<TableTabsSkeleton />}>
        <TableTabs
          baseId={baseId as string}
          currentTableId={tableId as string}
        />
      </Suspense>
      <ToolBar />
      <DataTable tableId={tableId as string} />
    </>
  );
}
