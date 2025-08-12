"use client";
// app/page.tsx
import Link from "next/link";

// ---------- Server-side TLDR headline fetch (App Router) ----------
type TLDR = {
  title: string;
  url: string;
  summary?: string | null;
  source: string;
};

async function getTLDRTop(): Promise<TLDR> {
  // Strategy A: TLDR "latest tech" JSON (shape may change; best-effort)
  try {
    const res = await fetch("https://tldr.tech/api/latest/tech", {
      headers: { accept: "application/json" },
      // fetch fresh on each request; change to 'force-cache' and add revalidate if you want caching
      cache: "no-store",
    });
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
  } catch {
    // ignore and try next strategy
  }

  // Strategy B: RSS-style path
  try {
    const rss = await fetch("https://tldr.tech/tech.rss", {
      headers: { accept: "application/rss+xml,application/xml" },
      cache: "no-store",
    });
    if (rss.ok) {
      const xml = await rss.text();
      const itemMatch = xml.match(/<item>[\s\S]*?<\/item>/);
      const titleMatch = itemMatch?.[0].match(
        /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/
      );
      const linkMatch = itemMatch?.[0].match(/<link>(.*?)<\/link>/);
      const t = titleMatch?.[1] || titleMatch?.[2];
      const u = linkMatch?.[1];
      if (t && u) {
        return { title: t, url: u, summary: null, source: "rss" };
      }
    }
  } catch {}

  // Strategy C: light HTML parse of homepage
  try {
    const htmlRes = await fetch("https://tldr.tech/", { cache: "no-store" });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const linkRegex =
        /<a[^>]+href="(https?:\/\/tldr\.tech\/|\/)news[^"]*"[^>]*>(.*?)<\/a>/i;
      const m = html.match(linkRegex);
      if (m) {
        const rawHref = m[0].match(/href="([^"]+)"/)?.[1];
        const href = rawHref?.startsWith("http")
          ? rawHref
          : `https://tldr.tech${rawHref}`;
        const text =
          m[2]?.replace(/<[^>]+>/g, "").trim() || "Latest from TLDR Tech";
        return {
          title: text,
          url: href!,
          summary: null,
          source: "html-scrape",
        };
      }
    }
  } catch {}

  // Fallback
  return {
    title: "Latest from TLDR Tech",
    url: "https://tldr.tech/",
    summary: "Visit TLDR for today’s top startup/tech stories.",
    source: "fallback",
  };
}

export default async function Page() {
  const tldr = await getTLDRTop();

  return (
    <>
      <main className="wrap">
        <header className="header">
          <div className="brand">
            <div className="logo" aria-hidden />
            <div>
              <h1>Software Vocation — Launchpad</h1>
              <div className="tag">
                A daily starting point for budding engineers
              </div>
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
            <Ticker symbols={["AAPL", "MSFT", "GOOGL", "NVDA"]} />
            <p className="muted small">
              Demo data from FinancialModelingPrep (refreshes every minute).
            </p>
          </aside>

          {/* Knowledge Nugget (MDN) */}
          <article className="card nugget">
            <div className="section-title">Knowledge Nugget — JavaScript</div>
            <h3 className="headline">
              Closures give a function access to its outer scope
            </h3>
            <p className="desc">
              Per MDN: “A closure is the combination of a function bundled
              together with references to its surrounding state (the lexical
              environment).” They’re created every time a function is created.{" "}
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
            <h3 className="headline">
              “Software engineering” was popularized in 1968
            </h3>
            <p className="desc">
              The term gained wide adoption after the NATO Software Engineering
              Conference held in Garmisch, Germany (Oct&nbsp;7–11,&nbsp;1968).
              The meetings highlighted the “software crisis” and helped
              establish software engineering as a discipline.{" "}
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
            © {new Date().getFullYear()} Software Vocation. Built with Next.js.
            Data belongs to respective sources.
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
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial,
            sans-serif;
        }
        a {
          color: var(--accent);
          text-decoration: none;
          transition: color 0.2s;
        }
        a:hover {
          color: var(--accent-2);
          text-decoration: underline;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 40px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .logo {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: radial-gradient(
              120% 80% at -10% -20%,
              #1f2937 0 40%,
              transparent 41%
            ),
            radial-gradient(
              120% 80% at 110% 120%,
              #1f2937 0 40%,
              transparent 41%
            ),
            linear-gradient(135deg, #111827, #0b0f17);
          box-shadow: 0 4px 24px rgba(34, 197, 94, 0.08);
        }
        h1 {
          font-size: 28px;
          margin: 0;
          font-weight: 900;
          letter-spacing: 0.5px;
        }
        .tag {
          font-size: 14px;
          color: var(--muted);
          margin-top: 2px;
        }
        .chip {
          display: inline-block;
          margin-left: 8px;
          border: 1px solid var(--ring);
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          color: var(--muted);
          text-transform: uppercase;
          background: #111827;
        }
        .grid {
          display: grid;
          gap: 28px;
          grid-template-columns: repeat(12, 1fr);
        }
        .card {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.01)
          );
          border: 1px solid var(--ring);
          border-radius: 18px;
          padding: 28px 24px;
          box-shadow: 0 4px 32px rgba(60, 130, 246, 0.08);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .card:hover {
          box-shadow: 0 8px 48px rgba(60, 130, 246, 0.16);
          transform: translateY(-2px) scale(1.01);
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
          font-size: 15px;
          font-weight: 700;
          color: #60a5fa;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 0 0 14px;
        }
        .headline {
          font-size: 26px;
          line-height: 1.2;
          margin: 6px 0 12px;
          font-weight: 800;
        }
        .desc {
          color: var(--muted);
          font-size: 16px;
          margin: 0 0 8px 0;
        }
        .muted {
          color: var(--muted);
        }
        .small {
          font-size: 13px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #0f172a;
          border: 1px solid var(--ring);
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 15px;
          font-weight: 700;
          color: #60a5fa;
          box-shadow: 0 2px 12px rgba(60, 130, 246, 0.08);
        }
        .ticker-track {
          overflow: hidden;
          white-space: nowrap;
          border: 1px dashed #1f2937;
          border-radius: 12px;
          padding: 14px;
          background: #111827;
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
          font-weight: 700;
        }
        .price-down {
          color: #f87171;
          font-weight: 700;
        }
        code {
          background: #0f172a;
          border: 1px solid var(--ring);
          padding: 4px 8px;
          border-radius: 10px;
          display: inline-block;
          font-size: 15px;
        }
        pre {
          margin-top: 16px;
          overflow-x: auto;
          background: #111827;
          border-radius: 10px;
          padding: 12px;
        }
        footer {
          margin-top: 36px;
          color: var(--muted);
          font-size: 15px;
          text-align: center;
        }
        @media (max-width: 980px) {
          .news,
          .ticker,
          .nugget,
          .history {
            grid-column: span 12;
          }
          .wrap {
            padding: 24px 8px 40px;
          }
          .card {
            padding: 18px 10px;
          }
        }
      `}</style>
    </>
  );
}

// Import after the component so the file structure is obvious in examples:
import Ticker from "./components/Ticker";
