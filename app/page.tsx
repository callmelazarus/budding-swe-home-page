"use client";
import Ticker from "./components/Ticker";

const jsNuggets = [
  {
    title: "Closures",
    desc: "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment).",
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures",
    code: `function makeCounter() {\n  let n = 0;\n  return () => ++n;\n}\nconst next = makeCounter();\nnext(); // 1\nnext(); // 2`,
  },
  {
    title: "Promises",
    desc: "A Promise is an object representing the eventual completion or failure of an asynchronous operation.",
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
    code: `const p = new Promise((resolve) => resolve(42));\np.then(console.log); // 42`,
  },
  {
    title: "Arrow Functions",
    desc: "Arrow functions provide a concise syntax for writing function expressions and do not have their own 'this'.",
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions",
    code: `const add = (a, b) => a + b;\nadd(2, 3); // 5`,
  },
];

const historyNuggets = [
  {
    title: "Ada Lovelace",
    desc: "Ada Lovelace is considered the first computer programmer for her work on Charles Babbage's Analytical Engine.",
    link: "https://en.wikipedia.org/wiki/Ada_Lovelace",
  },
  {
    title: "ENIAC",
    desc: "ENIAC was the first electronic general-purpose computer, completed in 1945.",
    link: "https://en.wikipedia.org/wiki/ENIAC",
  },
  {
    title: "Grace Hopper",
    desc: "Grace Hopper was a pioneer of computer programming and invented one of the first compilers.",
    link: "https://en.wikipedia.org/wiki/Grace_Hopper",
  },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Page() {
  const js = getRandom(jsNuggets);
  const history = getRandom(historyNuggets);

  return (
    <main className="wrap" style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* S&P 500 Ticker */}
      <div style={{ marginBottom: 32 }}>
        <Ticker symbols={["^GSPC"]} />
      </div>

      {/* TLDR Button */}
      <a
        href="https://tldr.tech/"
        target="_blank"
        rel="noreferrer"
        style={{
          display: "block",
          width: "100%",
          height: "2in",
          background: "#60a5fa",
          color: "#fff",
          fontSize: 32,
          fontWeight: 700,
          borderRadius: 18,
          textAlign: "center",
          lineHeight: "2in",
          marginBottom: 32,
          boxShadow: "0 4px 32px rgba(60,130,246,0.12)",
          textDecoration: "none",
          letterSpacing: 1.5,
        }}
      >
        Visit TLDR Tech →
      </a>

      {/* JS Knowledge Nugget */}
      <section
        className="card nugget"
        style={{ width: "100%", minHeight: "4in", marginBottom: 32 }}
      >
        <div className="section-title">JavaScript Knowledge Nugget</div>
        <h3 className="headline">{js.title}</h3>
        <p className="desc">{js.desc}</p>
        <a
          href={js.link}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#60a5fa" }}
        >
          Read more on MDN
        </a>
        <pre aria-label="js example">
          <code>{js.code}</code>
        </pre>
      </section>

      {/* History Nugget */}
      <section
        className="card history"
        style={{ width: "100%", minHeight: "4in", marginBottom: 32 }}
      >
        <div className="section-title">History Nugget</div>
        <h3 className="headline">{history.title}</h3>
        <p className="desc">{history.desc}</p>
        <a
          href={history.link}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#60a5fa" }}
        >
          Learn more on Wikipedia
        </a>
      </section>

      <footer>
        <span className="muted">
          © {new Date().getFullYear()} Software Vocation. Built with Next.js.
        </span>
      </footer>
    </main>
  );
}
