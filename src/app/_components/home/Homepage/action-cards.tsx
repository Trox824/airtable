import React from "react";
import Link from "next/link";
export const ActionCards: React.FC = () => {
  return (
    <div className="mb-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Start with AI Card */}
      <Link href="">
        <div className="h-full rounded-md border border-black/10 bg-white p-4">
          <div className="flex flex-row">
            <div className="flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                className="icon flex-none"
              >
                <use
                  fill="rgb(221, 4, 168)"
                  href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#AiFeature"
                />
              </svg>
            </div>
            <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
              Start with AI
            </h2>
          </div>
          <p className="mt-1">
            Turn process into an app with data and interfaces using AI.
          </p>
        </div>
      </Link>

      {/* Templates Card */}
      <Link href="">
        <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md border bg-white p-4">
          <div className="flex flex-row">
            <div className="flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                className="undefined flex"
              >
                <use
                  fill="rgb(99, 73, 141)"
                  href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#GridFour"
                />
              </svg>
            </div>
            <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
              Start with templates
            </h2>
          </div>
          <p className="mt-1">
            Select a template to get started and customize as you go.
          </p>
        </div>
      </Link>

      {/* Upload Card */}
      <Link href="">
        <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md border bg-white p-4">
          <div className="flex flex-row">
            <div className="flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                className="icon flex-none"
              >
                <use
                  fill="rgb(13, 127, 120)"
                  href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#ArrowUp"
                />
              </svg>
            </div>
            <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
              Quickly upload
            </h2>
          </div>
          <p className="mt-1">
            Easily migrate your existing projects in just a few minutes.
          </p>
        </div>
      </Link>

      {/* Start from scratch Card */}
      <Link href="">
        <div className="shadow-at-main-nav hover:shadow-at-main-nav-hover h-full rounded-md border bg-white p-4">
          <div className="flex flex-row">
            <div className="flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                className="icon flex-none"
              >
                <use
                  fill="rgb(59, 102, 163)"
                  href="/icons/icon_definitions.svg?v=4ff0794f56fc1e06fa1e614b25254a46#Table"
                />
              </svg>
            </div>
            <h2 className="text-at-half-black ml-2 text-[15px] font-semibold">
              Start from scratch
            </h2>
          </div>
          <p className="mt-1">
            Create a new blank base with custom tables, fields, and views.
          </p>
        </div>
      </Link>
    </div>
  );
};
