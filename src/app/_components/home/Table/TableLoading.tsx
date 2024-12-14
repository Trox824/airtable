interface TableStateProps {
  loadingMessage?: string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export const TableLoadingState = ({
  loadingMessage = "Inserting data...",
  emptyMessage,
  isLoading = true,
}: TableStateProps) => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      {isLoading ? (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <div className="text-lg font-medium text-gray-600">
            {loadingMessage}
          </div>
        </>
      ) : (
        <div className="text-lg font-medium text-gray-600">{emptyMessage}</div>
      )}
    </div>
  </div>
);
