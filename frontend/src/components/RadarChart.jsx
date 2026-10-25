import {
  Radar,
  RadarChart as RRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export default function PillarRadarChart({ pillars }) {
  const data = pillars.map((p) => ({ name: p.code, full: p.name, score: Math.round(p.normalized) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RRadarChart data={data} outerRadius="75%">
        <PolarGrid />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#0f172a"
          fill="#0f172a"
          fillOpacity={0.35}
        />
      </RRadarChart>
    </ResponsiveContainer>
  );
}
