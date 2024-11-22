export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex items-center space-x-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        <span className="text-lg text-gray-700">Loading your base...</span>
      </div>
    </div>
  );
}
