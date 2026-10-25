import { toneClasses } from '../lib/colors.js';

export default function Badge({ tone = 'gray', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
