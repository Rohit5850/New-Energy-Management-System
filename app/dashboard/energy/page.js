import Donut from "@/components/dashboard/Donut";

export const dynamic = "force-dynamic";

const KPIS = [
  { label: "Specific energy", value: "412", sub: "kWh/batch · target 430", tone: "ok", dot: "#0a9d64" },
  { label: "Peak demand", value: "1,940", sub: "kVA · 95% of contract", tone: "warn", dot: "#b06a12" },
  { label: "Power factor", value: "0.97", sub: "above 0.95 band", tone: "ok", dot: "#0a9d64" },
  { label: "This week", value: "131 MWh", sub: "−5.8% vs baseline", tone: "ok", dot: "#1f9e7a" },
  { label: "Emissions", value: "92 t", sub: "CO₂ Scope 2", tone: "muted", dot: "#5a6760" },
];
const toneClass = { ok: "text-brand-ink", warn: "text-amber", muted: "text-muted" };
const ASSETS = [
  { name: "Chiller CH-01", kpi: "kW/TR", now: "0.66", target: "≤ 0.70", ok: true },
  { name: "Chiller CH-02", kpi: "kW/TR", now: "0.79", target: "≤ 0.70", ok: false },
  { name: "Boiler B-01", kpi: "Efficiency", now: "86%", target: "≥ 85%", ok: true },
  { name: "Compressor AC-02", kpi: "kW/m³", now: "7.4", target: "≤ 6.5", ok: false },
  { name: "WFI generator", kpi: "kWh/m³", now: "41", target: "≤ 44", ok: true },
];
const LOADMIX = [
  { label: "Utilities (HVAC+chiller)", value: 54, color: "#0a9d64" },
  { label: "Process equipment", value: 26, color: "#37b989" },
  { label: "Compressed air", value: 12, color: "#b06a12" },
  { label: "Lighting + admin", value: 8, color: "#d8a13a" },
];
const IDEAS = [
  { title: "Night setback on AHU-07", tag: "Non-GMP", detail: "Warehouse airflow day-level 22:00–06:00.", saving: "Est. ₹18k/month" },
  { title: "Compressed-air leak", tag: "Non-GMP", detail: "Night flow 38% with lines idle.", saving: "Est. ₹24k/month" },
  { title: "CH-02 efficiency drift", tag: "Change control", detail: "kW/TR up 12% in 30 days.", saving: "Est. ₹28k/month" },
];

const base = [19.8, 18.9, 15.6, 20.1, 20.4, 20.6, 19.6];
const act = [19.2, 17.6, 14.1, 19.5, 20.3, 21.6, 18.4];
const yOf = (v) => (188 - (v / 24) * 176).toFixed(1);
const xOf = (i) => (44 + (i / 6) * 840).toFixed(1);
const line = (arr) => arr.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
const area = (arr) => `44,188 ${line(arr)} 884,188`;

export default function Energy() {
  return (
    <>
      <h1 className="text-[22px] font-bold">Energy analysis</h1>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {KPIS.map((k) => (
          <div key={k.label} className="relative flex flex-col gap-1.5 overflow-hidden rounded-2xl border border-line bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: k.dot }} />
            <span className="text-[13px] text-muted">{k.label}</span>
            <span className="font-mono text-[27px] font-bold tracking-tight">{k.value}</span>
            <span className={`text-[13px] font-semibold ${toneClass[k.tone]}`}>{k.sub}</span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[17px] font-bold">Actual vs expected (baseline)</h2>
          <span className="text-[13px] font-semibold text-brand-ink">This week: 8 MWh saved (5.8%)</span>
        </div>
        <svg viewBox="0 0 900 220" className="block h-auto w-full" role="img" aria-label="Weekly actual below baseline">
          <defs>
            <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0a9d64" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0a9d64" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="44" y="12" width="840" height="176" fill="#fff" stroke="#eef1ee" />
          <line x1="44" y1="56" x2="884" y2="56" stroke="#eef1ee" />
          <line x1="44" y1="100" x2="884" y2="100" stroke="#eef1ee" />
          <line x1="44" y1="144" x2="884" y2="144" stroke="#eef1ee" />
          <polygon points={area(act)} fill="url(#fill)" />
          <polyline points={line(base)} fill="none" stroke="#b06a12" strokeWidth="2.5" strokeDasharray="7 5" strokeLinejoin="round" />
          <polyline points={line(act)} fill="none" stroke="#0a9d64" strokeWidth="3" strokeLinejoin="round" />
          {act.map((v, i) => <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3.5" fill="#0a9d64" />)}
          <text x="38" y="16" textAnchor="end" fontSize="11" fill="#5a6760">24</text>
          <text x="38" y="104" textAnchor="end" fontSize="11" fill="#5a6760">12</text>
          <text x="38" y="186" textAnchor="end" fontSize="11" fill="#5a6760">0</text>
        </svg>
      </section>

      <div className="flex flex-wrap items-start gap-5">
        <section className="min-w-0 flex-[3] basis-[520px] overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="px-6 pb-2 pt-5"><h2 className="text-[17px] font-bold">Equipment efficiency</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-3 font-semibold">Asset</th><th className="px-2 py-3 font-semibold">KPI</th>
                  <th className="px-2 py-3 text-right font-semibold">Now</th><th className="px-2 py-3 text-right font-semibold">Target</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {ASSETS.map((a) => (
                  <tr key={a.name} className="border-t border-neutral-100">
                    <td className="px-6 py-3 font-medium">{a.name}</td>
                    <td className="px-2 py-3 text-ink2">{a.kpi}</td>
                    <td className="px-2 py-3 text-right font-mono">{a.now}</td>
                    <td className="px-2 py-3 text-right font-mono text-muted">{a.target}</td>
                    <td className="px-6 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.ok ? "bg-brand-soft text-brand-ink" : "bg-amber-soft text-amber"}`}>{a.ok ? "On target" : "Review"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex min-w-0 flex-[2] basis-[320px] flex-col gap-4 rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
          <h2 className="text-[17px] font-bold">Load share by area</h2>
          <Donut data={LOADMIX} centerTop="131" centerSub="MWh / week" />
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
        <h2 className="text-[17px] font-bold">Saving opportunities</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          {IDEAS.map((i) => (
            <div key={i.title} className="flex flex-col gap-1.5 rounded-xl border border-line px-4 py-3.5 transition hover:border-brand hover:bg-brand-soft/30">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">{i.title}</span>
                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${i.tag === "Change control" ? "bg-amber-soft text-amber" : "bg-brand-soft text-brand-ink"}`}>{i.tag}</span>
              </div>
              <span className="text-[13px] leading-relaxed text-ink2">{i.detail}</span>
              <span className="text-[13px] font-semibold text-brand-ink">{i.saving}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
