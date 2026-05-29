interface AvatarProps {
  initials: string;
  color?: "blue" | "green" | "amber" | "red" | "purple" | "gray";
  size?: "sm" | "md" | "lg";
}

const colorMap = {
  blue:   "bg-viems-blue-light text-viems-blue",
  green:  "bg-viems-green-bg text-viems-green",
  amber:  "bg-viems-amber-bg text-viems-amber",
  red:    "bg-viems-red-bg text-viems-red",
  purple: "bg-purple-100 text-purple-700",
  gray:   "bg-viems-gray-light text-viems-gray",
};

const sizeMap = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-[12px]",
  lg: "w-11 h-11 text-[14px]",
};

export default function Avatar({ initials, color = "blue", size = "sm" }: AvatarProps) {
  return (
    <div className={`${sizeMap[size]} ${colorMap[color]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}
