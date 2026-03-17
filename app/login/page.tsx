"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleMagicLink() {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (!error) setSent(true);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🥗</span>
          </div>
          <h1 className="text-3xl font-bold text-white">NutriAI</h1>
          <p className="text-gray-400 mt-2 text-sm">Tu nutricionista inteligente</p>
        </div>

        {sent ? (
          <div className="text-center bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <div className="text-3xl mb-3">📧</div>
            <p className="text-white font-medium">Revisa tu email</p>
            <p className="text-gray-400 text-sm mt-1">Te enviamos un enlace mágico a {email}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              className="w-full bg-[#141414] border border-[#2a2a2a] text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-medium hover:bg-[#1e1e1e] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continuar con Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#2a2a2a]" />
              <span className="text-gray-500 text-xs">o con email</span>
              <div className="flex-1 h-px bg-[#2a2a2a]" />
            </div>

            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleMagicLink()}
              className="w-full bg-[#141414] border border-[#2a2a2a] text-white rounded-2xl px-4 py-4 outline-none focus:border-green-500 transition-colors placeholder-gray-600"
            />

            <button
              onClick={handleMagicLink}
              disabled={loading || !email}
              className="w-full bg-green-500 text-black font-semibold rounded-2xl py-4 disabled:opacity-50 hover:bg-green-400 transition-colors"
            >
              {loading ? "Enviando..." : "Enviar enlace mágico"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
