import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import IdeaDetail from './pages/IdeaDetail.jsx';
import FrameworkEditor from './pages/FrameworkEditor.jsx';
import Compare from './pages/Compare.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ideas/:id" element={<IdeaDetail />} />
          <Route path="/framework" element={<FrameworkEditor />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </main>
    </div>
  );
}
