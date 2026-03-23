// src/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Home, PlusCircle, BarChart3 } from "lucide-react-native";
import { colors } from "@/lib/constants";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.primary[600],
      tabBarInactiveTintColor: colors.neutral[400],
      tabBarStyle: { backgroundColor: colors.neutral[50], borderTopColor: colors.neutral[200] },
      headerShown: false,
    }}>
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="log" options={{ title: "Registrar", tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} /> }} />
      <Tabs.Screen name="stats" options={{ title: "Progreso", tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} /> }} />
    </Tabs>
  );
}
