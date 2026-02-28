"use client";

import Link from "next/link";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export const Header = () => {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 h-14 bg-base-100 border-b border-[#836FFF]/20 shadow-sm shadow-[#836FFF]/10">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-full bg-[#836FFF] flex items-center justify-center shadow-md shadow-[#836FFF]/40">
          <span className="text-white text-xs font-black">M</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-black text-sm tracking-wide text-base-content">
            MONAD <span className="text-[#836FFF]">SNAKE</span>
          </span>
          <span className="text-[10px] text-base-content/40 font-mono">every move onchain</span>
        </div>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <RainbowKitCustomConnectButton />
      </div>
    </div>
  );
};
