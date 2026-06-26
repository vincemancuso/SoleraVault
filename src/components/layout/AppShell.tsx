import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1360px] flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-5">
        <Logo />
        <nav className="flex items-center gap-2 text-sm font-bold text-oak">
          <Link className="button-secondary" href="/">Bottles</Link>
          <Link className="button-secondary" href="/spirits">My Bar</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
