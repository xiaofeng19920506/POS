"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";
import { can, roleLabel, type Permission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type User = {
  id: string;
  name: string;
  role: Role;
  employeeId: string;
};

type Store = {
  displayName: string;
  primaryColor: string;
  accentColor: string;
};

const nav: { href: string; label: string; perm?: Permission }[] = [
  { href: "/floor", label: "桌台", perm: "floorView" },
  { href: "/kds", label: "后厨", perm: "kds" },
  { href: "/admin/floor", label: "布局", perm: "floorEditLayout" },
  { href: "/admin/menu", label: "菜单", perm: "menuAdmin" },
  { href: "/admin/staff", label: "员工", perm: "staffAdmin" },
  { href: "/admin/reports", label: "报表", perm: "reports" },
  { href: "/settings", label: "设置", perm: "settings" },
];

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setStore(d.store);
          if (d.store) {
            document.documentElement.style.setProperty(
              "--brand-primary",
              d.store.primaryColor || brand.primary,
            );
            document.documentElement.style.setProperty(
              "--brand-accent",
              d.store.accentColor || brand.accent,
            );
          }
        }
      })
      .catch(() => undefined);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const display = store?.displayName || brand.displayName;

  return (
    <div className="min-h-dvh bg-[var(--brand-surface)] text-[var(--brand-ink)]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[var(--brand-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2 md:px-5">
          <Link href="/floor" className="flex min-h-11 items-center gap-2 pr-2">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold text-white"
              style={{ background: "var(--brand-primary)" }}
            >
              {display.slice(0, 2).toUpperCase()}
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl tracking-tight">
              {display}
            </span>
          </Link>
          <nav className="flex flex-1 gap-1 overflow-x-auto pb-1">
            {nav.map((item) => {
              if (item.perm && user && !can(user, item.perm)) return null;
              if (item.perm && !user) return null;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`min-h-11 shrink-0 rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-[var(--brand-primary)] text-white"
                      : "bg-black/5 text-[var(--brand-ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-2 text-sm md:flex">
            {title ? <span className="text-[var(--brand-muted)]">{title}</span> : null}
            {user ? (
              <>
                <span>
                  {user.name} · {roleLabel[user.role]}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="min-h-11 rounded-md bg-black/5 px-3"
                >
                  退出
                </button>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={logout}
            className="min-h-11 rounded-md bg-black/5 px-3 text-sm md:hidden"
          >
            退出
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-3 py-3 md:px-5 md:py-4">{children}</main>
    </div>
  );
}
