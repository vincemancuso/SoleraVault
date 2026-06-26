import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image
        src="/brand/soleravault-app-icon.png"
        alt=""
        width={compact ? 44 : 56}
        height={compact ? 44 : 56}
        className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14"
        priority
      />
      <span className="grid leading-none">
        <span className="font-display text-xl font-black text-charcoal sm:text-2xl">SoleraVault</span>
        <span className="mt-1 hidden text-[0.62rem] font-black uppercase tracking-[0.22em] text-amber sm:block">
          Track. Blend. Drink. Share.
        </span>
      </span>
    </Link>
  );
}
