import React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ className, elevated = false, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-[28px] border border-neutral-200 bg-white",
        elevated && "shadow-lg shadow-black/5",
        className
      )}
      {...props}
    />
  );
}
