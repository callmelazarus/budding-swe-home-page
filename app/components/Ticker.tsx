// app/components/Ticker.tsx
"use client";
import * as React from "react";

type Quote = {
  symbol: string;
  price?: number;
  change?: number;
  changesPercentage?: number;
};

export default function Ticker({ symbols }: { symbols: string[] }) {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function fetchQuotes() {
      try {
        const url = `https://financialmodelingprep.com/api/v3/quote/${symbols.join(
          ","
        )}?apikey=demo`;
        const res = await fetch(url);
        const data = (await res.json()) as Quote[] | unknown;
        if (mounted && Array.isArray(data)) setQuotes(data);
      } catch {
        if (mounted) setQuotes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchQuotes();
    const id = setInterval(fetchQuotes, 60_000); // refresh every minute
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [symbols.join(",")]);

  // Duplicate so the marquee loops smoothly
  const marquee = React.useMemo(() => quotes.concat(quotes), [quotes]);

  return (
    <div
      className="ticker-track"
      role="marquee"
      aria-label="Live stock prices scrolling"
    >
      <div className="scroll">
        {loading && <span className="muted">Loading quotes…</span>}
        {!loading &&
          marquee.map((q: Quote, i: number) => {
            const pct =
              typeof q.changesPercentage === "number"
                ? q.changesPercentage
                : typeof q.change === "number" && typeof q.price === "number"
                ? (q.change / q.price) * 100
                : 0;
            const up = pct >= 0;
            return (
              <span
                className="row"
                key={`${q.symbol}-${i}`}
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginRight: 12,
                }}
              >
                <strong>{q.symbol}</strong>&nbsp;
                <span className={up ? "price-up" : "price-down"}>
                  {typeof q.price === "number" ? q.price.toFixed(2) : "—"} (
                  {up ? "+" : ""}
                  {pct.toFixed(2)}%)
                </span>
                <span className="dot">•</span>
              </span>
            );
          })}
      </div>
    </div>
  );
}
