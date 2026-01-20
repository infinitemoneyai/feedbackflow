export default function DashboardPageLoading() {
  return (
    <div className="flex h-screen bg-stone-100">
      {/* Left sidebar skeleton */}
      <aside className="hidden w-64 flex-col border-r-2 border-retro-black bg-stone-50 lg:flex">
        {/* Brand skeleton */}
        <div className="border-b-2 border-retro-black bg-retro-yellow p-4">
          <div className="h-6 w-32 animate-pulse rounded bg-retro-black/20"></div>
        </div>

        {/* Team selector skeleton */}
        <div className="border-b border-stone-200 p-4">
          <div className="h-10 w-full animate-pulse rounded border-2 border-stone-200 bg-white"></div>
        </div>

        {/* Projects skeleton */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 h-4 w-16 animate-pulse rounded bg-stone-200"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded border-2 border-stone-200 bg-white"
              ></div>
            ))}
          </div>

          <div className="mb-4 mt-6 h-4 w-12 animate-pulse rounded bg-stone-200"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-full animate-pulse rounded bg-stone-100"
              ></div>
            ))}
          </div>
        </div>

        {/* User skeleton */}
        <div className="border-t-2 border-retro-black bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-stone-200"></div>
            <div className="h-4 w-24 animate-pulse rounded bg-stone-200"></div>
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex flex-1 flex-col">
        {/* Header skeleton */}
        <header className="flex h-16 items-center justify-between border-b-2 border-retro-black bg-white px-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 animate-pulse rounded bg-stone-200"></div>
            <div className="h-5 w-16 animate-pulse rounded bg-stone-100"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-48 animate-pulse rounded-full bg-stone-100"></div>
            <div className="h-9 w-9 animate-pulse rounded bg-stone-100"></div>
            <div className="h-9 w-9 animate-pulse rounded bg-stone-100"></div>
          </div>
        </header>

        {/* Content skeleton */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded border-2 border-stone-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-12 rounded bg-stone-100"></div>
                    <div className="h-5 w-16 rounded bg-stone-100"></div>
                  </div>
                  <div className="h-4 w-24 rounded bg-stone-100"></div>
                </div>
                <div className="mb-2 h-5 w-3/4 rounded bg-stone-200"></div>
                <div className="h-4 w-1/2 rounded bg-stone-100"></div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Right panel skeleton (desktop) */}
      <aside className="hidden w-[400px] flex-col border-l-2 border-retro-black bg-white lg:flex">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-full bg-stone-100"></div>
            <div className="mx-auto h-4 w-48 animate-pulse rounded bg-stone-100"></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
