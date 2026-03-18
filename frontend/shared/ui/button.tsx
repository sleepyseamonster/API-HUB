import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant = "primary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-app-bg border border-accent hover:bg-accent-strong focus-visible:ring-accent",
  ghost:
    "bg-transparent text-app-text border border-transparent hover:bg-panel focus-visible:ring-accent",
  outline:
    "bg-transparent text-app-text border border-app-border hover:border-accent focus-visible:ring-accent",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg disabled:cursor-not-allowed disabled:opacity-60",
        variantMap[variant],
        className,
      )}
      {...props}
    />
  );
}
