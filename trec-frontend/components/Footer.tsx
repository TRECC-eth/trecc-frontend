import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-black/40 py-4 px-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <span>© {new Date().getFullYear()} TRECC</span>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-slate-300 transition-colors">
            Docs
          </Link>
          <Link href="#" className="hover:text-slate-300 transition-colors">
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
