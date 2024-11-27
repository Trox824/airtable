export function TableLoadingState() {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="animate-pulse p-4">
        {/* Table Header Loading */}
        <div className="mb-4 flex">
          {[...Array<number>(3)].map((_, i) => (
            <div key={i} className="mr-4 h-8 w-32 rounded bg-gray-200" />
          ))}
        </div>

        {/* Table Rows Loading */}
        {[...Array<number>(5)].map((_, rowIndex) => (
          <div key={rowIndex} className="mb-2 flex">
            {[...Array<number>(3)].map((_, cellIndex) => (
              <div
                key={cellIndex}
                className="mr-4 h-10 w-32 rounded bg-gray-100"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
