import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-4">
      <Image
        src="/brand/soleravault-app-icon.png"
        alt=""
        width={compact ? 56 : 76}
        height={compact ? 56 : 76}
        className="h-14 w-14 rounded-2xl object-contain sm:h-20 sm:w-20"
        priority
      />
      <span className="grid leading-none">
        <span className="font-display text-3xl font-black text-charcoal sm:text-4xl">SoleraVault</span>
        <span className="mt-2 hidden text-[0.72rem] font-black uppercase tracking-[0.24em] text-amber sm:block">
          Track. Blend. Drink. Share.
        </span>
      </span>
    </Link>
  );
}
