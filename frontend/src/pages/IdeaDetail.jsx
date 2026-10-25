import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { evaluateIdea, colorForScore, verdictTone } from '../lib/scoring.js';
import { scoreToneClasses } from '../lib/colors.js';
import Badge from '../components/Badge.jsx';
import PillarRadarChart from '../components/RadarChart.jsx';

const GATE_TONE = { kill: 'red', cap: 'yellow', 'pass-autonomy': 'green', pass: 'green' };

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [name, setName] = useState('');
  const [scores, setScores] = useState({});
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const [openPillars, setOpenPillars] = useState({});
  const saveTimer = useRef(null);

  useEffect(() => {
    api.getIdea(id).then((data) => {
      setIdea(data);
      setName(data.name);
      setScores(data.scores || {});
      const open = {};
      data.frameworkSnapshot.pillars.forEach((p) => (open[p.id] = true));
      setOpenPillars(open);
    });
  }, [id]);

  function scheduleSave(nextName, nextScores) {
    setSaveState('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await api.updateIdea(id, { name: nextName, scores: nextScores });
      setSaveState('saved');
    }, 500);
  }

  function updateScore(code, field, value) {
    const next = { ...scores, [code]: { ...scores[code], [field]: value } };
    setScores(next);
    scheduleSave(name, next);
  }

  function updateName(value) {
    setName(value);
    scheduleSave(value, scores);
  }

  if (!idea) return <div className="text-slate-500">Loading...</div>;

  const evaluation = evaluateIdea(idea.frameworkSnapshot, scores);

  return (
    <div>
      <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-900 mb-4">
        ← Back to Ideas
      </button>

      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex-1">
          <input
            value={name}
            onChange={(e) => updateName(e.target.value)}
            className="text-2xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 outline-none w-full"
          />
          <div className="text-xs text-slate-400 mt-1">
            Created {new Date(idea.createdAt).toLocaleDateString()} · {saveState === 'saving' ? 'Saving…' : 'Saved'}
          </div>
        </div>
      </div>

      {/* Summary panel */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5 col-span-1">
          <PillarRadarChart pillars={evaluation.pillars} />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase font-semibold">Overall Weighted Viability</div>
            <div className="text-4xl font-bold text-slate-900 mt-2">{evaluation.overall.toFixed(1)}</div>
            <div className="text-xs text-slate-400 mt-1">out of 100</div>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase font-semibold">Hard Gate (Min Pillar)</div>
            <div className="text-4xl font-bold text-slate-900 mt-2">{evaluation.minPillar.toFixed(0)}</div>
            <div className="text-xs mt-1">
              {evaluation.hardGatePassed ? (
                <span className="text-green-600">Passes hard gate</span>
              ) : (
                <span className="text-red-600">Below hard gate threshold</span>
              )}
            </div>
          </div>
          <div className="bg-white border rounded-xl p-5 col-span-2">
            <div className="text-xs text-slate-400 uppercase font-semibold mb-2">Strategic Recommendation</div>
            <Badge tone={verdictTone(evaluation.verdict)} className="text-sm px-4 py-2">
              {evaluation.verdict}
            </Badge>
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="space-y-4">
        {idea.frameworkSnapshot.pillars.map((pillar, pIdx) => {
          const pResult = evaluation.pillars[pIdx];
          const isOpen = openPillars[pillar.id];
          return (
            <div key={pillar.id} className="bg-white border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
                onClick={() => setOpenPillars((o) => ({ ...o, [pillar.id]: !o[pillar.id] }))}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{isOpen ? '▾' : '▸'}</span>
                  <span className="font-semibold text-slate-900">{pillar.name}</span>
                  <span className="text-xs text-slate-400">weight {pillar.weight}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-600">
                    {pResult.raw}/{pResult.max}
                  </span>
                  <Badge tone={GATE_TONE[pResult.gate.status]}>{pResult.gate.label}</Badge>
                </div>
              </button>

              {isOpen && (
                <div className="border-t divide-y">
                  {pillar.subcriteria.map((sub) => {
                    const entry = scores[sub.code] || {};
                    const tone = colorForScore(sub, entry.score);
                    return (
                      <div key={sub.code} className="p-4 grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                          <div className="font-medium text-slate-900 text-sm">
                            {sub.code}. {sub.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">doc. weight {sub.weight}</div>
                          <div className="mt-3 space-y-1 text-xs">
                            <div className="text-red-600">
                              <strong>0-{sub.redMax}:</strong> {sub.rubric.red}
                            </div>
                            <div className="text-yellow-700">
                              <strong>
                                {sub.redMax + 1}-{sub.yellowMax}:
                              </strong>{' '}
                              {sub.rubric.yellow}
                            </div>
                            <div className="text-green-700">
                              <strong>
                                {sub.yellowMax + 1}-{sub.maxScore}:
                              </strong>{' '}
                              {sub.rubric.green}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-400">Score (0-{sub.maxScore})</label>
                          <input
                            type="number"
                            min={0}
                            max={sub.maxScore}
                            value={entry.score ?? ''}
                            onChange={(e) =>
                              updateScore(
                                sub.code,
                                'score',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            className={`mt-1 w-full border-2 rounded-lg px-3 py-2 text-lg font-bold outline-none ${scoreToneClasses[tone]}`}
                          />
                        </div>
                        <div className="col-span-7">
                          <label className="text-xs text-slate-400">Assessor Notes & Evidence</label>
                          <textarea
                            value={entry.notes ?? ''}
                            onChange={(e) => updateScore(sub.code, 'notes', e.target.value)}
                            rows={4}
                            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-900"
                            placeholder="Evidence, data points, assumptions..."
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
