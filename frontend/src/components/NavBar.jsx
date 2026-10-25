import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
  }`;

export default function NavBar() {
  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white grid place-items-center font-bold text-sm">
            D
          </div>
          <span className="font-semibold text-slate-900">DVFE Framework</span>
        </div>
        <nav className="flex gap-1">
          <NavLink to="/" className={linkClass} end>
            Ideas
          </NavLink>
          <NavLink to="/compare" className={linkClass}>
            Compare
          </NavLink>
          <NavLink to="/framework" className={linkClass}>
            Framework Editor
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
