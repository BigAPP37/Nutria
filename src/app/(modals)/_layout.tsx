// src/app/(modals)/_layout.tsx
import { Stack } from "expo-router";
export default function ModalLayout() {
  return <Stack screenOptions={{ presentation: "modal", headerShown: false, gestureEnabled: true, animation: "slide_from_bottom" }} />;
}
