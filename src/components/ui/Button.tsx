"use client";

import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const base =
    "rounded-lg px-3 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50";
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    default: "bg-white text-[#111123] hover:bg-white/90",
    outline: "border border-white/30 text-white hover:border-white/60",
  };

  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
