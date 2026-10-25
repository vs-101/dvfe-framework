import { useEffect, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../lib/api.js';
import { evaluateIdea, verdictTone } from '../lib/scoring.js';
import Badge from '../components/Badge.jsx';

const COLORS = ['#0f172a', '#2563eb', '#16a34a', '#db2777', '#d97706', '#7c3aed'];

export default function Compare() {
  const [ideas, setIdeas] = useState(null);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    api.listIdeas().then((list) => {
      setIdeas(list);
      setSelected(list.slice(0, 3).map((i) => i.id));
    });
  }, []);

  if (!ideas) return <div className="text-slate-500">Loading...</div>;

  const chosen = ideas.filter((i) => selected.includes(i.id));

  // Merge all pillar codes across chosen ideas (they may use different framework snapshots)
  const pillarCodes = [];
  chosen.forEach((idea) => {
    idea.frameworkSnapshot.pillars.forEach((p) => {
      if (!pillarCodes.includes(p.code)) pillarCodes.push(p.code);
    });
  });

  const radarData = pillarCodes.map((code) => {
    const row = { name: code };
    chosen.forEach((idea) => {
      const evaluation = evaluateIdea(idea.frameworkSnapshot, idea.scores);
      const pIdx = idea.frameworkSnapshot.pillars.findIndex((p) => p.code === code);
      row[idea.name] = pIdx >= 0 ? Math.round(evaluation.pillars[pIdx].normalized) : null;
    });
    return row;
  });

  function toggle(id) {
    setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Compare Ideas</h1>
      <p className="text-slate-500 text-sm mb-6">Select ideas to overlay their pillar scores.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {ideas.map((idea) => (
          <button
            key={idea.id}
            onClick={() => toggle(idea.id)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              selected.includes(idea.id)
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {idea.name}
          </button>
        ))}
      </div>

      {chosen.length === 0 ? (
        <div className="text-slate-400 text-center py-16 border-2 border-dashed rounded-xl">
          Select at least one idea to compare.
        </div>
      ) : (
        <>
          <div className="bg-white border rounded-xl p-5 mb-6">
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                {chosen.map((idea, i) => (
                  <Radar
                    key={idea.id}
                    name={idea.name}
                    dataKey={idea.name}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.15}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3">
            {chosen.map((idea) => {
              const evaluation = evaluateIdea(idea.frameworkSnapshot, idea.scores);
              return (
                <div key={idea.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                  <div className="font-semibold text-slate-900">{idea.name}</div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Overall</div>
                      <div className="font-bold">{evaluation.overall.toFixed(1)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Min Pillar</div>
                      <div className="font-bold">{evaluation.minPillar.toFixed(0)}</div>
                    </div>
                    <Badge tone={verdictTone(evaluation.verdict)}>{evaluation.verdict}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
