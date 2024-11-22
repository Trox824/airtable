import React from "react";
import { Navbar } from "~/app/_components/home/navbar";
import { TableTabs } from "~/app/_components/home/TableTabs";

interface PageProps {
  params: Promise<{
    tableId: string;
  }>;
}

export default function TablePage({ params }: PageProps) {
  return (
    <div>
      <Navbar />
      <TableTabs />
    </div>
  );
}
