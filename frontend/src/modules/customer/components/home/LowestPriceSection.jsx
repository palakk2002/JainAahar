import React from "react";
import { ChevronRight, ShoppingBag, Flame, Sparkles, TrendingUp } from "lucide-react";
import ProductCard from "../shared/ProductCard";

const LowestPriceSection = ({
  title = "Today's Deals",
  icon: Icon = ShoppingBag,
  iconBg = "bg-orange-50",
  iconColor = "text-[#FF8200]",
  hasTimer = true,
  products,
  onSeeAll,
}) => {
  const [timeLeft, setTimeLeft] = React.useState("00 : 00 : 00");

  React.useEffect(() => {
    if (!hasTimer) return;
    const updateTimer = () => {
      const now = new Date().getTime();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now;
      if (diff <= 0) {
        setTimeLeft("00 : 00 : 00");
        return;
      }
      const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
      const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
      setTimeLeft(`${hrs} : ${mins} : ${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [hasTimer]);

  if (!products || products.length === 0) return null;

  return (
    <div className="mb-4 md:mb-6">
      <div className="relative overflow-hidden bg-white pt-5 pb-2 md:pt-10 md:pb-4 border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-8 lg:px-[50px] relative z-10">
          <div className="flex justify-between items-center mb-5 md:mb-8 px-1">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center ${iconColor} shrink-0`}>
                <Icon size={14} className="fill-current" />
              </div>
              <h3 className="text-sm md:text-base font-black text-[#1A1A1A] tracking-tight leading-none">
                {title}
              </h3>
              {hasTimer && (
                <div className="bg-[#FFF7F0] text-slate-800 text-[10px] md:text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center justify-center tracking-wide leading-none border border-orange-50/50 select-none ml-1.5 tabular-nums">
                  {timeLeft}
                </div>
              )}
            </div>
            <button
              onClick={onSeeAll}
              className="flex items-center gap-0.5 text-[#FF8200] hover:text-orange-600 font-bold text-xs md:text-sm transition-colors whitespace-nowrap cursor-pointer">
              See All
              <ChevronRight size={13} strokeWidth={3} />
            </button>
          </div>
          <div className="relative z-10 flex overflow-x-auto gap-3 md:gap-6 pb-4 md:pb-6 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth scroll-pl-4 md:scroll-pl-0 after:content-[''] after:w-1 after:shrink-0">
            {products.slice(0, 12).map((product) => (
              <div key={product.id || product._id} className="w-[126px] sm:w-[136px] md:w-[148px] shrink-0 snap-start smooth-transform">
                <ProductCard
                  product={product}
                  className="bg-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] md:shadow-[0_15px_30px_rgba(0,0,0,0.05)] border-brand-50/50 md:border-slate-100 transition-all"
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LowestPriceSection);
