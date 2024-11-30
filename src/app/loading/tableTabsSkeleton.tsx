export function TableTabsSkeleton() {
  return (
    <div className="fixed left-0 right-0 top-navbar z-40 h-8 bg-teal-500 text-white">
      <div className="flex h-8 flex-row justify-between">
        {/* Left side content */}
        <div className="flex w-full flex-row items-center overflow-scroll rounded-tr-lg bg-white [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Active tab indicator */}
          <div className="h-full w-3 bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"></div>

          {/* Tab skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="-ml-[1px] h-full bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"
            >
              <div className="relative flex h-full items-center p-3">
                <div className="h-4 w-32 animate-pulse rounded bg-white/20"></div>
              </div>
            </div>
          ))}

          {/* Add button skeleton */}
          <div className="relative flex h-full items-center bg-teal-500 px-2 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]">
            <div className="h-4 w-6 animate-pulse rounded bg-white/20"></div>
          </div>

          {/* Remaining space */}
          <div className="h-full flex-grow rounded-tr-lg bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"></div>
        </div>

        <div className="w-2"></div>

        {/* Right side skeleton */}
        <div className="flex flex-row">
          <div className="pointer flex h-8 items-center rounded-tl-[8px] bg-black/10 px-4">
            <div className="h-4 w-20 animate-pulse rounded bg-white/20"></div>
          </div>
          <div className="pointer flex h-8 items-center bg-black/10 px-4">
            <div className="h-4 w-16 animate-pulse rounded bg-white/20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
