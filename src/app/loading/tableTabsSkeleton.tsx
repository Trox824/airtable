export function TableTabsSkeleton() {
  return (
    <div className="relative h-8 bg-teal-500 text-white">
      <div className="flex h-8 flex-row justify-between">
        <div className="flex w-full flex-row items-center rounded-tr-lg bg-white">
          {/* Active tab skeleton */}
          <div className="h-full w-3 bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"></div>

          {/* Tab skeletons */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-full bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"
            >
              <div className="relative flex h-full items-center px-3">
                <div className="h-4 w-24 animate-pulse rounded bg-white/20"></div>
              </div>
            </div>
          ))}

          {/* Remaining space */}
          <div className="h-full flex-grow rounded-tr-lg bg-teal-500 [background:linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.1)),rgb(20,184,166)]"></div>
        </div>

        {/* Right side skeleton */}
        <div className="flex flex-row">
          <div className="pointer flex h-8 items-center rounded-tl-[8px] bg-black/10 px-4">
            <div className="h-4 w-16 animate-pulse rounded bg-white/20"></div>
          </div>
          <div className="pointer flex h-8 items-center bg-black/10 px-4">
            <div className="h-4 w-12 animate-pulse rounded bg-white/20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
