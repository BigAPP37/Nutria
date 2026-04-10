// src/app/(tabs)/_layout.tsx
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Home, PlusCircle, BarChart3 } from "lucide-react-native";
import { colors } from "@/lib/constants";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          paddingBottom: 2,
        },
        tabBarStyle: {
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderTopColor: colors.neutral[200],
          position: "absolute",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={size} color={color} strokeWidth={focused ? 2.6 : 2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: "Registrar",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                marginTop: -18,
                height: 52,
                width: 52,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused ? colors.primary[600] : colors.primary[500],
                shadowColor: colors.primary[500],
                shadowOpacity: 0.28,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <PlusCircle size={24} color="white" strokeWidth={2.4} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Progreso",
          tabBarIcon: ({ color, size, focused }) => (
            <BarChart3 size={size} color={color} strokeWidth={focused ? 2.6 : 2.2} />
          ),
        }}
      />
    </Tabs>
  );
}
