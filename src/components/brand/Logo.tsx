import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image
        src="/brand/soleravault-logo.svg"
        alt="SoleraVault logo"
        width={compact ? 56 : 84}
        height={compact ? 42 : 54}
        className="h-12 w-auto object-contain"
        priority
      />
      <span className="sr-only">SoleraVault</span>
    </Link>
  );
}
