const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getFramework: () => request('/framework'),
  saveFramework: (framework) => request('/framework', { method: 'PUT', body: JSON.stringify(framework) }),

  listIdeas: () => request('/ideas'),
  createIdea: (name) => request('/ideas', { method: 'POST', body: JSON.stringify({ name }) }),
  getIdea: (id) => request(`/ideas/${id}`),
  updateIdea: (id, patch) => request(`/ideas/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  duplicateIdea: (id) => request(`/ideas/${id}/duplicate`, { method: 'POST' }),
  deleteIdea: (id) => request(`/ideas/${id}`, { method: 'DELETE' }),
};
