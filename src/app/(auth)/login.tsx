import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeView } from "@/components/ui/SafeView";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { routes } from "@/types/navigation";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("Completa email y contraseña.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("No pudimos iniciar sesión. Revisa tus datos.");
      setIsLoading(false);
      return;
    }

    router.replace(routes.tabs.root);
  }

  return (
    <SafeView className="px-6">
      <View className="flex-1 justify-between pb-8">
        <View className="pt-8">
          <View className="mb-10 gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-[24px] bg-primary-500">
              <Text className="text-3xl">🥕</Text>
            </View>
            <View className="gap-2">
              <Text className="text-4xl font-bold tracking-tight text-neutral-900">
                Vuelve a tu plan
              </Text>
              <Text className="max-w-[300px] text-base leading-7 text-neutral-600">
                Registro claro, feedback útil y una interfaz con menos ruido.
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
              placeholder="••••••••"
              error={error}
            />
            <Button onPress={handleLogin} isLoading={isLoading}>
              Entrar
            </Button>
          </Card>
        </View>

        <View className="items-center gap-3">
          <Text className="text-sm text-neutral-500">
            ¿No tienes cuenta?
          </Text>
          <Link href={routes.auth.register} asChild>
            <Button variant="ghost" size="sm" fullWidth={false}>
              Crear cuenta
            </Button>
          </Link>
        </View>
      </View>
    </SafeView>
  );
}
