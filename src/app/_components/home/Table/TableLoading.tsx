export const TableLoadingState = ({
  loadingMessage,
}: {
  loadingMessage: string;
}) => (
  <div className="skeleton-loader">
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
        <div className="text-lg font-medium text-gray-600">
          {loadingMessage}
        </div>
      </div>
    </div>
  </div>
);
