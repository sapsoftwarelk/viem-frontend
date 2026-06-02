import { ReactNode } from "react";

type BadgeVariant = "blue" | "green" | "amber" | "red" | "gray" | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

export default function Badge({ variant = "gray", children }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>{children}</span>
  );
}
