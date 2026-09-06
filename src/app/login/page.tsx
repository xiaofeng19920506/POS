"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { brand } from "@/lib/brand";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [employeeId, setEmployeeId] = useState("1001");
  const [pin, setPin] = useState("1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, pin }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || data.error) {
      setError(data.error || "登录失败");
      return;
    }
    const role = data.user?.role as string | undefined;
    const fallback = role === "KITCHEN" ? "/kds" : "/floor";
    router.replace(search.get("next") || fallback);
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #d9c7a2 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #a8c5b5 0%, transparent 45%), linear-gradient(160deg, #f3efe6, #e7e0d2)",
        }}
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white/80 p-8 shadow-xl backdrop-blur"
      >
        <p className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
          {brand.displayName}
        </p>
        <p className="mt-2 text-[var(--brand-muted)]">{brand.tagline} · 工号登录</p>
        <label className="mt-8 block text-sm font-medium">工号</label>
        <input
          className="mt-1 min-h-12 w-full rounded-lg border border-black/15 bg-white px-3 text-lg"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          inputMode="numeric"
          autoComplete="username"
        />
        <label className="mt-4 block text-sm font-medium">PIN</label>
        <input
          className="mt-1 min-h-12 w-full rounded-lg border border-black/15 bg-white px-3 text-lg tracking-widest"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
        />
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 min-h-12 w-full rounded-lg text-base font-semibold text-white"
          style={{ background: "var(--brand-primary)" }}
        >
          {loading ? "登录中…" : "进入系统"}
        </button>
        <p className="mt-4 text-xs text-[var(--brand-muted)]">
          演示：店长 1001 / PIN 1234；后厨 4001 / 1234
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
