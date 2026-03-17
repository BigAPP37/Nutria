"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", icon: "⊙", label: "Inicio" },
  { href: "/fasting", icon: "⏱", label: "Ayuno" },
  { href: "/stats", icon: "↗", label: "Stats" },
  { href: "/profile", icon: "◎", label: "Perfil" },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-[#1e1e1e] safe-bottom z-50">
      <div className="flex max-w-lg mx-auto">
        {NAV.map(item => {
          const active = path.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${active ? "text-green-400" : "text-gray-600 hover:text-gray-400"}`}>
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
