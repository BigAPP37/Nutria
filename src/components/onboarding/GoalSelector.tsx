// src/components/onboarding/GoalSelector.tsx
// Selector visual de objetivo: 3 cards grandes, una selección.

import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";
import type { UserGoal } from "@/stores/onboardingStore";

interface GoalSelectorProps {
  value: UserGoal | null;
  onChange: (goal: UserGoal) => void;
}

const GOALS: Array<{
  key: UserGoal;
  emoji: string;
  title: string;
  description: string;
}> = [
  {
    key: "lose_weight",
    emoji: "🎯",
    title: "Perder peso",
    description: "Un plan cómodo y sostenible, sin pasar hambre",
  },
  {
    key: "maintain",
    emoji: "⚖️",
    title: "Mantener",
    description: "Come lo que gastas, con consciencia y equilibrio",
  },
  {
    key: "gain_muscle",
    emoji: "💪",
    title: "Ganar músculo",
    description: "Superávit controlado para construir masa muscular",
  },
];

function GoalCard({
  goal,
  isSelected,
  onPress,
}: {
  goal: (typeof GOALS)[0];
  isSelected: boolean;
  onPress: () => void;
}) {
  // Animación de escala al seleccionar
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        accessibilityLabel={`${goal.title}: ${goal.description}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        className={cn(
          "mb-3 flex-row items-center rounded-[26px] border p-5",
          isSelected
            ? "border-primary-500 bg-primary-50"
            : "border-neutral-200 bg-white"
        )}
      >
        <View className={cn(
          "mr-4 h-14 w-14 items-center justify-center rounded-[18px]",
          isSelected ? "bg-white" : "bg-neutral-100"
        )}>
          <Text className="text-3xl">{goal.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text
            className={cn(
              "text-lg font-semibold mb-1",
              isSelected ? "text-primary-700" : "text-neutral-800"
            )}
          >
            {goal.title}
          </Text>
          <Text
            className={cn(
              "text-sm",
              isSelected ? "text-primary-600" : "text-neutral-500"
            )}
          >
            {goal.description}
          </Text>
        </View>
        {isSelected ? <Text className="text-lg text-primary-600">●</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

export function GoalSelector({ value, onChange }: GoalSelectorProps) {
  return (
    <View>
      {GOALS.map((goal) => (
        <GoalCard
          key={goal.key}
          goal={goal}
          isSelected={value === goal.key}
          onPress={() => onChange(goal.key)}
        />
      ))}
    </View>
  );
}
