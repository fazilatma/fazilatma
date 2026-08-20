type SellerStarsProps = {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  light?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

export default function SellerStars({
  score,
  size = "md",
  showLabel = true,
  light = false,
  className = "",
}: SellerStarsProps) {
  const scoreOutOfFive = Math.max(0, Math.min(5, score / 20));
  const roundedStars = Math.round(scoreOutOfFive);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`} aria-label={`امتیاز فروشنده ${scoreOutOfFive.toFixed(1)} از ۵`}>
      <span className={`tracking-tight text-amber-400 ${sizeClasses[size]}`} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (index < roundedStars ? "★" : "☆")).join("")}
      </span>
      {showLabel && (
        <span className={`font-bold ${light ? "text-white" : "text-[#003b5c]"}`}>
          {scoreOutOfFive.toLocaleString("fa-IR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          <span className={`mr-0.5 text-xs font-normal ${light ? "text-blue-100" : "text-gray-500"}`}>از ۵</span>
        </span>
      )}
    </div>
  );
}
