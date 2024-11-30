"use client";
import React from "react";
import { DataTable } from "~/app/_components/home/Table/DataTable";
import { useParams } from "next/navigation";
import Toolbar from "~/app/_components/home/toolBar";
import { useState } from "react";
interface PageProps {
  params: Promise<{
    baseId: string;
    tableId: string;
  }>;
}
export default function TablePage({ params }: PageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { baseId, tableId } = useParams();
  return (
    <>
      <Toolbar handleSearch={setSearchQuery} />
      <DataTable tableId={tableId as string} searchQuery={searchQuery} />
    </>
  );
}
