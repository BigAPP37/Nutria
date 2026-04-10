import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeView } from "@/components/ui/SafeView";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { routes } from "@/types/navigation";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !confirmPassword) {
      setError("Completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError("No pudimos crear la cuenta. Inténtalo otra vez.");
      setIsLoading(false);
      return;
    }

    router.replace(routes.onboarding.welcome);
  }

  return (
    <SafeView className="px-6">
      <View className="flex-1 justify-between pb-8">
        <View className="pt-8">
          <View className="mb-10 gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-[24px] bg-secondary-500">
              <Text className="text-3xl">🌿</Text>
            </View>
            <View className="gap-2">
              <Text className="text-4xl font-bold tracking-tight text-neutral-900">
                Crea tu espacio
              </Text>
              <Text className="max-w-[300px] text-base leading-7 text-neutral-600">
                Configura Nutria en unos pasos y empieza con un sistema más calmado y útil.
              </Text>
            </View>
          </View>

          <Card elevated className="gap-4 p-5">
            <Input
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
            />
            <Input
              label="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
            />
            <Input
              label="Confirmar contraseña"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite tu contraseña"
              error={error}
            />
            <Button onPress={handleRegister} isLoading={isLoading}>
              Crear cuenta
            </Button>
          </Card>
        </View>

        <View className="items-center gap-3">
          <Text className="text-sm text-neutral-500">
            ¿Ya tienes cuenta?
          </Text>
          <Link href={routes.auth.login} asChild>
            <Button variant="ghost" size="sm" fullWidth={false}>
              Iniciar sesión
            </Button>
          </Link>
        </View>
      </View>
    </SafeView>
  );
}
