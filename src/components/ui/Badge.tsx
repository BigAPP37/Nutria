import React from "react";
import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

type BadgeVariant = "primary" | "secondary" | "neutral" | "warm";

interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary-100",
  secondary: "bg-secondary-100",
  neutral: "bg-neutral-100",
  warm: "bg-warm-100",
};

const textStyles: Record<BadgeVariant, string> = {
  primary: "text-primary-700",
  secondary: "text-secondary-600",
  neutral: "text-neutral-700",
  warm: "text-warm-500",
};

export function Badge({ label, variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <View
      className={cn("self-start rounded-full px-3 py-1.5", badgeStyles[variant], className)}
      {...props}
    >
      <Text className={cn("text-xs font-semibold", textStyles[variant])}>{label}</Text>
    </View>
  );
}
