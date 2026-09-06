"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { brand } from "@/lib/brand";

export default function SettingsPage() {
  const [form, setForm] = useState<{
    name: string;
    displayName: string;
    primaryColor: string;
    accentColor: string;
    address: string;
  }>({
    name: "",
    displayName: brand.displayName,
    primaryColor: brand.primary,
    accentColor: brand.accent,
    address: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/store")
      .then((r) => r.json())
      .then((d) => {
        if (d.store) {
          setForm({
            name: d.store.name || "",
            displayName: d.store.displayName || brand.displayName,
            primaryColor: d.store.primaryColor || brand.primary,
            accentColor: d.store.accentColor || brand.accent,
            address: d.store.address || "",
          });
        }
      });
  }, []);

  async function save() {
    setMessage("");
    const res = await fetch("/api/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "保存失败");
      return;
    }
    document.documentElement.style.setProperty("--brand-primary", form.primaryColor);
    document.documentElement.style.setProperty("--brand-accent", form.accentColor);
    setMessage("已保存。刷新后导航品牌名会更新。");
  }

  return (
    <AppShell title="门店与品牌设置">
      <section className="max-w-xl rounded-xl border border-black/10 bg-white/75 p-5">
        <p className="text-sm text-[var(--brand-muted)]">
          临时品牌名为「POS」，可在此修改显示名称与主题色。
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">门店名称</label>
          <input
            className="min-h-11 w-full rounded-lg border border-black/15 px-3"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <label className="block text-sm">品牌显示名</label>
          <input
            className="min-h-11 w-full rounded-lg border border-black/15 px-3"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <label className="block text-sm">主色</label>
          <input
            type="color"
            className="min-h-11 w-full rounded-lg border border-black/15 px-3"
            value={form.primaryColor}
            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
          />
          <label className="block text-sm">强调色</label>
          <input
            type="color"
            className="min-h-11 w-full rounded-lg border border-black/15 px-3"
            value={form.accentColor}
            onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
          />
          <label className="block text-sm">地址</label>
          <input
            className="min-h-11 w-full rounded-lg border border-black/15 px-3"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <button
            type="button"
            className="min-h-12 w-full rounded-lg bg-[var(--brand-primary)] font-semibold text-white"
            onClick={save}
          >
            保存设置
          </button>
          {message ? <p className="text-sm">{message}</p> : null}
        </div>
      </section>
    </AppShell>
  );
}
