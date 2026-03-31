// ────────────────────────────────────────────────────────────
// TRON Network Utilities
// Uses TronScan public API + TronGrid + TronWeb (server-side)
// ────────────────────────────────────────────────────────────

import {
  WhaleTransaction,
  WalletPortfolio,
  TokenBalance,
  TronNetworkStats,
  WhaleTokenType,
} from "@/types";

// ── TronWeb (server-side only) ────────────────────────────────
// TronWeb is loaded lazily so it doesn't break the client bundle.
// All functions that use TronWeb are server-side only (called from API routes).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _tronWebInstance: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTronWeb(): Promise<any | null> {
  if (!process.env.AGENT_TRON_PRIVATE_KEY) return null;
  if (_tronWebInstance) return _tronWebInstance;

  try {
    // Dynamic import keeps TronWeb out of the client bundle
    const TronWebModule = await import("tronweb");
    const TronWeb = TronWebModule.default ?? TronWebModule;

    _tronWebInstance = new TronWeb({
      fullHost: "https://api.trongrid.io",
      privateKey: process.env.AGENT_TRON_PRIVATE_KEY,
      ...(process.env.TRONGRID_API_KEY
        ? { headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY } }
        : {}),
    });
    return _tronWebInstance;
  } catch (err) {
    console.error("[TronWeb] Failed to initialize:", err);
    return null;
  }
}

/**
 * Sends a TRC20 token transfer on TRON mainnet.
 * Requires AGENT_TRON_PRIVATE_KEY to be set in environment variables.
 *
 * @param toAddress   - Recipient TRON address
 * @param rawAmount   - Amount in the token's smallest unit (e.g. "100000" for 0.1 USDT)
 * @param contractAddress - TRC20 contract address
 * @returns TRON transaction hash (64-char hex string)
 * @throws if private key is missing or the transaction fails
 */
export async function sendTrc20Transfer(
  toAddress: string,
  rawAmount: string,
  contractAddress: string
): Promise<string> {
  const tronWeb = await getTronWeb();
  if (!tronWeb) {
    throw new Error("AGENT_TRON_PRIVATE_KEY is not configured — cannot send transaction");
  }

  const contract = await tronWeb.contract().at(contractAddress);
  // BigInt handles 18-decimal USDD amounts safely
  const txHash = await contract.methods
    .transfer(toAddress, BigInt(rawAmount))
    .send({ feeLimit: 20_000_000 }); // 20 TRX fee limit

  if (!txHash || typeof txHash !== "string") {
    throw new Error("Transaction broadcast failed — no txHash returned");
  }
  return txHash;
}

/**
 * Broadcasts a minimal (1-SUN) self-transfer with a UTF-8 memo encoded as hex.
 * Used by the 8004 identity system to anchor agent events on-chain.
 *
 * Returns the txid on success, or null if TronWeb is not configured / broadcast fails.
 */
export async function recordOnchainMemo(memo: string): Promise<string | null> {
  const tronWeb = await getTronWeb();
  if (!tronWeb) return null;

  const agentAddress = process.env.AGENT_TRON_ADDRESS;
  if (!agentAddress) return null;

  try {
    // Truncate and hex-encode the memo (max 250 chars to stay within TRON note limit)
    const hexNote = Buffer.from(memo.slice(0, 250), "utf8").toString("hex");

    const tx = await tronWeb.transactionBuilder.sendTrx(
      agentAddress,
      1, // 1 SUN = 0.000001 TRX
      agentAddress,
      { note: hexNote }
    );
    const signed = await tronWeb.trx.sign(tx);
    const result = await tronWeb.trx.sendRawTransaction(signed);

    if (result.result === false) {
      console.warn("[TronWeb] recordOnchainMemo broadcast returned false");
      return null;
    }
    return result.txid ?? result.transaction?.txID ?? null;
  } catch (err) {
    console.error("[TronWeb] recordOnchainMemo error:", err);
    return null;
  }
}

const TRONSCAN = "https://apilist.tronscanapi.com";

// Known TRON token contracts
const KNOWN_TOKENS: Record<string, { symbol: WhaleTokenType; name: string; decimals: number }> = {
  TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t: { symbol: "USDT", name: "Tether USD", decimals: 6 },
  TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn: { symbol: "USDD", name: "Decentralized USD", decimals: 18 },
  TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4: { symbol: "BTT", name: "BitTorrent", decimals: 18 },
  TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZkQf: { symbol: "JST", name: "JUST", decimals: 18 },
};

// Known exchange addresses (for tagging)
const EXCHANGE_ADDRESSES = new Set([
  "TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax", // Binance
  "TNaRAoLUyYEV2uF7GUrzSjRQTUMYfSMEJn", // OKX
  "TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb", // HTX (Huobi)
]);

// ── Public formatters ──────────────────────────────────────────

export function shortenAddress(addr: string, chars = 6): string {
  if (!addr || addr.length < chars * 2) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
  return amount.toFixed(2);
}

// ── TRON Network Stats ─────────────────────────────────────────

export async function fetchTronNetworkStats(): Promise<TronNetworkStats> {
  try {
    const [overviewRes, priceRes] = await Promise.allSettled([
      fetch(`${TRONSCAN}/api/index/overview`, { next: { revalidate: 30 } }),
      fetch(`${TRONSCAN}/api/token/price?token=TRX`, { next: { revalidate: 30 } }),
    ]);

    let blockHeight = 63_000_000;
    let tps = 67;
    let totalAccounts = 256_000_000;
    let totalTransactions = 9_800_000_000;
    let burnedTrx = 84_000_000;

    if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
      const d = await overviewRes.value.json();
      blockHeight = d.block || blockHeight;
      tps = d.tps || tps;
      totalAccounts = d.totalAccounts || totalAccounts;
      totalTransactions = d.totalTx || totalTransactions;
    }

    let trxPrice = 0.138;
    let priceChange24h = 2.4;

    if (priceRes.status === "fulfilled" && priceRes.value.ok) {
      const d = await priceRes.value.json();
      if (d.prices?.["TRX_USDT"]) {
        trxPrice = parseFloat(d.prices["TRX_USDT"]);
      }
    }

    return {
      trxPrice,
      priceChange24h,
      marketCap: trxPrice * 87_000_000_000,
      volume24h: 620_000_000,
      tps,
      blockHeight,
      totalAccounts,
      burnedTrx,
      totalTransactions,
      energyUsed24h: 420_000_000_000,
    };
  } catch {
    // Return reasonable fallback values so the UI never breaks
    return {
      trxPrice: 0.138,
      priceChange24h: 2.4,
      marketCap: 12_006_000_000,
      volume24h: 620_000_000,
      tps: 67,
      blockHeight: 63_547_291,
      totalAccounts: 256_389_441,
      burnedTrx: 84_321_000,
      totalTransactions: 9_843_000_000,
      energyUsed24h: 423_000_000_000,
    };
  }
}

// ── Whale Tracker ─────────────────────────────────────────────

export async function fetchWhaleTransactions(
  token: "USDT" | "USDD" | "ALL" = "ALL",
  minUSD = 100_000
): Promise<WhaleTransaction[]> {
  const contracts =
    token === "USDT"
      ? [KNOWN_TOKENS["TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"]]
      : token === "USDD"
      ? [KNOWN_TOKENS["TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn"]]
      : Object.entries(KNOWN_TOKENS).slice(0, 2);

  const contractAddresses =
    token === "USDT"
      ? ["TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"]
      : token === "USDD"
      ? ["TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn"]
      : ["TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", "TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn"];

  try {
    const promises = contractAddresses.map((contract) =>
      fetch(
        `${TRONSCAN}/api/transfer/trc20?sort=-timestamp&limit=20&start=0&contract=${contract}&filterTokenValue=1`,
        { next: { revalidate: 20 } }
      ).then((r) => (r.ok ? r.json() : { token_transfers: [] }))
    );

    const results = await Promise.allSettled(promises);
    const allTxs: WhaleTransaction[] = [];

    results.forEach((result, idx) => {
      if (result.status !== "fulfilled") return;
      const tokenInfo = KNOWN_TOKENS[contractAddresses[idx]];
      const transfers = result.value.token_transfers || result.value.data || [];

      transfers.forEach((tx: Record<string, unknown>) => {
        const rawAmount = parseFloat(String(tx.quant || tx.amount || "0"));
        const amount = rawAmount / Math.pow(10, tokenInfo.decimals);
        if (amount < minUSD / 1) return; // rough filter

        const from = String(tx.from_address || tx.transferFromAddress || "");
        const to = String(tx.to_address || tx.transferToAddress || "");

        allTxs.push({
          hash: String(tx.transaction_id || tx.hash || ""),
          from,
          to,
          amount,
          amountUSD: amount, // USDT/USDD ≈ 1:1 USD
          tokenSymbol: tokenInfo.symbol,
          tokenName: tokenInfo.name,
          contractAddress: contractAddresses[idx],
          timestamp: Number(tx.block_ts || tx.timestamp || Date.now()),
          blockNumber: Number(tx.block || 0),
          confirmed: true,
          isExchange: EXCHANGE_ADDRESSES.has(from) || EXCHANGE_ADDRESSES.has(to),
        });
      });
    });

    return allTxs
      .filter((tx) => tx.amount >= minUSD)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 30);
  } catch (err) {
    console.error("[Tron] fetchWhaleTransactions error:", err);
    return generateMockWhaleTransactions();
  }
}

// ── Portfolio ─────────────────────────────────────────────────

export async function fetchWalletPortfolio(address: string): Promise<WalletPortfolio> {
  try {
    const res = await fetch(
      `${TRONSCAN}/api/account?address=${address}`,
      { next: { revalidate: 30 } }
    );

    if (!res.ok) throw new Error("Account not found");

    const data = await res.json();

    const trxBalance = (data.balance || 0) / 1_000_000;
    const trxPrice = 0.138; // fallback

    const tokens: TokenBalance[] = (data.trc20token_balances || [])
      .filter((t: Record<string, unknown>) => parseFloat(String(t.balance || "0")) > 0)
      .map((t: Record<string, unknown>) => {
        const tok = KNOWN_TOKENS[String(t.tokenId || t.token_id || "")];
        const decimals = Number(t.tokenDecimal || 6);
        const balance = parseFloat(String(t.balance || "0")) / Math.pow(10, decimals);
        const priceUsd = parseFloat(String(t.tokenPriceInUsd || "0"));
        return {
          symbol: String(t.tokenAbbr || t.tokenSymbol || tok?.symbol || "???"),
          name: String(t.tokenName || tok?.name || "Unknown Token"),
          balance,
          usdValue: balance * priceUsd,
          priceUsd,
          change24h: 0,
          contractAddress: String(t.tokenId || ""),
        } satisfies TokenBalance;
      })
      .filter((t: TokenBalance) => t.usdValue > 0.01)
      .sort((a: TokenBalance, b: TokenBalance) => b.usdValue - a.usdValue);

    const totalTokenValue = tokens.reduce((s, t) => s + t.usdValue, 0);
    const trxValueUsd = trxBalance * trxPrice;

    return {
      address,
      totalValueUsd: trxValueUsd + totalTokenValue,
      trxBalance,
      trxValueUsd,
      tokens,
      change24h: 0,
      lastActivity: data.latestOperationTime || Date.now(),
      accountType:
        totalTokenValue + trxValueUsd > 500_000
          ? "whale"
          : "user",
      transactionCount: data.transactions || 0,
    };
  } catch (err) {
    console.error("[Tron] fetchWalletPortfolio error:", err);
    throw err;
  }
}

// ── Mock Data (fallback when API is unavailable) ───────────────

function generateMockWhaleTransactions(): WhaleTransaction[] {
  const addresses = [
    "TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax",
    "TNaRAoLUyYEV2uF7GUrzSjRQTUMYfSMEJn",
    "TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb",
    "TEqT3z8JqDsHs9eMjsAJPQJtxSHejF5oj3",
    "TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe",
    "TYukBQZ2XXCcRCReAUgwnpus9KAeGBSxHJ",
    "TPkzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2B",
    "TSAoLUyYEV2uF7GUrzSjRQTUMYfSMEJnXY",
  ];

  const amounts = [500_000, 1_200_000, 780_000, 2_500_000, 150_000, 890_000, 3_000_000, 450_000];

  return amounts.map((amount, i) => ({
    hash: `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.toUpperCase(),
    from: addresses[i % addresses.length],
    to: addresses[(i + 1) % addresses.length],
    amount,
    amountUSD: amount,
    tokenSymbol: i % 3 === 2 ? "USDD" : "USDT",
    tokenName: i % 3 === 2 ? "Decentralized USD" : "Tether USD",
    contractAddress: i % 3 === 2
      ? "TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn"
      : "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    timestamp: Date.now() - i * 180_000,
    blockNumber: 63_547_291 - i * 6,
    confirmed: true,
    isExchange: i % 4 === 0,
  }));
}
