/**
 * Inline SVG sparkline (§2). ~80×24px, no charting library.
 *
 * Gaps are honoured: a `null` year breaks the line (no interpolation, no
 * connecting across the gap) and renders no point — consistent with the
 * page-wide rule that missing data is never inferred.
 */
interface SparklineProps {
  values: (number | null)[];
  color: string;
  width?: number;
  height?: number;
}

export function Sparkline({ values, color, width = 80, height = 24 }: SparklineProps) {
  const pad = 3;
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) return null; // needs ≥2 real points to be a trend

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const n = values.length;
  const x = (i: number) => pad + (n === 1 ? 0 : (i / (n - 1)) * (width - 2 * pad));
  const y = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad);

  // Build segments split on null → visibly broken (connectNulls = false).
  const segments: string[] = [];
  let cur: string[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (cur.length > 1) segments.push(cur.join(" "));
      cur = [];
    } else {
      cur.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    }
  });
  if (cur.length > 1) segments.push(cur.join(" "));

  const lastIdx = values.map((v, i) => (v !== null ? i : -1)).filter((i) => i >= 0).pop()!;
  const lastVal = values[lastIdx] as number;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle overflow-visible"
      aria-hidden
    >
      {segments.map((pts, i) => (
        <polyline
          key={i}
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      ))}
      {/* dots only on real points */}
      {values.map((v, i) =>
        v === null ? null : (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === lastIdx ? 2.1 : 1.3} fill={color} opacity={i === lastIdx ? 1 : 0.55} />
        ),
      )}
      <circle cx={x(lastIdx)} cy={y(lastVal)} r={3} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />
    </svg>
  );
}
