import Link from "next/link";

export function TableTabs() {
  return (
    <div className="relative h-8 bg-teal-500 text-white">
      <div className="flex h-8 flex-row justify-between">
        {/* Left side content */}
        <div className="flex w-full flex-row items-center rounded-tr-lg bg-white">
          {/* Active tab */}
          <div className="h-full w-3 rounded-br-sm bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"></div>

          <div className="h-full bg-teal-500">
            <div className="relative flex h-full items-center rounded-t-sm bg-white px-3">
              <span className="text-[13px] font-medium text-gray-900">
                Table 1
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                className="ml-2 fill-black"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 6l4 4 4-4H4z" />
              </svg>
            </div>
          </div>

          {/* Search all tables button */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Search all tables"
            className="pointer focus-visible-opaque focus-container flex h-full flex-none items-center justify-center rounded-bl-sm bg-teal-500 px-1.5 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="parent-focus-visible-current-color flex-none"
              style={{ shapeRendering: "geometricPrecision" }}
            >
              <path d="M4 6l4 4 4-4H4z" fill="currentColor" />
            </svg>
          </div>

          {/* Add or import button - moved next to Table 1 */}
          <div className="h-5"></div>
          <div className="flex h-full items-center bg-teal-500 px-2 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]">
            <span className="flex cursor-pointer flex-row items-center">
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                className="mr-1 stroke-white"
                xmlns="http://www.w3.org/2000/svg"
                strokeWidth="2"
                fill="none"
              >
                <path d="M8 1v14M1 8h14" />
              </svg>
              <p className="text-[13px] font-normal">Add or import</p>
            </span>
          </div>
          {/* New div to take up remaining space */}
          <div className="h-full flex-grow rounded-tr-[8px] bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"></div>
        </div>
        <div className="w-2"></div>
        {/* Right side content */}
        <div className="flex flex-row">
          <div className="pointer flex h-8 items-center rounded-tl-[8px] bg-black/10 px-4">
            <div className="flex items-center">
              <div className="text-[13px] font-normal">Extensions</div>
            </div>
          </div>
          <div className="pointer flex h-8 items-center bg-black/10 px-4">
            <div className="flex items-center">
              <div className="text-[13px] font-normal">Tools</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
