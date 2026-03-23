// src/components/onboarding/ActivitySelector.tsx
// Selector visual de nivel de actividad: 5 cards verticales.

import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";
import type { ActivityLevel } from "@/stores/onboardingStore";

interface ActivitySelectorProps {
  value: ActivityLevel | null;
  onChange: (level: ActivityLevel) => void;
}

const LEVELS: Array<{
  key: ActivityLevel;
  emoji: string;
  title: string;
  description: string;
}> = [
  {
    key: "sedentary",
    emoji: "🪑",
    title: "Sedentario",
    description: "Trabajo de oficina, poco ejercicio",
  },
  {
    key: "lightly_active",
    emoji: "🚶",
    title: "Ligeramente activo",
    description: "Ejercicio ligero 1-3 días/semana",
  },
  {
    key: "moderately_active",
    emoji: "🏃",
    title: "Moderadamente activo",
    description: "Ejercicio moderado 3-5 días/semana",
  },
  {
    key: "very_active",
    emoji: "🏋️",
    title: "Muy activo",
    description: "Ejercicio intenso 6-7 días/semana",
  },
  {
    key: "extra_active",
    emoji: "⚡",
    title: "Extra activo",
    description: "Trabajo físico o atleta profesional",
  },
];

function ActivityCard({
  level,
  isSelected,
  onPress,
}: {
  level: (typeof LEVELS)[0];
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        accessibilityLabel={`${level.title}: ${level.description}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        className={cn(
          "flex-row items-center px-4 py-3.5 rounded-xl mb-2.5 border-2",
          isSelected
            ? "border-primary-500 bg-primary-50"
            : "border-neutral-200 bg-white"
        )}
      >
        <Text className="text-2xl mr-3">{level.emoji}</Text>
        <View className="flex-1">
          <Text
            className={cn(
              "text-base font-semibold",
              isSelected ? "text-primary-700" : "text-neutral-800"
            )}
          >
            {level.title}
          </Text>
          <Text
            className={cn(
              "text-sm",
              isSelected ? "text-primary-600" : "text-neutral-500"
            )}
          >
            {level.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function ActivitySelector({ value, onChange }: ActivitySelectorProps) {
  return (
    <View>
      {LEVELS.map((level) => (
        <ActivityCard
          key={level.key}
          level={level}
          isSelected={value === level.key}
          onPress={() => onChange(level.key)}
        />
      ))}
    </View>
  );
}
