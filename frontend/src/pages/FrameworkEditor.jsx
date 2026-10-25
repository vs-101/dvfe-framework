import { useEffect, useState } from 'react';
import { nanoid } from '../lib/nanoid.js';
import { api } from '../lib/api.js';

function emptySubcriterion() {
  return {
    id: nanoid(),
    code: '',
    name: 'New Sub-Criterion',
    weight: 0.25,
    maxScore: 25,
    redMax: 8,
    yellowMax: 17,
    rubric: { red: '', yellow: '', green: '' },
  };
}

function emptyPillar() {
  return {
    id: nanoid(),
    code: '',
    name: 'New Pillar',
    weight: 0.25,
    gate: { killBelow: 40, capBelow: null },
    autonomyGate: false,
    subcriteria: [emptySubcriterion()],
  };
}

function move(arr, from, to) {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function FrameworkEditor() {
  const [framework, setFramework] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    api.getFramework().then(setFramework);
  }, []);

  if (!framework) return <div className="text-slate-500">Loading...</div>;

  const weightSum = framework.pillars.reduce((s, p) => s + Number(p.weight || 0), 0);

  function updatePillar(pIdx, patch) {
    setFramework((fw) => {
      const pillars = [...fw.pillars];
      pillars[pIdx] = { ...pillars[pIdx], ...patch };
      return { ...fw, pillars };
    });
  }

  function updateGate(pIdx, patch) {
    setFramework((fw) => {
      const pillars = [...fw.pillars];
      pillars[pIdx] = { ...pillars[pIdx], gate: { ...pillars[pIdx].gate, ...patch } };
      return { ...fw, pillars };
    });
  }

  function updateSub(pIdx, sIdx, patch) {
    setFramework((fw) => {
      const pillars = [...fw.pillars];
      const subcriteria = [...pillars[pIdx].subcriteria];
      subcriteria[sIdx] = { ...subcriteria[sIdx], ...patch };
      pillars[pIdx] = { ...pillars[pIdx], subcriteria };
      return { ...fw, pillars };
    });
  }

  function updateRubric(pIdx, sIdx, key, value) {
    setFramework((fw) => {
      const pillars = [...fw.pillars];
      const subcriteria = [...pillars[pIdx].subcriteria];
      subcriteria[sIdx] = {
        ...subcriteria[sIdx],
        rubric: { ...subcriteria[sIdx].rubric, [key]: value },
      };
      pillars[pIdx] = { ...pillars[pIdx], subcriteria };
      return { ...fw, pillars };
    });
  }

  function addPillar() {
    setFramework((fw) => ({ ...fw, pillars: [...fw.pillars, emptyPillar()] }));
  }

  function removePillar(pIdx) {
    if (!window.confirm('Remove this pillar and all its sub-criteria?')) return;
    setFramework((fw) => ({ ...fw, pillars: fw.pillars.filter((_, i) => i !== pIdx) }));
  }

  function movePillar(pIdx, dir) {
    setFramework((fw) => ({ ...fw, pillars: move(fw.pillars, pIdx, pIdx + dir) }));
  }

  function addSub(pIdx) {
    setFramework((fw) => {
      const pillars = [...fw.pillars];
      pillars[pIdx] = {
        ...pillars[pIdx],
        subcriteria: [...pillars[pIdx].subcriteria, emptySubcriterion()],
      };
      return { ...fw, pillars };
    });
  }

  function removeSub(pIdx, sIdx) {
    setFramework((fw) => {
      const pillars = [...fw.pillars];
      pillars[pIdx] = {
        ...pillars[pIdx],
        subcriteria: pillars[pIdx].subcriteria.filter((_, i) => i !== sIdx),
      };
      return { ...fw, pillars };
    });
  }

  function moveSub(pIdx, sIdx, dir) {
    setFramework((fw) => {
      const pillars = [...fw.pillars];
      pillars[pIdx] = { ...pillars[pIdx], subcriteria: move(pillars[pIdx].subcriteria, sIdx, sIdx + dir) };
      return { ...fw, pillars };
    });
  }

  function updateVerdictRule(key, value) {
    setFramework((fw) => ({ ...fw, verdictRules: { ...fw.verdictRules, [key]: Number(value) } }));
  }

  async function save() {
    setStatus('saving');
    const saved = await api.saveFramework(framework);
    setFramework(saved);
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1500);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Framework Editor</h1>
          <p className="text-slate-500 text-sm mt-1">
            Changes here apply to <strong>new</strong> ideas only — existing evaluations keep a
            snapshot of the framework as it was when they were created.
          </p>
        </div>
        <button
          onClick={save}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700"
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save Framework'}
        </button>
      </div>

      {Math.abs(weightSum - 1) > 0.001 && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-yellow-50 text-yellow-800 text-sm border border-yellow-200">
          Pillar weights sum to {weightSum.toFixed(2)}, not 1.00. The overall score will still
          compute, but weighting won't be a clean 0-100 blend.
        </div>
      )}

      <div className="bg-white border rounded-xl p-5 mb-6">
        <div className="font-semibold text-slate-900 mb-3">Verdict Rules</div>
        <div className="grid grid-cols-4 gap-4">
          {[
            ['hardGateMin', 'Hard gate min (kill below)'],
            ['conditionalThreshold', 'Conditional-GO threshold'],
            ['goThreshold', 'Full GO threshold'],
            ['autonomyThreshold', 'Autonomy-gate threshold'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-slate-400">{label}</label>
              <input
                type="number"
                value={framework.verdictRules[key]}
                onChange={(e) => updateVerdictRule(key, e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {framework.pillars.map((pillar, pIdx) => (
          <div key={pillar.id} className="bg-white border rounded-xl p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <button onClick={() => movePillar(pIdx, -1)} className="text-slate-400 hover:text-slate-900 text-xs">▲</button>
                <button onClick={() => movePillar(pIdx, 1)} className="text-slate-400 hover:text-slate-900 text-xs">▼</button>
              </div>
              <div className="grid grid-cols-6 gap-3 flex-1">
                <input
                  value={pillar.name}
                  onChange={(e) => updatePillar(pIdx, { name: e.target.value })}
                  className="col-span-2 border rounded-lg px-3 py-2 text-sm font-semibold"
                  placeholder="Pillar name"
                />
                <input
                  value={pillar.code}
                  onChange={(e) => updatePillar(pIdx, { code: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm"
                  placeholder="Code (e.g. D)"
                />
                <div>
                  <label className="text-xs text-slate-400">Weight</label>
                  <input
                    type="number"
                    step="0.05"
                    value={pillar.weight}
                    onChange={(e) => updatePillar(pIdx, { weight: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Kill below</label>
                  <input
                    type="number"
                    value={pillar.gate.killBelow}
                    onChange={(e) => updateGate(pIdx, { killBelow: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={pillar.gate.capBelow != null}
                      onChange={(e) => updateGate(pIdx, { capBelow: e.target.checked ? 70 : null })}
                    />
                    Cap tier
                  </label>
                  {pillar.gate.capBelow != null && (
                    <input
                      type="number"
                      value={pillar.gate.capBelow}
                      onChange={(e) => updateGate(pIdx, { capBelow: Number(e.target.value) })}
                      className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    />
                  )}
                </div>
              </div>
              <button onClick={() => removePillar(pIdx)} className="text-red-500 hover:text-red-700 text-sm px-2">
                Remove
              </button>
            </div>

            <label className="text-xs text-slate-500 flex items-center gap-2 mb-3 ml-9">
              <input
                type="checkbox"
                checked={pillar.autonomyGate}
                onChange={(e) => updatePillar(pIdx, { autonomyGate: e.target.checked })}
              />
              Use this pillar's score as the autonomy gate in the final verdict
            </label>

            <div className="ml-9 space-y-3">
              {pillar.subcriteria.map((sub, sIdx) => (
                <div key={sub.id} className="border rounded-lg p-3 bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 pt-1">
                      <button onClick={() => moveSub(pIdx, sIdx, -1)} className="text-slate-400 hover:text-slate-900 text-xs">▲</button>
                      <button onClick={() => moveSub(pIdx, sIdx, 1)} className="text-slate-400 hover:text-slate-900 text-xs">▼</button>
                    </div>
                    <div className="grid grid-cols-6 gap-2 flex-1">
                      <input
                        value={sub.code}
                        onChange={(e) => updateSub(pIdx, sIdx, { code: e.target.value })}
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="Code"
                      />
                      <input
                        value={sub.name}
                        onChange={(e) => updateSub(pIdx, sIdx, { name: e.target.value })}
                        className="col-span-2 border rounded px-2 py-1 text-sm"
                        placeholder="Sub-criterion name"
                      />
                      <input
                        type="number"
                        step="0.05"
                        value={sub.weight}
                        onChange={(e) => updateSub(pIdx, sIdx, { weight: Number(e.target.value) })}
                        className="border rounded px-2 py-1 text-sm"
                        title="Documentary weight"
                      />
                      <input
                        type="number"
                        value={sub.maxScore}
                        onChange={(e) => updateSub(pIdx, sIdx, { maxScore: Number(e.target.value) })}
                        className="border rounded px-2 py-1 text-sm"
                        title="Max score"
                      />
                      <button onClick={() => removeSub(pIdx, sIdx)} className="text-red-500 hover:text-red-700 text-xs">
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 ml-9">
                    <div>
                      <label className="text-xs text-red-600">Red (0-{sub.redMax})</label>
                      <textarea
                        value={sub.rubric.red}
                        onChange={(e) => updateRubric(pIdx, sIdx, 'red', e.target.value)}
                        rows={2}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-yellow-700">
                        Yellow ({sub.redMax + 1}-{sub.yellowMax})
                      </label>
                      <textarea
                        value={sub.rubric.yellow}
                        onChange={(e) => updateRubric(pIdx, sIdx, 'yellow', e.target.value)}
                        rows={2}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-green-700">
                        Green ({sub.yellowMax + 1}-{sub.maxScore})
                      </label>
                      <textarea
                        value={sub.rubric.green}
                        onChange={(e) => updateRubric(pIdx, sIdx, 'green', e.target.value)}
                        rows={2}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 ml-9 max-w-xs">
                    <div>
                      <label className="text-xs text-slate-400">Red/Yellow cutoff</label>
                      <input
                        type="number"
                        value={sub.redMax}
                        onChange={(e) => updateSub(pIdx, sIdx, { redMax: Number(e.target.value) })}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Yellow/Green cutoff</label>
                      <input
                        type="number"
                        value={sub.yellowMax}
                        onChange={(e) => updateSub(pIdx, sIdx, { yellowMax: Number(e.target.value) })}
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addSub(pIdx)}
                className="text-sm text-slate-500 hover:text-slate-900 border border-dashed rounded-lg px-3 py-2 w-full"
              >
                + Add Sub-Criterion
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addPillar}
        className="mt-5 text-sm text-slate-500 hover:text-slate-900 border border-dashed rounded-lg px-4 py-3 w-full"
      >
        + Add Pillar
      </button>
    </div>
  );
}
