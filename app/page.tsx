// pages/index.tsx
import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

// ---------- Server-side: TLDR headline fetch ----------
type TLDR = { title: string; url: string; summary?: string | null; source: string };

export const getServerSideProps: GetServerSideProps<{ tldr: TLDR }> = async () => {
  async function getTLDRTop(): Promise<TLDR> {
    // Strategy A: try TLDR's "latest tech" JSON (best effort; shape may change).
    try {
      const res = await fetch("https://tldr.tech/api/latest/tech", { headers: { accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        const first =
          data?.items?.[0] ||
          data?.stories?.[0] ||
          data?.sections?.[0]?.items?.[0] ||
          data;
        const title = first?.title || data?.title;
        const url = first?.url || first?.link || data?.link;
        if (title && url) {
          return {
            title: String(title),
            url: String(url),
            summary: first?.summary || first?.tldr || data?.summary || null,
            source: "api",
          };
        }
      }
    } catch {}

    // Strategy B: try an RSS-ish path (graceful if 404).
    try {
      const rss = await fetch("https://tldr.tech/tech.rss", { headers: { accept: "application/rss+xml,application/xml" } });
      if (rss.ok) {
        const xml = await rss.text();
        const itemMatch = xml.match(/<item>[\s\S]*?<\/item>/);
        const titleMatch = itemMatch?.[0].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
        const linkMatch = itemMatch?.[0].match(/<link>(.*?)<\/link>/);
        const t = titleMatch?.[1] || titleMatch?.[2];
        const u = linkMatch?.[1];
        if (t && u) {
          return { title: t, url: u, summary: null, source: "rss" };
        }
      }
    } catch {}

    // Strategy C: fetch homepage and do a light parse for the first news link.
    try {
      const htmlRes = await fetch("https://tldr.tech/");
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        // Look for first link pointing to /news/... with a title-ish text
        const linkRegex = /<a[^>]+href="(https?:\/\/tldr\.tech\/|\/)news[^"]*"[^>]*>(.*?)<\/a>/i;
        const m = html.match(linkRegex);
        if (m) {
          const rawHref = m[1] ? m[0].match(/href="([^"]+)"/)?.[1] : "/news";
          const href = rawHref?.startsWith("http") ? rawHref : `https://tldr.tech${rawHref}`;
          const text = m[2]?.replace(/<[^>]+>/g, "").trim() || "Latest from TLDR Tech";
          return { title: text, url: href!, summary: null, source: "html-scrape" };
        }
      }
    } catch {}

    // Fallback: just link to TLDR home.
    return {
      title: "Latest from TLDR Tech",
      url: "https://tldr.tech/",
      summary: "Visit TLDR for today’s top startup/tech stories.",
      source: "fallback",
    };
  }

  const tldr = await getTLDRTop();
  return { props: { tldr } };
};

// ---------- Client-side: very small stock ticker ----------
type Quote = {
  symbol: string;
  price?: number;
  change?: number;
  changesPercentage?: number;
};

function useQuotes(symbols: string[]) {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function fetchQuotes() {
      try {
        const url = `https://financialmodelingprep.com/api/v3/quote/${symbols.join(",")}?apikey=demo`;
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
  return { quotes, marquee, loading };
}

export default function HomePage({
  tldr,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const symbols = React.useMemo(() => ["AAPL", "MSFT", "GOOGL", "NVDA"], []);
  const { marquee, loading } = useQuotes(symbols);

  return (
    <>
      <main className="wrap">
        <header className="header">
          <div className="brand">
            <div className="logo" aria-hidden />
            <div>
              <h1>Software Vocation — Launchpad</h1>
              <div className="tag">A daily starting point for budding engineers</div>
            </div>
          </div>
          <div className="pill">v1</div>
        </header>

        <section className="grid">
          {/* Tech News (TLDR) */}
          <article className="card news">
            <div className="section-title">Tech News (TLDR)</div>
            <h2 className="headline">
              <a href={tldr.url} target="_blank" rel="noreferrer">
                {tldr.title}
              </a>
            </h2>
            {tldr.summary ? <p className="desc">{tldr.summary}</p> : null}
            <p className="muted small">
              Source:{" "}
              <a href="https://tldr.tech/" target="_blank" rel="noreferrer">
                tldr.tech
              </a>{" "}
              <span className="chip">{tldr.source}</span>
            </p>
          </article>

          {/* Stock Ticker */}
          <aside className="card ticker">
            <div className="section-title">Market Ticker</div>
            <div className="ticker-track" role="marquee" aria-label="Live stock prices scrolling">
              <div className="scroll">
                {loading && <span className="muted">Loading quotes…</span>}
                {!loading &&
                  marquee.map((q, i) => {
                    const pct =
                      typeof q.changesPercentage === "number"
                        ? q.changesPercentage
                        : typeof q.change === "number" && typeof q.price === "number"
                        ? (q.change / q.price) * 100
                        : 0;
                    const up = pct >= 0;
                    return (
                      <span className="row" key={`${q.symbol}-${i}`}>
                        <strong>{q.symbol}</strong>&nbsp;
                        <span className={up ? "price-up" : "price-down"}>
                          {typeof q.price === "number" ? q.price.toFixed(2) : "—"}{" "}
                          ({up ? "+" : ""}
                          {pct.toFixed(2)}%)
                        </span>
                        <span className="dot">•</span>
                      </span>
                    );
                  })}
              </div>
            </div>
            <p className="muted small">Demo data from FinancialModelingPrep (refreshes every minute).</p>
          </aside>

          {/* Knowledge Nugget (MDN) */}
          <article className="card nugget">
            <div className="section-title">Knowledge Nugget — JavaScript</div>
            <h3 className="headline">Closures give a function access to its outer scope</h3>
            <p className="desc">
              Per MDN: “A closure is the combination of a function bundled together with references to its surrounding
              state (the lexical environment).” They’re created every time a function is created.{" "}
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures"
                target="_blank"
                rel="noreferrer"
              >
                Read more on MDN →
              </a>
            </p>
            <pre aria-label="closure example">
              <code>{`function makeCounter() {
  let n = 0;            // outer scope captured
  return () => ++n;     // inner function closes over n
}
const next = makeCounter();
next(); // 1
next(); // 2`}</code>
            </pre>
          </article>

          {/* Historical Fact */}
          <article className="card history">
            <div className="section-title">Today I Learned — History</div>
            <h3 className="headline">“Software engineering” was popularized in 1968</h3>
            <p className="desc">
              The term gained wide adoption after the NATO Software Engineering Conference held in Garmisch, Germany
              (Oct&nbsp;7–11,&nbsp;1968). The meetings highlighted the “software crisis” and helped establish software
              engineering as a discipline.{" "}
              <a
                href="https://en.wikipedia.org/wiki/NATO_Software_Engineering_Conferences"
                target="_blank"
                rel="noreferrer"
              >
                Learn more →
              </a>
            </p>
          </article>
        </section>

        <footer>
          <span className="muted">
            © {new Date().getFullYear()} Software Vocation. Built with Next.js. Data belongs to respective sources.
          </span>
        </footer>
      </main>

      {/* minimal, modern styling */}
      <style jsx global>{`
        :root {
          --bg: #0b0f17;
          --panel: #111827;
          --muted: #6b7280;
          --text: #e5e7eb;
          --accent: #60a5fa;
          --accent-2: #34d399;
          --ring: #1f2937;
        }
        * {
          box-sizing: border-box;
        }
        html,
        body {
          margin: 0;
          min-height: 100%;
          background: var(--bg);
          color: var(--text);
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }
        a {
          color: var(--accent);
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 20px 64px;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: radial-gradient(120% 80% at -10% -20%, #1f2937 0 40%, transparent 41%),
            radial-gradient(120% 80% at 110% 120%, #1f2937 0 40%, transparent 41%),
            linear-gradient(135deg, #111827, #0b0f17);
        }
        h1 {
          font-size: 20px;
          margin: 0;
          font-weight: 800;
          letter-spacing: 0.2px;
        }
        .tag {
          font-size: 12px;
          color: var(--muted);
        }
        .chip {
          display: inline-block;
          margin-left: 6px;
          border: 1px solid var(--ring);
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
        }
        .grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(12, 1fr);
        }
        .card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0));
          border: 1px solid var(--ring);
          border-radius: 14px;
          padding: 18px;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02) inset;
        }
        .news {
          grid-column: span 7;
        }
        .ticker {
          grid-column: span 5;
        }
        .nugget {
          grid-column: span 6;
        }
        .history {
          grid-column: span 6;
        }
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #a5b4fc;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 10px;
        }
        .headline {
          font-size: 22px;
          line-height: 1.25;
          margin: 4px 0 8px;
        }
        .desc {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }
        .row {
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          margin-right: 12px;
          padding-right: 12px;
        }
        .muted {
          color: var(--muted);
        }
        .small {
          font-size: 12px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          border: 1px solid var(--ring);
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
        }
        .ticker-track {
          overflow: hidden;
          white-space: nowrap;
          border: 1px dashed #1f2937;
          border-radius: 10px;
          padding: 10px;
        }
        .scroll {
          display: inline-block;
          animation: scroll 22s linear infinite;
        }
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .price-up {
          color: var(--accent-2);
        }
        .price-down {
          color: #f87171;
        }
        code {
          background: #0f172a;
          border: 1px solid var(--ring);
          padding: 3px 6px;
          border-radius: 8px;
          display: inline-block;
        }
        pre {
          margin-top: 12px;
          overflow-x: auto;
        }
        footer {
          margin-top: 26px;
          color: var(--muted);
          font-size: 13px;
        }
        @media (max-width: 980px) {
          .news,
          .ticker,
          .nugget,
          .history {
            grid-column: span 12;
          }
        }
        .dot {
          opacity: 0.4;
        }
      `}</style>
    </>
  );
}
