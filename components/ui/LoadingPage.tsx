import { cn } from "@/lib/utils";

const LoadingPage = ({className} : {className?: string}) => {
  return (
    <div className={cn(`h-screen`,className)}>
      <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center h-full`}>
        <img
          src="/gif/loading-animation.gif"
          alt="loading"
        />
      </div>
    </div>
  );
};

export default LoadingPage;
