import React from "react";
import { ActivityIndicator, View } from "react-native";

interface SpinnerProps {
  fullScreen?: boolean;
}

export function Spinner({ fullScreen = false }: SpinnerProps) {
  return (
    <View className={fullScreen ? "flex-1 items-center justify-center bg-neutral-50" : "items-center justify-center"}>
      <ActivityIndicator size="large" color="#F26A21" />
    </View>
  );
}
