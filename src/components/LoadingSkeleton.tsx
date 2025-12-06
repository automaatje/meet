export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 p-4 border-b border-gray-100">
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-24 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-gray-200 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 rounded flex-1"></div>
      </div>
    </div>
  );
}

export function ImageSkeleton() {
  return (
    <div className="aspect-video bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
      <div className="w-12 h-12 bg-gray-300 rounded"></div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-32"></div>
    </div>
  );
}

export function ButtonSkeleton() {
  return (
    <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
  );
}
