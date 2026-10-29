// Pure-SVG donut (pie) chart — server component, no JS needed on client.
// props: data = [{ label, value, color }], center label/value optional, unit.
export default function Donut({ data = [], size = 190, thickness = 26, centerTop, centerSub }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  let acc = 0;
  const segments = data.map((d) => {
    const frac = d.value / total;
    const dash = frac * C;
    const seg = {
      color: d.color,
      dasharray: `${dash} ${C - dash}`,
      dashoffset: -acc * C,
    };
    acc += frac;
    return seg;
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef1ee" strokeWidth={thickness} />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerTop && <span className="font-mono text-[26px] font-extrabold tracking-tight text-ink">{centerTop}</span>}
          {centerSub && <span className="text-[12px] font-medium text-muted">{centerSub}</span>}
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 basis-[180px] flex-col gap-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate text-ink2">{d.label}</span>
            <span className="font-mono font-semibold text-ink">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
