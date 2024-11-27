import { Navbar } from "~/app/_components/home/navbar";
import { TableTabs } from "~/app/_components/home/TableTabs";
import { TableLoadingState } from "~/app/_components/home/Table/TableLoadingState";

export default function LoadingPage({
  params: { baseId, tableId },
}: {
  params: { baseId: string; tableId: string };
}) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar BaseId={baseId} />
      <TableTabs baseId={baseId} tableId={tableId} />
      <TableLoadingState />
    </div>
  );
}
