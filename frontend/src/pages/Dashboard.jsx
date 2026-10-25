import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { verdictTone } from '../lib/scoring.js';
import Badge from '../components/Badge.jsx';

export default function Dashboard() {
  const [ideas, setIdeas] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function refresh() {
    try {
      setIdeas(await api.listIdeas());
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    const name = window.prompt('Idea name', 'New Idea');
    if (!name) return;
    const idea = await api.createIdea(name);
    navigate(`/ideas/${idea.id}`);
  }

  async function handleDuplicate(id, e) {
    e.stopPropagation();
    await api.duplicateIdea(id);
    refresh();
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm('Delete this idea evaluation? This cannot be undone.')) return;
    await api.deleteIdea(id);
    refresh();
  }

  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!ideas) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Idea Evaluations</h1>
          <p className="text-slate-500 text-sm mt-1">
            Score ideas against the Desirability / Viability / Feasibility / Ethics framework.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700"
        >
          + New Idea
        </button>
      </div>

      {ideas.length === 0 && (
        <div className="text-center py-16 text-slate-400 border-2 border-dashed rounded-xl">
          No ideas yet. Click "+ New Idea" to start your first evaluation.
        </div>
      )}

      <div className="grid gap-3">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            onClick={() => navigate(`/ideas/${idea.id}`)}
            className="bg-white border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition"
          >
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{idea.name}</div>
              <div className="text-xs text-slate-400 mt-1">
                Updated {new Date(idea.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-slate-400">Overall</div>
                <div className="text-lg font-bold text-slate-900">
                  {idea.evaluation.overall.toFixed(1)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Min Pillar (Gate)</div>
                <div className="text-lg font-bold text-slate-900">
                  {idea.evaluation.minPillar.toFixed(0)}
                </div>
              </div>
              <Badge tone={verdictTone(idea.evaluation.verdict)} className="max-w-[220px] text-center">
                {idea.evaluation.verdict}
              </Badge>
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleDuplicate(idea.id, e)}
                  className="text-xs text-slate-500 hover:text-slate-900 border rounded px-2 py-1"
                >
                  Duplicate
                </button>
                <button
                  onClick={(e) => handleDelete(idea.id, e)}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
