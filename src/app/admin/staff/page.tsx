"use client";

import { Role } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { roleLabel } from "@/lib/permissions";

type Staff = {
  id: string;
  employeeId: string;
  name: string;
  role: Role;
  active: boolean;
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    pin: "1234",
    role: Role.SERVER as Role,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    const data = await res.json();
    if (res.ok) setStaff(data.staff || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ employeeId: "", name: "", pin: "1234", role: Role.SERVER });
    await load();
  }

  async function toggle(s: Staff) {
    await fetch("/api/staff", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    });
    await load();
  }

  return (
    <AppShell title="员工与权限">
      <section className="rounded-xl border border-black/10 bg-white/75 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl">新增员工</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-5">
          <input
            className="min-h-11 rounded-lg border border-black/15 px-3"
            placeholder="工号"
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          />
          <input
            className="min-h-11 rounded-lg border border-black/15 px-3"
            placeholder="姓名"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="min-h-11 rounded-lg border border-black/15 px-3"
            placeholder="PIN"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
          />
          <select
            className="min-h-11 rounded-lg border border-black/15 px-3"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            {(Object.keys(roleLabel) as Role[]).map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="min-h-11 rounded-lg bg-[var(--brand-primary)] text-white"
            onClick={create}
          >
            创建
          </button>
        </div>
      </section>

      <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 bg-white/75">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/5">
            <tr>
              <th className="px-3 py-3">工号</th>
              <th className="px-3 py-3">姓名</th>
              <th className="px-3 py-3">角色</th>
              <th className="px-3 py-3">状态</th>
              <th className="px-3 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-black/5">
                <td className="px-3 py-3">{s.employeeId}</td>
                <td className="px-3 py-3">{s.name}</td>
                <td className="px-3 py-3">{roleLabel[s.role]}</td>
                <td className="px-3 py-3">{s.active ? "启用" : "停用"}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="min-h-11 rounded-lg bg-black/5 px-3"
                    onClick={() => toggle(s)}
                  >
                    {s.active ? "停用" : "启用"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
