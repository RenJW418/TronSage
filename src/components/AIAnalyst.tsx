"use client";

import { useState } from "react";
import { AIAnalysisResponse, X402PaymentProof } from "@/types";
import PaymentModal from "./PaymentModal";

const PRESET_QUERIES = [
  { label: "Market Analysis", query: "Provide a comprehensive analysis of current TRON market conditions and outlook", icon: "📊" },
  { label: "Whale Activity", query: "Analyze the recent whale activity on TRON and what it signals for the market", icon: "🐋" },
  { label: "DeFi Strategy", query: "What is the optimal DeFi yield strategy on TRON right now given current APYs and risk levels?", icon: "💡" },
  { label: "Risk Assessment", query: "Assess the current risk environment for TRON DeFi investors", icon: "⚠️" },
];

function SignalBar({ type, strength, title, reasoning }: {
  type: "bullish" | "bearish" | "neutral";
  strength: number;
  title: string;
  reasoning: string;
}) {
  const color = type === "bullish" ? "#34d399" : type === "bearish" ? "#ff3366" : "#94a3b8";
  const label = type === "bullish" ? "BULLISH" : type === "bearish" ? "BEARISH" : "NEUTRAL";
  return (
    <div className="p-3 rounded-lg border" style={{ borderColor: `${color}22`, background: `${color}08` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-orbitron text-[10px] font-bold tracking-wider" style={{ color }}>
          {label}
        </span>
        <span className="font-mono text-[11px] text-cyber-muted">
          {strength}% strength
        </span>
      </div>
      <div className="progress-bar mb-2">
        <div className="progress-fill" style={{ width: `${strength}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      </div>
      <p className="font-semibold text-[13px] text-cyber-text mb-1">{title}</p>
      <p className="text-[12px] text-cyber-muted leading-relaxed">{reasoning}</p>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-2 text-cyber-cyan font-orbitron text-sm">
      <div className="live-dot" />
      <span>Analyzing on-chain data</span>
      <span className="animate-pulse">...</span>
    </div>
  );
}

export default function AIAnalyst() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (!query.trim()) return;
    setShowPayment(true);
    setError(null);
  };

  const handlePaymentComplete = async (proof: X402PaymentProof | null, _demo: boolean) => {
    setShowPayment(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          paymentProof: proof,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.error || "Analysis failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const riskColors: Record<string, string> = {
    low: "#34d399",
    medium: "#fbbf24",
    high: "#ff3366",
  };

  return (
    <div className="card card-glow flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🤖</div>
          <div>
            <h2 className="font-orbitron text-sm font-bold text-cyber-text tracking-wide">
              AI ANALYST
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-cyber-muted">Powered by GPT-4o</p>
              <span className="tag tag-cyan text-[9px]">x402 Protocol</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: "#34d399",
              boxShadow: "0 0 8px #34d399",
              animation: "livePulse 2s infinite",
            }}
          />
          <span className="font-orbitron text-[10px] text-emerald-400 tracking-wider">
            ONLINE
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Payment Note */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/15">
          <span className="text-cyber-cyan text-lg mt-0.5">💳</span>
          <div>
            <p className="text-[12px] text-cyber-cyan font-semibold">
              x402 Micropayment Required
            </p>
            <p className="text-[11px] text-cyber-muted mt-0.5">
              Each AI analysis costs <strong className="text-cyber-text">0.1 USDT</strong>{" "}
              paid via Bank of AI x402 protocol on TRON. Try{" "}
              <strong className="text-cyber-cyan">Demo Mode</strong> for free.
            </p>
          </div>
        </div>

        {/* Preset Queries */}
        <div className="grid grid-cols-2 gap-2">
          {PRESET_QUERIES.map((p) => (
            <button
              key={p.label}
              onClick={() => setQuery(p.query)}
              className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all group ${
                query === p.query
                  ? "border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan"
                  : "border-white/8 bg-white/3 text-cyber-muted hover:border-cyber-cyan/25 hover:text-cyber-text"
              }`}
            >
              <span className="text-base">{p.icon}</span>
              <span className="font-orbitron text-[11px] font-bold tracking-wide">
                {p.label}
              </span>
            </button>
          ))}
        </div>

        {/* Query Input */}
        <div className="space-y-3">
          <label className="block font-orbitron text-[10px] font-bold text-cyber-muted tracking-widest uppercase">
            Your Analysis Query
          </label>
          <textarea
            className="cyber-input resize-none"
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask TronSage AI anything about TRON ecosystem, DeFi strategies, market analysis..."
          />
          <button
            onClick={handleAnalyze}
            disabled={!query.trim() || loading}
            className={`btn-cyber btn-cyber-primary w-full justify-center py-3 ${
              (!query.trim() || loading) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <LoadingDots />
            ) : (
              <>
                <span>⚡</span>
                <span>Analyze (0.1 USDT)</span>
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-cyber-red/30 bg-cyber-red/8">
            <p className="text-cyber-red text-[13px] font-semibold">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-5 fade-in-up">
            {/* Main Analysis */}
            <div className="p-4 rounded-xl border border-cyber-border bg-cyber-black/40">
              <div className="flex items-center justify-between mb-3">
                <span className="font-orbitron text-[11px] font-bold text-cyber-cyan tracking-wider">
                  ◈ ANALYSIS
                </span>
                <div className="flex items-center gap-3">
                  {result.demoMode && (
                    <span className="tag tag-purple text-[9px]">Demo</span>
                  )}
                  <span className="font-mono text-[10px] text-cyber-muted">
                    Confidence: {result.confidence}%
                  </span>
                  <span
                    className="tag text-[10px] font-bold"
                    style={{
                      background: `${riskColors[result.riskLevel]}18`,
                      color: riskColors[result.riskLevel],
                      borderColor: `${riskColors[result.riskLevel]}30`,
                      border: "1px solid",
                    }}
                  >
                    {result.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
              </div>
              <p className="text-[13px] text-cyber-text leading-relaxed whitespace-pre-line">
                {result.analysis}
              </p>
            </div>

            {/* Signals */}
            {result.signals.length > 0 && (
              <div>
                <h4 className="font-orbitron text-[11px] font-bold text-cyber-muted tracking-wider mb-3">
                  ◈ MARKET SIGNALS
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {result.signals.map((s, i) => (
                    <SignalBar key={i} {...s} />
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="p-4 rounded-xl border border-cyber-border bg-cyber-black/40">
                <h4 className="font-orbitron text-[11px] font-bold text-cyber-cyan tracking-wider mb-3">
                  ◈ RECOMMENDATIONS
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-cyber-text">
                      <span className="text-cyber-cyan font-orbitron text-[11px] mt-0.5 shrink-0">
                        {(i + 1).toString().padStart(2, "0")}.
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="px-3 py-2 rounded-lg bg-cyber-black/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyber-muted font-mono">
                  TronSage AI · {new Date(result.timestamp).toLocaleTimeString()}
                </span>
                {result.paidWith && (
                  <>
                    <span className="text-cyber-muted">·</span>
                    <a
                      href={`https://tronscan.org/#/transaction/${result.paidWith}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyber-cyan font-mono hover:underline"
                    >
                      Paid: {result.paidWith.slice(0, 10)}...
                    </a>
                  </>
                )}
              </div>
              <span className="tag tag-cyan text-[9px]">Verified by Bank of AI</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
