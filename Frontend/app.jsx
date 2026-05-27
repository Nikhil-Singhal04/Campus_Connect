const { useEffect, useState } = React;

function getThemeState() {
  return window.CampusConnectTheme?.getThemeState?.() || { isDark: false, resolved: "light" };
}

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [contactStatus, setContactStatus] = useState({ type: "idle", text: "" });
  const [contactBusy, setContactBusy] = useState(false);
  const { isDark } = getThemeState();

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const highlights = [
    {
      title: "Smart Event Discovery",
      text: "Explore workshops, clubs, competitions, and talks with curated recommendations."
    },
    {
      title: "Frictionless Registration",
      text: "Register in seconds, track your tickets, and get instant confirmation updates."
    },
    {
      title: "Campus-Wide Engagement",
      text: "Bring students, organizers, and communities together through one unified platform."
    }
  ];

  const shellClasses = isDark
    ? "relative min-h-screen overflow-x-hidden bg-[linear-gradient(140deg,#09111b,#111d2d)] text-[#e8eef7]"
    : "relative min-h-screen overflow-x-hidden bg-[linear-gradient(140deg,#fbfdff,#e9f3ff)] text-[#1f3149]";

  const headerStripClasses = isDark
    ? "bg-[linear-gradient(180deg,#0f1724ea,#111c2dea)] shadow-[0_10px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/8 backdrop-blur"
    : "bg-[linear-gradient(180deg,#ffffffea,#f6fbffea)] shadow-[0_10px_24px_rgba(31,49,71,0.1)] ring-1 ring-[#d8e4ef] backdrop-blur";

  const panelClasses = isDark
    ? "rounded-3xl border border-white/10 bg-[#0f1724]/90 shadow-[0_22px_52px_rgba(0,0,0,0.32)]"
    : "rounded-3xl border border-[#cfdeeb] bg-[linear-gradient(180deg,#ffffff,#f5faff)] shadow-[0_22px_52px_rgba(26,49,74,0.12)]";

  const cardClasses = isDark
    ? "group rounded-2xl border border-white/10 bg-[#111c2d]/90 p-6 text-center shadow-[0_10px_28px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-[#79d9cf]/40 hover:shadow-[0_18px_34px_rgba(0,0,0,0.28)]"
    : "group rounded-2xl border border-[#d2dfeb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)] p-6 text-center shadow-[0_10px_28px_rgba(31,49,71,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#9ed8cf] hover:shadow-[0_18px_34px_rgba(31,49,71,0.14)]";

  const textPrimary = isDark ? "text-[#eef4fb]" : "text-[#1a2a3d]";
  const textSecondary = isDark ? "text-[#aebfd3]" : "text-[#50647d]";
  const textSoft = isDark ? "text-[#8da2bb]" : "text-[#5b7088]";
  const dividerClass = isDark ? "border-white/10" : "border-[#d6e3ef]";

  function handleContactChange(event) {
    const { name, value } = event.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitContact(event) {
    event.preventDefault();
    if (contactBusy) return;

    const payload = {
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      subject: contactForm.subject.trim(),
      message: contactForm.message.trim()
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setContactStatus({ type: "error", text: "Please fill in all fields." });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
      setContactStatus({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    if (payload.message.length > 2000) {
      setContactStatus({ type: "error", text: "Message is too long. Please shorten it." });
      return;
    }

    setContactBusy(true);
    setContactStatus({ type: "idle", text: "" });

    try {
      const apiBase = window.campusAPI?.baseURL || `http://${window.location.hostname || "127.0.0.1"}:4000/api`;
      const response = await fetch(`${apiBase}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || "Could not send message.");
      }

      setContactStatus({ type: "success", text: "Message sent. Our team inbox will receive it shortly." });
    } catch (error) {
      setContactStatus({ type: "error", text: error.message || "Could not send message." });
    } finally {
      setContactBusy(false);
    }
  }

  return (
    <div className={shellClasses}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-24 top-12 h-72 w-72 rounded-full bg-[#7ee7d24d] blur-3xl animate-glowPulse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-20 bottom-16 h-80 w-80 rounded-full bg-[#9dc8ff57] blur-3xl animate-floatSlow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-28 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-[#6ea8ff30] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 [background-image:linear-gradient(rgba(107,130,160,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(107,130,160,0.08)_1px,transparent_1px)] [background-size:42px_42px]"
      />
      <header className="fixed left-0 top-0 z-50 w-full">
        <div className={`${headerStripClasses} transition-all duration-300 ${isScrolled ? (isDark ? "shadow-[0_14px_30px_rgba(0,0,0,0.28)] ring-white/12" : "shadow-[0_14px_30px_rgba(31,49,71,0.16)] ring-[#c7d9ea]") : ""}`}>
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-1 md:px-6 md:py-1.5">
            <a href="index.html" aria-label="Campus Connect Home" className="inline-flex shrink-0 items-center gap-3 overflow-visible">
              <img src="campus-connect-logo.svg" alt="Campus Connect" className="h-14 w-auto origin-left scale-110 rounded-md md:h-16 md:scale-125" />
            </a>

            <nav className={`hidden items-center gap-1 rounded-full p-1 text-sm font-semibold lg:flex ${isDark ? "bg-white/5 text-[#dbe7f4] ring-1 ring-white/10" : "bg-[#ffffffbf] text-[#314860] ring-1 ring-[#dce6f0]"}`}>
              <a href="index.html" className={`rounded-full px-4 py-2 transition ${isDark ? "hover:bg-white/10 hover:text-white" : "hover:bg-[#ecf7f5] hover:text-[#0e8f84]"}`}>Home</a>
              <a href="#events" className={`rounded-full px-4 py-2 transition ${isDark ? "hover:bg-white/10 hover:text-white" : "hover:bg-[#ecf7f5] hover:text-[#0e8f84]"}`}>Events</a>
              <a href="#about" className={`rounded-full px-4 py-2 transition ${isDark ? "hover:bg-white/10 hover:text-white" : "hover:bg-[#ecf7f5] hover:text-[#0e8f84]"}`}>About</a>
              <a href="#contact" className={`rounded-full px-4 py-2 transition ${isDark ? "hover:bg-white/10 hover:text-white" : "hover:bg-[#ecf7f5] hover:text-[#0e8f84]"}`}>Contact</a>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="signin.html"
                className={`inline-flex rounded-lg border px-3 py-2 text-sm font-semibold transition md:px-4 ${isDark ? "border-white/10 bg-white/5 text-[#eef4fb] hover:border-[#73d6cb]/40 hover:text-white" : "border-[#c8d5e3] bg-[#ffffff] text-[#1f3147] hover:border-[#0ea59680] hover:text-[#0e8f84]"}`}
              >
                Sign In
              </a>
              <a
                href="signup.html"
                className="rounded-lg bg-[linear-gradient(135deg,#169f91,#36cfc0)] px-3 py-2 text-sm font-semibold text-[#ffffff] shadow-[0_8px_16px_rgba(22,159,145,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 md:px-4"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto mt-24 w-[calc(100%-1rem)] max-w-[1200px] pb-16 md:mt-28 md:w-[calc(100%-2rem)] md:pb-20">
        <section className={`animate-fadeUp relative overflow-hidden px-6 py-12 text-center md:px-12 md:py-16 ${panelClasses}`}>
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-[26px] border-[#7de4d433]" />
          <div aria-hidden="true" className="pointer-events-none absolute -left-12 bottom-8 h-24 w-24 rounded-full border-[14px] border-[#74a8ff29]" />

          <h1 className={`mx-auto mt-5 max-w-[18ch] font-display text-5xl font-extrabold leading-[1.05] md:text-7xl lg:text-8xl ${textPrimary}`}>
            Discover,
            <span className="bg-[linear-gradient(130deg,#0ea596,#2563eb)] bg-clip-text text-transparent"> Engage</span>,
            <br />
            Belong
          </h1>
          <p className={`mx-auto mt-6 max-w-[62ch] text-base font-medium leading-8 md:text-lg ${textSecondary}`}>
            One professional platform for students and organizers to discover events, register quickly, and build meaningful campus experiences.
          </p>

          <div className={`mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] md:text-sm ${isDark ? "text-[#aebfd3]" : "text-[#3f5f7f]"}`}>
            <span className={`rounded-full border px-3 py-1.5 ${isDark ? "border-white/10 bg-white/5" : "border-[#c9dff5] bg-[#eef6ff]"}`}>Live Event Feed</span>
            <span className={`rounded-full border px-3 py-1.5 ${isDark ? "border-white/10 bg-white/5" : "border-[#bdebe3] bg-[#edfcf7]"}`}>Instant Registrations</span>
            <span className={`rounded-full border px-3 py-1.5 ${isDark ? "border-white/10 bg-white/5" : "border-[#d6ddff] bg-[#f1f3ff]"}`}>Organizer Dashboard</span>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="signup.html"
              className="rounded-xl bg-[linear-gradient(135deg,#169f91,#36cfc0)] px-6 py-3 text-sm font-semibold text-[#ffffff] shadow-[0_12px_24px_rgba(22,159,145,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              Get Started
            </a>
            <a
              href="signin.html"
              className={`rounded-xl border px-6 py-3 text-sm font-semibold shadow-[0_8px_20px_rgba(31,49,71,0.08)] transition hover:-translate-y-0.5 ${isDark ? "border-white/10 bg-white/5 text-[#eef4fb] hover:border-[#73d6cb]/40 hover:text-white" : "border-[#c8d5e3] bg-[#ffffff] text-[#1f3147] hover:border-[#0ea59680] hover:text-[#0e8f84]"}`}
            >
              Sign In
            </a>
          </div>

          <p className={`mt-5 text-sm font-semibold ${textSoft}`}>Trusted by 40+ campuses and 20,000+ students</p>
        </section>

        <section id="events" className="mt-14 text-center">

          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map((item, index) => (
              <article key={item.title} className={cardClasses}>
                <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(140deg,#ddf9f4,#dfeeff)] text-[#137e92]">{index + 1}</span>
                <h3 className={`font-display text-xl font-semibold ${textPrimary}`}>{item.title}</h3>
                <p className={`mt-3 leading-7 ${textSoft}`}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className={`mt-14 p-7 md:p-10 ${panelClasses}`}>
          <div className="grid gap-6 text-center md:grid-cols-2 md:text-left">
            <div className="flex flex-col justify-center">
              <h2 className={`font-display text-3xl font-bold ${textPrimary}`}>Built for modern campuses</h2>
              <p className={`mt-4 leading-8 ${textSoft}`}>
                From orientation to final-year showcases, Campus Connect helps institutions create better event experiences with clarity, speed, and participation insights.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 text-center">
              <div className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-[#d4e0eb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)]"}`}>
                <p className={`text-3xl font-bold ${textPrimary}`}>500+</p>
                <p className={`mt-2 text-sm ${textSoft}`}>Events hosted each term</p>
              </div>
              <div className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-[#d4e0eb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)]"}`}>
                <p className={`text-3xl font-bold ${textPrimary}`}>20K+</p>
                <p className={`mt-2 text-sm ${textSoft}`}>Student registrations</p>
              </div>
              <div className={`rounded-xl border p-4 sm:col-span-2 ${isDark ? "border-white/10 bg-white/5" : "border-[#d4e0eb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)]"}`}>
                <p className={`text-3xl font-bold ${textPrimary}`}>98%</p>
                <p className={`mt-2 text-sm ${textSoft}`}>Average event check-in success rate</p>
              </div>
            </div>
          </div>

          <div className={`my-10 border-t ${dividerClass}`} />

          <div className="text-center">
            <p className={`text-xs font-semibold uppercase tracking-[0.26em] ${textSoft}`}>The brains behind the platform</p>
            <h3 className={`mt-3 font-display text-3xl font-bold ${textPrimary}`}>Meet the Developers</h3>
            <p className={`mx-auto mt-4 max-w-[60ch] leading-7 ${textSoft}`}>
              The passionate creators and designers who built Campus Connect to simplify event discovery and community building.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-3 max-w-[1100px] mx-auto">
              {/* Nikhil Singhal */}
              <div className={`group rounded-2xl border p-6 flex flex-col items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? "border-white/10 bg-[#111c2d]/90 hover:border-[#79d9cf]/40" : "border-[#d2dfeb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)] hover:border-[#9ed8cf]"}`}>
                <div className="relative mb-4">
                  <div className="absolute -inset-0.5 rounded-full bg-[linear-gradient(135deg,#0ea596,#2563eb)] opacity-40 blur group-hover:opacity-80 transition duration-300" />
                  <img
                    src="assets/dev_nikhil.jpg"
                    alt="Nikhil Singhal"
                    className="relative h-24 w-24 rounded-full border-2 border-white/20 object-cover shadow-sm"
                  />
                </div>
                <h4 className={`text-lg font-bold ${textPrimary}`}>Nikhil Singhal</h4>
                <p className="text-sm font-semibold text-[#0ea596] mt-1">Lead Full-Stack Developer</p>
                <p className={`text-xs mt-3 leading-5 text-center ${textSoft}`}>
                  CSE Student passionate about backend systems, database optimization, and sleek user interfaces.
                </p>
                <div className="flex gap-3 mt-4">
                  <a
                    href="https://www.linkedin.com/in/nikhil-singhal04/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full p-2 transition ${isDark ? "bg-white/5 hover:bg-white/10 text-[#c9d8e7] hover:text-white" : "bg-white hover:bg-[#ecf7f5] text-[#314860] hover:text-[#0e8f84] border border-[#cfdeeb]"}`}
                    aria-label="LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.3 8h4.4v14H.3V8zm7.2 0h4.2v1.9h.06c.58-1.1 2-2.26 4.12-2.26 4.4 0 5.22 2.9 5.22 6.66V22h-4.4v-6.8c0-1.62-.03-3.7-2.26-3.7-2.26 0-2.6 1.77-2.6 3.58V22H7.5V8z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/Nikhil-Singhal04"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full p-2 transition ${isDark ? "bg-white/5 hover:bg-white/10 text-[#c9d8e7] hover:text-white" : "bg-white hover:bg-[#ecf7f5] text-[#314860] hover:text-[#0e8f84] border border-[#cfdeeb]"}`}
                    aria-label="GitHub"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </a>
                  {/* <a
                    href="https://www.instagram.com/nikhilsinghal30/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full p-2 transition ${isDark ? "bg-white/5 hover:bg-white/10 text-[#c9d8e7] hover:text-white" : "bg-white hover:bg-[#ecf7f5] text-[#314860] hover:text-[#0e8f84] border border-[#cfdeeb]"}`}
                    aria-label="Instagram"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm11 2a2 2 0 110 4 2 2 0 010-4zm-6 2a6 6 0 110 12 6 6 0 010-12zm0 2.2A3.8 3.8 0 1012 16a3.8 3.8 0 000-7.6z" />
                    </svg>
                  </a> */}
                </div>
              </div>

              {/* Pratik Kumar */}
              <div className={`group rounded-2xl border p-6 flex flex-col items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? "border-white/10 bg-[#111c2d]/90 hover:border-[#79d9cf]/40" : "border-[#d2dfeb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)] hover:border-[#9ed8cf]"}`}>
                <div className="relative mb-4">
                  <div className="absolute -inset-0.5 rounded-full bg-[linear-gradient(135deg,#0ea596,#2563eb)] opacity-40 blur group-hover:opacity-80 transition duration-300" />
                  <img
                    src="assets/pratik.jpeg"
                    alt="Pratik Kumar"
                    className="relative h-24 w-24 rounded-full border-2 border-white/20 object-cover shadow-sm"
                  />
                </div>
                <h4 className={`text-lg font-bold ${textPrimary}`}>Pratik Kumar</h4>
                <p className="text-sm font-semibold text-[#0ea596] mt-1">Frontend Developer</p>
                <p className={`text-xs mt-3 leading-5 text-center ${textSoft}`}>
                  CSE Student passionate about responsive designs, interactive user experiences, and pixel-perfect UIs.
                </p>
                <div className="flex gap-3 mt-4">
                  <a
                    href="https://www.linkedin.com/in/pratik70/?isSelfProfile=false"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full p-2 transition ${isDark ? "bg-white/5 hover:bg-white/10 text-[#c9d8e7] hover:text-white" : "bg-white hover:bg-[#ecf7f5] text-[#314860] hover:text-[#0e8f84] border border-[#cfdeeb]"}`}
                    aria-label="LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.3 8h4.4v14H.3V8zm7.2 0h4.2v1.9h.06c.58-1.1 2-2.26 4.12-2.26 4.4 0 5.22 2.9 5.22 6.66V22h-4.4v-6.8c0-1.62-.03-3.7-2.26-3.7-2.26 0-2.6 1.77-2.6 3.58V22H7.5V8z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/pratik-70/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full p-2 transition ${isDark ? "bg-white/5 hover:bg-white/10 text-[#c9d8e7] hover:text-white" : "bg-white hover:bg-[#ecf7f5] text-[#314860] hover:text-[#0e8f84] border border-[#cfdeeb]"}`}
                    aria-label="GitHub"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Abhishek Dixit */}
              <div className={`group rounded-2xl border p-6 flex flex-col items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? "border-white/10 bg-[#111c2d]/90 hover:border-[#79d9cf]/40" : "border-[#d2dfeb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)] hover:border-[#9ed8cf]"}`}>
                <div className="relative mb-4">
                  <div className="absolute -inset-0.5 rounded-full bg-[linear-gradient(135deg,#0ea596,#2563eb)] opacity-40 blur group-hover:opacity-80 transition duration-300" />
                  <img
                    src="assets/abhishek.jpeg"
                    alt="Abhishek Dixit"
                    className="relative h-24 w-24 rounded-full border-2 border-white/20 object-cover shadow-sm"
                  />
                </div>
                <h4 className={`text-lg font-bold ${textPrimary}`}>Abhishek Dixit</h4>
                <p className="text-sm font-semibold text-[#0ea596] mt-1">Database & DevOps Specialist</p>
                <p className={`text-xs mt-3 leading-5 text-center ${textSoft}`}>
                  CSE Student focusing on containerization, scalable database schema design, and CI/CD pipelines.
                </p>
                <div className="flex gap-3 mt-4">
                  <a
                    href="https://www.linkedin.com/in/abhishek-dixitt-/?isSelfProfile=false"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full p-2 transition ${isDark ? "bg-white/5 hover:bg-white/10 text-[#c9d8e7] hover:text-white" : "bg-white hover:bg-[#ecf7f5] text-[#314860] hover:text-[#0e8f84] border border-[#cfdeeb]"}`}
                    aria-label="LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.3 8h4.4v14H.3V8zm7.2 0h4.2v1.9h.06c.58-1.1 2-2.26 4.12-2.26 4.4 0 5.22 2.9 5.22 6.66V22h-4.4v-6.8c0-1.62-.03-3.7-2.26-3.7-2.26 0-2.6 1.77-2.6 3.58V22H7.5V8z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/AbhishekDixitt18"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full p-2 transition ${isDark ? "bg-white/5 hover:bg-white/10 text-[#c9d8e7] hover:text-white" : "bg-white hover:bg-[#ecf7f5] text-[#314860] hover:text-[#0e8f84] border border-[#cfdeeb]"}`}
                    aria-label="GitHub"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className={`mt-14 p-7 md:p-10 ${panelClasses}`}>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.26em] ${textSoft}`}>Contact</p>
              <h2 className={`mt-3 font-display text-3xl font-bold ${textPrimary}`}>Talk to our team</h2>
              <p className={`mt-3 max-w-[46ch] leading-7 ${textSoft}`}>
                Questions about events, onboarding, or partnerships? We reply within one business day.
              </p>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowContactForm(true)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-white/10 bg-white/5 text-[#eef4fb] hover:border-[#73d6cb]/40 hover:text-white" : "border-[#c8d5e3] bg-[#ffffff] text-[#1f3147] hover:border-[#0ea59680] hover:text-[#0e8f84]"}`}
                >
                  Contact us
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-[#d4e0eb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)]"}`}>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#129c8f]">Email</p>
                  <a href="mailto:nikkhil2019singhal@gmail.com" className={`mt-2 block text-sm font-semibold ${isDark ? "text-[#d9e6f4] hover:text-white" : "text-[#2b435c] hover:text-[#0e8f84]"}`}>
                    nikkhil2019singhal@gmail.com
                  </a>
                </div>
                <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-[#d4e0eb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)]"}`}>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#129c8f]">Phone</p>
                  <a href="tel:+919518049986" className={`mt-2 block text-sm font-semibold ${isDark ? "text-[#d9e6f4] hover:text-white" : "text-[#2b435c] hover:text-[#0e8f84]"}`}>
                    +91 12345 67890
                  </a>
                </div>
                <div className={`rounded-2xl border p-4 sm:col-span-2 ${isDark ? "border-white/10 bg-white/5" : "border-[#d4e0eb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)]"}`}>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#129c8f]">Hours</p>
                  <p className={`mt-2 text-sm font-semibold ${isDark ? "text-[#d9e6f4]" : "text-[#2b435c]"}`}>
                    Mon - Fri, 9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>

            <div>
              {showContactForm ? (
                <form
                  onSubmit={submitContact}
                  className={`rounded-2xl border p-6 ${isDark ? "border-white/10 bg-white/5" : "border-[#d4e0eb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)]"}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${textPrimary}`}>Send a message</h3>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className={`text-sm font-semibold transition ${isDark ? "text-[#aebfd3] hover:text-white" : "text-[#5b7088] hover:text-[#0e8f84]"}`}
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <label className={`text-sm font-semibold ${textPrimary}`}>
                      Full name
                      <input
                        className={`mt-2 w-full rounded-xl border px-3 py-3 text-sm outline-none transition ${isDark ? "border-white/10 bg-[#0b1422] text-[#eef4fb] focus:border-[#6bd7cb] focus:ring-2 focus:ring-[#6bd7cb33]" : "border-[#d2dfeb] bg-[#ffffff] text-[#1a2a3d] focus:border-[#0ea596] focus:ring-2 focus:ring-[#0ea59633]"}`}
                        type="text"
                        name="name"
                        value={contactForm.name}
                        onChange={handleContactChange}
                        placeholder="Your name"
                      />
                    </label>
                    <label className={`text-sm font-semibold ${textPrimary}`}>
                      Email address
                      <input
                        className={`mt-2 w-full rounded-xl border px-3 py-3 text-sm outline-none transition ${isDark ? "border-white/10 bg-[#0b1422] text-[#eef4fb] focus:border-[#6bd7cb] focus:ring-2 focus:ring-[#6bd7cb33]" : "border-[#d2dfeb] bg-[#ffffff] text-[#1a2a3d] focus:border-[#0ea596] focus:ring-2 focus:ring-[#0ea59633]"}`}
                        type="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleContactChange}
                        placeholder="you@domain.com"
                      />
                    </label>
                    <label className={`text-sm font-semibold ${textPrimary}`}>
                      Subject
                      <input
                        className={`mt-2 w-full rounded-xl border px-3 py-3 text-sm outline-none transition ${isDark ? "border-white/10 bg-[#0b1422] text-[#eef4fb] focus:border-[#6bd7cb] focus:ring-2 focus:ring-[#6bd7cb33]" : "border-[#d2dfeb] bg-[#ffffff] text-[#1a2a3d] focus:border-[#0ea596] focus:ring-2 focus:ring-[#0ea59633]"}`}
                        type="text"
                        name="subject"
                        value={contactForm.subject}
                        onChange={handleContactChange}
                        placeholder="How can we help?"
                      />
                    </label>
                    <label className={`text-sm font-semibold ${textPrimary}`}>
                      Message
                      <textarea
                        className={`mt-2 min-h-[140px] w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none transition ${isDark ? "border-white/10 bg-[#0b1422] text-[#eef4fb] focus:border-[#6bd7cb] focus:ring-2 focus:ring-[#6bd7cb33]" : "border-[#d2dfeb] bg-[#ffffff] text-[#1a2a3d] focus:border-[#0ea596] focus:ring-2 focus:ring-[#0ea59633]"}`}
                        name="message"
                        value={contactForm.message}
                        onChange={handleContactChange}
                        placeholder="Write your question..."
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={contactBusy}
                      className="rounded-xl bg-[linear-gradient(135deg,#169f91,#36cfc0)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(22,159,145,0.25)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {contactBusy ? "Sending..." : "Send message"}
                    </button>
                    {contactStatus.text ? (
                      <p className={`text-sm ${contactStatus.type === "success" ? "text-[#0e8f84]" : "text-[#d33a2c]"}`}>
                        {contactStatus.text}
                      </p>
                    ) : null}
                  </div>
                </form>
              ) : (
                <div className={`h-full rounded-2xl border p-6 ${isDark ? "border-white/10 bg-white/5" : "border-[#d4e0eb] bg-[linear-gradient(180deg,#ffffff,#f7fbff)]"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.26em] ${textSoft}`}>Support desk</p>
                  <h3 className={`mt-3 text-xl font-semibold ${textPrimary}`}>We are ready to help</h3>
                  <p className={`mt-3 leading-7 ${textSoft}`}>
                    Share your query and our team will respond within one business day.
                  </p>
                  <ul className={`mt-4 space-y-2 text-sm ${textSoft}`}>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#0ea596]" />
                      Event onboarding and registrations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#0ea596]" />
                      Partnership and support requests
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#0ea596]" />
                      Account or access questions
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(true)}
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#169f91,#36cfc0)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(22,159,145,0.25)] transition hover:-translate-y-0.5 hover:brightness-105"
                  >
                    Get support
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className={`relative z-10 mx-auto mt-16 w-[calc(100%-1rem)] max-w-[1200px] px-6 pb-8 pt-10 text-sm shadow-[0_14px_36px_rgba(31,49,71,0.08)] md:w-[calc(100%-2rem)] md:px-10 ${panelClasses}`}>
        <div className="grid gap-10 md:grid-cols-[2.2fr_1.4fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea596,#36cfc0)] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(22,159,145,0.28)]">
                CC
              </span>
              <div>
                <h3 className={`font-display text-2xl font-semibold ${textPrimary}`}>Campus Connect</h3>
                <p className={`text-[11px] uppercase tracking-[0.26em] ${textSoft}`}>Student-first platform</p>
              </div>
            </div>
            <p className={`mt-4 max-w-[48ch] leading-7 ${textSoft}`}>
              Building a connected campus where students discover events, join communities, and grow together.
            </p>
          </div>

          <div className={`grid gap-8 md:grid-cols-2 md:border-l md:pl-8 ${dividerClass}`}>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${textSoft}`}>Explore</p>
              <nav className={`mt-4 flex flex-col gap-2 text-sm font-semibold ${isDark ? "text-[#d9e6f4]" : "text-[#314860]"}`}>
                <a href="index.html" className="transition hover:text-[#0e8f84]">Home</a>
                <a href="#events" className="transition hover:text-[#0e8f84]">Events</a>
                <a href="#about" className="transition hover:text-[#0e8f84]">About</a>
                <a href="#contact" className="transition hover:text-[#0e8f84]">Contact</a>
              </nav>
            </div>

            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${textSoft}`}>Quick Links</p>
              <nav className={`mt-4 flex flex-col gap-2 text-sm font-semibold ${isDark ? "text-[#d9e6f4]" : "text-[#314860]"}`}>
                <a href="signin.html" className="transition hover:text-[#0e8f84]">Sign In</a>
                <a href="signup.html" className="transition hover:text-[#0e8f84]">Get Started</a>
                <a href="#contact" className="transition hover:text-[#0e8f84]">Support</a>
              </nav>
            </div>
          </div>
        </div>

        <div className={`mt-8 flex flex-col items-center justify-between gap-3 border-t pt-5 text-center md:flex-row ${dividerClass} ${isDark ? "text-[#8da2bb]" : "text-[#6a8097]"}`}>
          <p>&copy; {new Date().getFullYear()} Campus Connect. All rights reserved.</p>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${dividerClass} ${isDark ? "text-[#aebfd3]" : "text-[#566b84]"}`}>
            Trusted by 40+ campuses
          </span>
        </div>
      </footer>
      <ChatbotWidget />
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);