import { Skeleton } from '@/components/ui/Skeleton';

export default function GamesLoading() {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8 space-y-4">
        <Skeleton variant="text" width="240px" height={36} />
        <Skeleton variant="text" width="100%" height={48} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-xl overflow-hidden">
            <div className="p-6 flex flex-col items-center gap-4">
              <Skeleton variant="circle" size={56} />
              <div className="space-y-2 w-full text-center">
                <Skeleton variant="text" width="70%" height={20} className="mx-auto" />
                <Skeleton variant="text" width="90%" height={14} className="mx-auto" />
                <Skeleton variant="text" width="40%" height={14} className="mx-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
