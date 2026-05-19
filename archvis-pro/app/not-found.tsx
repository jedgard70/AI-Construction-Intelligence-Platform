import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-4xl font-display font-bold text-white mb-2">404</h2>
      <p className="text-on-surface-variant font-mono text-sm mb-8">The requested workstation or asset could not be located.</p>
      <Link 
        href="/"
        className="px-6 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
