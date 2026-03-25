const HeaderSkeleton = () => {
  return (
    <header className="sticky top-0 z-40 bg-white transition-all duration-300">
      <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-around h-18 lg:h-20">
          <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>

          <div className="flex items-center gap-3 animate-pulse">
            {/* avatar skeleton */}
            <div className="w-6 h-6 rounded-full bg-gray-300"></div>

            {/* name skeleton */}
            <div className="h-4 w-24 rounded bg-gray-300"></div>

            {/* logout skeleton */}
            <div className="h-4 w-16 rounded bg-gray-300 ml-2"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderSkeleton;
