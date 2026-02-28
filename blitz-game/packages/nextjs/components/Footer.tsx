import React from "react";

export const Footer = () => {
  return (
    <div className="py-4 px-4 border-t border-[#836FFF]/10">
      <div className="flex justify-center items-center gap-3 text-xs font-mono text-base-content/30">
        <span>Built on</span>
        <a
          href="https://monad.xyz"
          target="_blank"
          rel="noreferrer"
          className="text-[#836FFF]/60 hover:text-[#836FFF] transition-colors"
        >
          Monad
        </a>
        <span>·</span>
        <a
          href="https://testnet.monadscan.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-base-content/60 transition-colors"
        >
          Explorer
        </a>
        <span>·</span>
        <a
          href="https://faucet.monad.xyz"
          target="_blank"
          rel="noreferrer"
          className="hover:text-base-content/60 transition-colors"
        >
          Faucet
        </a>
      </div>
    </div>
  );
};
