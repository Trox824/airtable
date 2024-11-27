"use client";
import React from "react";
import { DataTable } from "~/app/_components/home/Table/DataTable";
import { useParams } from "next/navigation";
interface PageProps {
  params: Promise<{
    baseId: string;
    tableId: string;
  }>;
}
export default function TablePage({ params }: PageProps) {
  const { baseId, tableId } = useParams();
  return (
    <div>
      <DataTable tableId={tableId as string} />
    </div>
  );
}
