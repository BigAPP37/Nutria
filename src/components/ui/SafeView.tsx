import React from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";

interface SafeViewProps extends ViewProps {
  includeBottom?: boolean;
}

export function SafeView({
  includeBottom = true,
  className,
  style,
  ...props
}: SafeViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn("flex-1 bg-neutral-50", className)}
      style={[
        {
          paddingTop: insets.top,
          paddingBottom: includeBottom ? insets.bottom : 0,
        },
        style,
      ]}
      {...props}
    />
  );
}
