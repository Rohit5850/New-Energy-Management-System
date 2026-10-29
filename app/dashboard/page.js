import { getCurrentUser } from "@/lib/session";
import { getAlarms } from "@/lib/db";
import Donut from "@/components/dashboard/Donut";

export const dynamic = "force-dynamic";

const KPIS = [
  { label: "Energy today", value: "18.4 MWh", sub: "−6.2% vs baseline", tone: "ok", dot: "#0a9d64" },
  { label: "Energy cost (MTD)", value: "₹42.1L", sub: "on track", tone: "muted", dot: "#5a6760" },
  { label: "Active alarms", value: "3", sub: "1 action · 2 alert", tone: "crit", dot: "#c0392b" },
  { label: "Savings (month)", value: "₹3.8L", sub: "8.1% saved", tone: "ok", dot: "#0a9d64" },
  { label: "CO₂ (month)", value: "92 t", sub: "Scope 2", tone: "muted", dot: "#b06a12" },
];
const toneClass = { ok: "text-brand-ink", warn: "text-amber", crit: "text-danger", muted: "text-muted" };
const DAYS = [["Fri", 19.2, 19.8], ["Sat", 17.6, 18.9], ["Sun", 14.1, 15.6], ["Mon", 19.5, 20.1], ["Tue", 20.3, 20.4], ["Wed", 21.6, 20.6], ["Thu", 18.4, 19.6]];
const SPLIT = [
  { label: "HVAC / AHUs", value: 42, color: "#0a9d64" },
  { label: "Chillers", value: 19, color: "#1f9e7a" },
  { label: "Process", value: 15, color: "#37b989" },
  { label: "Compressed air", value: 11, color: "#8fd0b4" },
  { label: "Boiler aux", value: 8, color: "#b06a12" },
  { label: "Lighting", value: 5, color: "#d8a13a" },
];
const IDEAS = [
  { title: "Night setback on AHU-07", detail: "Warehouse airflow day-level 22:00–06:00.", saving: "Est. ₹18k/month" },
  { title: "Compressed air leak survey", detail: "Night flow 38% with lines idle.", saving: "Est. ₹24k/month" },
  { title: "CH-02 condenser cleaning", detail: "kW/TR up 12% in 30 days.", saving: "Est. ₹28k/month" },
];
const MAX = 24;

export default async function Overview() {
  const user = await getCurrentUser();
  const alarms = (await getAlarms(user.company_id)).filter((a) => a.status === "open");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-[22px] font-bold">Plant overview</h1>
        <span className="text-[13px] text-muted">Live · updated 1 min ago</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {KPIS.map((k) => (
          <div key={k.label} className="relative flex flex-col gap-1.5 overflow-hidden rounded-2xl border border-line bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: k.dot }} />
            <span className="flex items-center gap-2 text-[13px] text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: k.dot }} />
              {k.label}
            </span>
            <span className="font-mono text-[28px] font-bold tracking-tight">{k.value}</span>
            <span className={`text-[13px] font-semibold ${toneClass[k.tone]}`}>{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        {/* Weekly consumption bar chart */}
        <section className="flex min-w-0 flex-[2] basis-[520px] flex-col gap-4 rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-bold">Consumption — last 7 days</h2>
            <div className="flex gap-3.5 text-xs text-ink2">
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-brand" />Actual</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-amber" />Baseline</span>
            </div>
          </div>
          <div className="flex h-[230px] items-end gap-3 border-b border-line pt-2">
            {DAYS.map(([label, v, b]) => (
              <div key={label} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="absolute -left-1 -right-1 z-10 border-t-2 border-dashed border-amber" style={{ bottom: `${(b / MAX) * 196}px` }} />
                <span className="mb-1 text-center font-mono text-xs text-ink2">{v.toFixed(1)}</span>
                <div
                  className="rounded-t-md transition group-hover:opacity-80"
                  style={{
                    height: `${(v / MAX) * 196}px`,
                    background: v > b ? "linear-gradient(180deg,#c47d22,#b06a12)" : "linear-gradient(180deg,#14b877,#0a9d64)",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            {DAYS.map(([label]) => <span key={label} className="flex-1 text-center text-xs text-muted">{label}</span>)}
          </div>
        </section>

        {/* Energy split DONUT / pie chart */}
        <section className="flex min-w-0 flex-1 basis-[340px] flex-col gap-4 rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
          <h2 className="text-[17px] font-bold">Where energy goes</h2>
          <Donut data={SPLIT} centerTop="548" centerSub="MWh / month" />
        </section>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section className="flex min-w-0 flex-1 basis-[340px] flex-col gap-3 rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
          <h2 className="text-[17px] font-bold">Active alarms</h2>
          {alarms.length === 0 && <p className="text-sm text-muted">Koi active alarm nahi. 🎉</p>}
          {alarms.map((a) => (
            <div key={a.id} className="flex gap-3 border-t border-neutral-100 py-2.5 first:border-0">
              <span className={`self-start whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.sev_class === "crit" ? "bg-danger-soft text-danger" : "bg-amber-soft text-amber"}`}>{a.severity}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{a.condition}</div>
                <div className="text-xs text-muted">{a.location} · {a.value}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="flex min-w-0 flex-1 basis-[340px] flex-col gap-3 rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
          <h2 className="text-[17px] font-bold">Saving opportunities</h2>
          {IDEAS.map((i) => (
            <div key={i.title} className="flex flex-col gap-1 rounded-xl border border-line px-3.5 py-3 transition hover:border-brand hover:bg-brand-soft/30">
              <div className="text-sm font-semibold">{i.title}</div>
              <div className="text-xs text-ink2">{i.detail}</div>
              <div className="text-[13px] font-semibold text-brand-ink">{i.saving}</div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
