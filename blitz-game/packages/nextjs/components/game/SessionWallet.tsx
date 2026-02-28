"use client";

import { useState } from "react";
import { useSessionWallet } from "~~/hooks/useSessionWallet";

export function SessionWallet() {
  const {
    sessionAddress,
    formattedBalance,
    hasSessionKey,
    isFunded,
    generateSessionKey,
    fundSessionWallet,
    withdrawToMain,
  } = useSessionWallet();
  const [fundAmount, setFundAmount] = useState("0.5");
  const [isFunding, setIsFunding] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleFund = async () => {
    setIsFunding(true);
    try {
      await fundSessionWallet(fundAmount);
    } catch (e) {
      console.error("Fund failed:", e);
    }
    setIsFunding(false);
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await withdrawToMain();
    } catch (e) {
      console.error("Withdraw failed:", e);
    }
    setIsWithdrawing(false);
  };

  return (
    <div className="card bg-base-200 shadow-lg border border-primary/10">
      <div className="card-body p-4 gap-3">
        <h3 className="text-base font-bold text-white">Session Wallet</h3>

        {!hasSessionKey ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-white/60 font-mono">
              Generate a session wallet for auto-signing game transactions. No popups during gameplay.
            </p>
            <button className="btn btn-primary btn-sm" onClick={generateSessionKey}>
              Generate Session Key
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">Address</span>
              <span className="font-mono text-xs break-all text-white/90">{sessionAddress}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">Balance</span>
              <span className="font-mono text-xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {parseFloat(formattedBalance).toFixed(4)} <span className="text-sm font-bold text-[#836FFF]">MON</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              {isFunded && <div className="badge badge-success badge-sm font-mono">Funded</div>}
              {!isFunded && <div className="badge badge-warning badge-sm font-mono">Not Funded</div>}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={fundAmount}
                onChange={e => setFundAmount(e.target.value)}
                className="input input-bordered input-sm w-24 font-mono text-white"
                placeholder="0.5"
              />
              <button className="btn btn-primary btn-sm flex-1" onClick={handleFund} disabled={isFunding}>
                {isFunding ? <span className="loading loading-spinner loading-xs" /> : "Fund"}
              </button>
              <button className="btn btn-ghost btn-sm text-white/70 hover:text-white" onClick={handleWithdraw} disabled={isWithdrawing}>
                {isWithdrawing ? <span className="loading loading-spinner loading-xs" /> : "Withdraw"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
