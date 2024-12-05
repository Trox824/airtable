import { Base } from "@prisma/client";
import { BaseType } from "./types";

// Props for BaseCard component
export interface BaseCardProps {
  base: BaseType;
  isOptimisticBase: boolean; // Changed from string | null to boolean
  onDelete: (baseId: string) => void;
}

// Props for BaseGrid component

export interface NavbarProps {
  onLogout: () => Promise<void>;
}
