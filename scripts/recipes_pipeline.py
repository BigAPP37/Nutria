#!/usr/bin/env python3
"""
recipes_pipeline.py
===================
Orquestador único para el flujo de recetas/dietas.

Objetivo:
- Centralizar los scripts existentes.
- Automatizar el bloque seguro por defecto: reporte + imágenes.
- Dejar el seed de planes como paso explícito, porque hoy no es idempotente.

Ejemplos:
---------
  python3 scripts/recipes_pipeline.py report
  python3 scripts/recipes_pipeline.py images-auto --limit 20
  python3 scripts/recipes_pipeline.py images-manual --dry-run
  python3 scripts/recipes_pipeline.py full-safe --limit 10
  python3 scripts/recipes_pipeline.py seed-static --dry-run
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

try:
    from dotenv import dotenv_values
    from supabase import Client, create_client
except ImportError as e:
    sys.exit(
        f"❌  Falta dependencia: {e}\n"
        "   Instala al menos:\n"
        "   pip install -r scripts/requirements_images.txt\n"
        "   pip install -r scripts/requirements_plans.txt"
    )


REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = REPO_ROOT / ".env.local"


def load_env() -> dict:
    if not ENV_PATH.exists():
        sys.exit(f"❌  No se encontró .env.local en {ENV_PATH}")
    return dotenv_values(ENV_PATH)


def build_child_env(env: dict) -> dict:
    child_env = os.environ.copy()
    for key, value in env.items():
        if value is not None:
            child_env[key] = str(value)

    # Permitimos usar GEMINI_API_KEY como alias operativo.
    if child_env.get("GEMINI_API_KEY") and not child_env.get("GOOGLE_AI_KEY"):
        child_env["GOOGLE_AI_KEY"] = child_env["GEMINI_API_KEY"]

    return child_env


def get_supabase(env: dict) -> Client:
    url = (env.get("NEXT_PUBLIC_SUPABASE_URL") or "").strip()
    key = (env.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not url or not key:
        sys.exit("❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
    return create_client(url, key)


def count_rows(sb: Client, table: str, *, null_column: str | None = None) -> int:
    query = sb.table(table).select("id", count="exact", head=True)
    if null_column:
        query = query.is_(null_column, "null")
    response = query.execute()
    return response.count or 0


def print_report(sb: Client, env: dict) -> None:
    foods_total = count_rows(sb, "foods")
    foods_missing_images = count_rows(sb, "foods", null_column="image_url")
    recipes_total = count_rows(sb, "recipes")
    plans_total = count_rows(sb, "meal_plans")
    premium_plans = sb.table("meal_plans").select("id", count="exact", head=True).eq("is_premium", True).execute().count or 0
    sample_plans = sb.table("meal_plans").select("id", count="exact", head=True).eq("is_sample", True).execute().count or 0

    gemini_ready = bool((env.get("GEMINI_API_KEY") or env.get("GOOGLE_AI_KEY") or "").strip())

    print("\n📊  Estado actual del pipeline\n" + "─" * 38)
    print(f"  • foods totales:              {foods_total}")
    print(f"  • foods sin imagen:           {foods_missing_images}")
    print(f"  • recipes totales:            {recipes_total}")
    print(f"  • meal_plans totales:         {plans_total}")
    print(f"  • meal_plans premium:         {premium_plans}")
    print(f"  • meal_plans sample:          {sample_plans}")
    print(f"  • Gemini listo para imágenes: {'sí' if gemini_ready else 'no'}")
    print()


def run_script(script_name: str, args: list[str], child_env: dict) -> None:
    cmd = [sys.executable, str(REPO_ROOT / "scripts" / script_name), *args]
    printable = " ".join(cmd)
    print(f"\n▶ {printable}\n")
    subprocess.run(cmd, cwd=REPO_ROOT, env=child_env, check=True)


def cmd_report(args: argparse.Namespace) -> None:
    env = load_env()
    sb = get_supabase(env)
    print_report(sb, env)


def cmd_images_auto(args: argparse.Namespace) -> None:
    env = load_env()
    child_env = build_child_env(env)

    if not child_env.get("GOOGLE_AI_KEY"):
        sys.exit("❌  Falta GEMINI_API_KEY o GOOGLE_AI_KEY en .env.local")

    script_args: list[str] = []
    if args.limit is not None:
        script_args += ["--limit", str(args.limit)]
    if args.name:
        script_args += ["--name", args.name]
    if args.refill:
        script_args.append("--refill")

    run_script("generate_food_images.py", script_args, child_env)


def cmd_images_manual(args: argparse.Namespace) -> None:
    env = load_env()
    child_env = build_child_env(env)

    script_args: list[str] = []
    if args.pending:
        script_args.append("--pending")
    if args.dry_run:
        script_args.append("--dry-run")

    run_script("upload_food_images.py", script_args, child_env)


def cmd_seed_static(args: argparse.Namespace) -> None:
    env = load_env()
    child_env = build_child_env(env)
    script_args: list[str] = []
    if args.dry_run:
        script_args.append("--dry-run")

    print(
        "\n⚠️  seed-static inserta datos de forma acumulativa.\n"
        "   Úsalo solo cuando quieras cargar nuevos planes conscientemente.\n"
    )
    run_script("seed_meal_plans_static.py", script_args, child_env)


def cmd_full_safe(args: argparse.Namespace) -> None:
    env = load_env()
    sb = get_supabase(env)
    child_env = build_child_env(env)

    print_report(sb, env)

    if not child_env.get("GOOGLE_AI_KEY"):
        print("⚠️  Saltando generación automática de imágenes: falta GEMINI_API_KEY/GOOGLE_AI_KEY.\n")
        return

    script_args: list[str] = []
    if args.limit is not None:
        script_args += ["--limit", str(args.limit)]
    if args.refill:
        script_args.append("--refill")

    run_script("generate_food_images.py", script_args, child_env)

    sb = get_supabase(load_env())
    print_report(sb, load_env())


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Pipeline automático de recetas/dietas")
    subparsers = parser.add_subparsers(dest="command", required=True)

    report = subparsers.add_parser("report", help="Muestra el estado actual de recetas/planes/imágenes")
    report.set_defaults(func=cmd_report)

    images_auto = subparsers.add_parser("images-auto", help="Genera imágenes de foods con Gemini y las sube a Supabase")
    images_auto.add_argument("--limit", type=int, default=None, help="Máximo de foods a procesar")
    images_auto.add_argument("--name", type=str, default=None, help="Generar solo un alimento exacto")
    images_auto.add_argument("--refill", action="store_true", help="Regenerar aunque ya tenga imagen")
    images_auto.set_defaults(func=cmd_images_auto)

    images_manual = subparsers.add_parser("images-manual", help="Sube imágenes manuales desde scripts/food-images")
    images_manual.add_argument("--pending", action="store_true", help="Lista foods sin imagen")
    images_manual.add_argument("--dry-run", action="store_true", help="Vista previa sin subir")
    images_manual.set_defaults(func=cmd_images_manual)

    seed_static = subparsers.add_parser("seed-static", help="Inserta planes estáticos de forma explícita")
    seed_static.add_argument("--dry-run", action="store_true", help="Vista previa sin insertar")
    seed_static.set_defaults(func=cmd_seed_static)

    full_safe = subparsers.add_parser("full-safe", help="Ejecuta el flujo seguro por defecto: reporte + imágenes automáticas + reporte")
    full_safe.add_argument("--limit", type=int, default=None, help="Máximo de foods a procesar")
    full_safe.add_argument("--refill", action="store_true", help="Regenerar imágenes ya existentes")
    full_safe.set_defaults(func=cmd_full_safe)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
