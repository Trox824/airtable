import Link from "next/link";
import React from "react";
import { BaseType } from "~/app/Types/types";
interface BaseCardProps {
  base: BaseType;
  onDelete: () => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({ base, onDelete }) => {
  return (
    <div className={`group relative`}>
      <Link
        href={`/${base.id}/${base.tables?.[0]?.id}/${base.tables?.[0]?.views?.[0]?.id ?? ""}`}
      >
        <div
          className={`shadow-at-main-nav hover:shadow-at-main-nav-hover mt-1 h-24 rounded-md border bg-white p-4`}
        >
          <div className="flex h-full w-full items-center">
            <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-500">
              <svg width="24" height="24" viewBox="0 0 16 16">
                <use
                  fill="currentColor"
                  href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#RocketLaunch"
                />
              </svg>
            </div>
            <div className="">
              <p className="text-[13px] font-medium">{base.name}</p>
              <p className="mt-2 text-[11px] text-[#666]">Base</p>
            </div>
          </div>
        </div>
      </Link>
      <button
        className="absolute right-0 top-1/2 mr-2 flex h-8 w-10 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-black/5 opacity-0 transition-all duration-200 hover:bg-red-500 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          className="text-black/40 transition-colors duration-200 hover:text-white"
        >
          <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};
