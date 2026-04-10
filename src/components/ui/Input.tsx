import React, { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { cn } from "@/lib/cn";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string | null;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, className, ...props },
  ref
) {
  return (
    <View className="w-full gap-2">
      {label ? (
        <Text className="px-1 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-500">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#9F9586"
        className={cn(
          "min-h-[56px] rounded-[22px] border px-4 py-4 text-[15px] text-neutral-900",
          error
            ? "border-warm-400 bg-warm-50"
            : "border-neutral-200 bg-white",
          className
        )}
        {...props}
      />
      {error ? (
        <Text className="px-1 text-sm text-warm-500">{error}</Text>
      ) : hint ? (
        <Text className="px-1 text-sm text-neutral-500">{hint}</Text>
      ) : null}
    </View>
  );
});
