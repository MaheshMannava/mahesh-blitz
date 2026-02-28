"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, createWalletClient, formatEther, http, parseEther, webSocket } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useAccount, useSendTransaction } from "wagmi";
import { MONAD_RPC_HTTP, MONAD_RPC_WSS, monadTestnet } from "~~/scaffold.config";

const SESSION_KEY_STORAGE = "snake-game-session-key";

export function useSessionWallet() {
  const [privateKey, setPrivateKey] = useState<`0x${string}` | null>(null);
  const [balance, setBalance] = useState<bigint>(0n);
  const { address: mainAddress } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const account = useMemo(() => {
    if (!privateKey) return null;
    return privateKeyToAccount(privateKey);
  }, [privateKey]);

  const publicClient = useMemo(() => {
    const canUseWs = typeof window !== "undefined" && !!MONAD_RPC_WSS;
    return createPublicClient({
      chain: monadTestnet,
      transport: canUseWs
        ? webSocket(MONAD_RPC_WSS!, { reconnect: true })
        : http(MONAD_RPC_HTTP),
      pollingInterval: 250,
    });
  }, []);

  const walletClient = useMemo(() => {
    if (!account) return null;
    return createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(MONAD_RPC_HTTP),
    });
  }, [account]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(SESSION_KEY_STORAGE);
    if (stored) {
      setPrivateKey(stored as `0x${string}`);
    }
  }, []);

  const generateSessionKey = useCallback(() => {
    const key = generatePrivateKey();
    localStorage.setItem(SESSION_KEY_STORAGE, key);
    setPrivateKey(key);
    return key;
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!account) return;
    try {
      const bal = await publicClient.getBalance({ address: account.address });
      setBalance(bal);
    } catch {
      // RPC error, ignore
    }
  }, [account, publicClient]);

  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 5000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  const fundSessionWallet = useCallback(
    async (amount = "0.5") => {
      if (!account || !mainAddress) return;
      await sendTransactionAsync({
        to: account.address,
        value: parseEther(amount),
      });
      setTimeout(refreshBalance, 2000);
    },
    [account, mainAddress, sendTransactionAsync, refreshBalance],
  );

  const withdrawToMain = useCallback(async () => {
    if (!walletClient || !account || !mainAddress) return;
    const bal = await publicClient.getBalance({ address: account.address });
    const gasEstimate = 21000n;
    const gasPrice = await publicClient.getGasPrice();
    const gasCost = gasEstimate * gasPrice;
    if (bal <= gasCost) return;

    await walletClient.sendTransaction({
      to: mainAddress,
      value: bal - gasCost,
    });
    setTimeout(refreshBalance, 2000);
  }, [walletClient, account, mainAddress, publicClient, refreshBalance]);

  return {
    sessionAddress: account?.address ?? null,
    privateKey,
    balance,
    formattedBalance: formatEther(balance),
    walletClient,
    publicClient,
    account,
    generateSessionKey,
    fundSessionWallet,
    withdrawToMain,
    refreshBalance,
    hasSessionKey: !!privateKey,
    isFunded: balance > 0n,
  };
}
