import React, { type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary-500 active:bg-primary-600",
  secondary: "bg-neutral-900 active:bg-neutral-800",
  ghost: "bg-transparent active:bg-neutral-100",
  outline: "border border-neutral-300 bg-white active:bg-neutral-100",
};

const textStyles: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  ghost: "text-neutral-700",
  outline: "text-neutral-800",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-3 rounded-2xl",
  md: "px-5 py-4 rounded-[22px]",
  lg: "px-6 py-[18px] rounded-[26px]",
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  fullWidth = true,
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center gap-2",
        "shadow-sm shadow-black/5",
        isDisabled && "opacity-50",
        fullWidth && "w-full",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "ghost" || variant === "outline" ? "#181613" : "white"} />
      ) : null}
      {typeof children === "string" ? (
        <Text className={cn("text-base font-semibold", textStyles[variant])}>{children}</Text>
      ) : children ? (
        children
      ) : label ? (
        <Text className={cn("text-base font-semibold", textStyles[variant])}>{label}</Text>
      ) : null}
    </Pressable>
  );
}
