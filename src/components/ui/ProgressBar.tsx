import React from "react";
import { View } from "react-native";
import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export function ProgressBar({
  value,
  className,
  indicatorClassName,
}: ProgressBarProps) {
  const progress = Math.max(0, Math.min(100, value));

  return (
    <View className={cn("h-2.5 overflow-hidden rounded-full bg-neutral-200", className)}>
      <View
        className={cn("h-full rounded-full bg-primary-500", indicatorClassName)}
        style={{ width: `${progress}%` }}
      />
    </View>
  );
}
