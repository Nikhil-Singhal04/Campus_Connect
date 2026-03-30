const { useMemo } = React;

function App() {
  const insights = useMemo(
    () => [
      {
        title: "Unified Discovery Layer",
        text: "Search, filter, and discover all campus events from one intelligent feed."
      },
      {
        title: "Live Registration Intelligence",
        text: "Instant seat visibility, waitlist movement, and reminder automation."
      },
      {
        title: "Complete Event Lifecycle",
        text: "From registration to QR tickets and certificates, every step is digital."
      }
    ],
    []
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(130deg,#070d20,#0f1c3a)]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-24 top-12 h-72 w-72 rounded-full bg-[#3ec5ff2b] blur-3xl animate-glowPulse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-20 bottom-16 h-80 w-80 rounded-full bg-[#27d1a63d] blur-3xl animate-floatSlow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 [background-image:linear-gradient(rgba(202,218,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(202,218,255,0.06)_1px,transparent_1px)] [background-size:42px_42px]"
      />

      <header className="relative z-10 mx-auto flex w-[calc(100%-1rem)] max-w-[1200px] items-center justify-between pt-4 md:w-[calc(100%-2rem)] md:pt-8">
        <a href="index.html" aria-label="Campus Connect Home" className="-ml-4 inline-flex md:-ml-6">
          <img src="campus-connect-logo.svg" alt="Campus Connect" className="h-28 w-auto rounded-md md:h-32" />
        </a>

        <div className="flex items-center gap-2 md:gap-3">
          <a
            href="signin.html"
            className="rounded-xl border border-[#cdddff4d] bg-[#0d1b3a99] px-4 py-2 text-sm font-semibold text-[#d9e6ff] transition hover:-translate-y-0.5 hover:border-[#ffc34d88] hover:text-[#ffc34d]"
          >
            Sign in
          </a>
          <a
            href="signup.html"
            className="rounded-xl bg-[linear-gradient(135deg,#27d1a6,#34e5be)] px-4 py-2 text-sm font-semibold text-[#052a22] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Sign up
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto mt-12 w-[calc(100%-1rem)] max-w-[1080px] pb-16 md:mt-16 md:w-[calc(100%-2rem)] md:pb-20">
        <section className="animate-fadeUp">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#71f3d5]">Campus Connect Insight</p>
          <h1 className="mt-6 max-w-[20ch] font-display text-4xl font-bold leading-[1.08] md:text-6xl lg:text-7xl">
            Campus events, redesigned as a premium digital experience.
          </h1>

          <div className="mt-12 space-y-7">
            {insights.map((item, index) => (
              <article key={item.title} className="opacity-0 animate-riseSoft" style={{ animationDelay: `${130 * index}ms` }}>
                <div className="flex items-start gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#27d1a6] shadow-[0_0_12px_rgba(39,209,166,0.9)]" />
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#f6faff]">{item.title}</h2>
                    <p className="mt-2 max-w-[62ch] text-base leading-7 text-[#a9bbde]">{item.text}</p>
                  </div>
                </div>
                <div className="mt-5 h-px w-full bg-gradient-to-r from-[#8bb5ff44] via-[#8bb5ff1f] to-transparent" />
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto w-[calc(100%-1rem)] max-w-[1080px] border-t border-[#8bb5ff2d] pb-8 pt-6 text-sm text-[#9db0d8] md:w-[calc(100%-2rem)]">
        <p>&copy; {new Date().getFullYear()} Campus Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
