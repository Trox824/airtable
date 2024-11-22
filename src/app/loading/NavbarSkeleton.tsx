export function NavbarSkeleton() {
  return (
    <header className="left-0 right-0 top-0 flex h-14 flex-col bg-teal-500 pl-5 pr-4 text-white">
      <div className="flex flex-1">
        {/* Left section */}
        <div className="flex h-full flex-row items-center">
          <div className="mr-4 h-6 w-6 animate-pulse rounded-full bg-white/20" />
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/20" />
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center px-4">
          <div className="flex h-auto flex-row">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="mr-2 h-7 w-24 animate-pulse rounded-full bg-white/20"
              />
            ))}
          </div>
          <div className="mr-3 h-5 border-l-[0.8px] border-white/10" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-white/20" />
        </nav>

        {/* Right section */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="h-7 w-7 animate-pulse rounded-full bg-white/20" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-white/20" />
          <div className="h-7 w-7 animate-pulse rounded-full bg-white/20" />
          <div className="h-7 w-7 animate-pulse rounded-full bg-white/20" />
        </div>
      </div>
    </header>
  );
}
