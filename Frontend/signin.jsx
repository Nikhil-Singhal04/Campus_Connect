const { useState } = React;

function getThemeState() {
  return window.CampusConnectTheme?.getThemeState?.() || { isDark: false, resolved: "light" };
}

function SigninPage() {
  const { isDark } = getThemeState();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "idle" });
  const [isBusy, setIsBusy] = useState(false);

  function handleInput(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setMessage({ text: "Please enter a valid official email.", type: "error" });
      return;
    }

    if (!formData.password.trim()) {
      setMessage({ text: "Password is required.", type: "error" });
      return;
    }

    try {
      setIsBusy(true);
      setMessage({ text: "", type: "idle" });

      const data = await campusAPI.signin(formData.email.trim().toLowerCase(), formData.password);
      setMessage({ text: "Signed in successfully. Redirecting...", type: "success" });
      const normalizedType = String(data?.user?.accountType || "").toLowerCase();
      if (normalizedType === "organizer") {
        window.location.href = "organiser.html";
        return;
      }
      window.location.href = "dashboard.html";
    } catch (_error) {
      setMessage({ text: "Network error while signing in.", type: "error" });
    } finally {
      setIsBusy(false);
    }
  }

  const messageColor =
    message.type === "error"
      ? "text-[#ff8f9d]"
      : message.type === "success"
      ? "text-[#66f0cb]"
      : "text-[#9fb4dd]";

  return (
    <div className={`min-h-screen p-3 md:p-6 ${isDark ? "bg-[linear-gradient(140deg,#09111b,#111d2d)] text-[#e8eef7]" : "bg-[linear-gradient(140deg,#fbfdff,#e9f3ff)] text-[#1f3149]"}`}>
      <div className={`mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-[1100px] overflow-hidden rounded-[2rem] border shadow-[0_22px_52px_rgba(26,49,74,0.12)] lg:grid-cols-2 ${isDark ? "border-white/10 bg-[#0f1724]/95 shadow-[0_22px_52px_rgba(0,0,0,0.3)]" : "border-[#cfdeeb] bg-white"}`}>
        <section className="relative">
          <img
            src="signup-hero.svg"
            alt="Students walking on a university campus"
            className="h-full w-full object-cover"
          />
          <div className={`absolute inset-0 ${isDark ? "bg-[linear-gradient(180deg,rgba(7,11,24,0.22),rgba(7,11,24,0.9))]" : "bg-[linear-gradient(180deg,rgba(7,11,24,0.1),rgba(7,11,24,0.78))]"}`} />
          <div className={`absolute left-0 right-0 top-0 flex min-h-[92px] items-center overflow-hidden px-6 py-2 shadow-[0_7px_0_0_#5fd8cf] md:min-h-[110px] md:px-10 md:shadow-[0_9px_0_0_#5fd8cf] animate-fadeUp ${isDark ? "bg-[#13253a] shadow-[0_7px_0_0_#13253a] md:shadow-[0_9px_0_0_#13253a]" : "bg-[#5fd8cf]"}`}>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(135deg, transparent 0 46%, rgba(255,255,255,0.14) 46% 48%, transparent 48% 100%)",
                backgroundSize: "56px 56px, 120px 120px",
                backgroundPosition: "0 0, 0 0"
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_24%)]" />
            <img
              src="campus-connect-logo.svg"
              alt="Campus Connect"
              className="relative z-10 h-auto w-full max-w-[255px] drop-shadow-[0_12px_28px_rgba(0,0,0,0.28)] md:max-w-[330px]"
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 animate-fadeUp">
            <p className={`text-xs uppercase tracking-[0.14em] ${isDark ? "text-[#9ff4e4]" : "text-[#8df9e3]"}`}>Welcome Back</p>
            <h1 className="mt-2 max-w-[15ch] font-display text-4xl leading-tight md:text-5xl">Continue your campus event journey.</h1>
            <p className={`mt-4 max-w-[50ch] text-sm md:text-base ${isDark ? "text-[#c6d6ea]" : "text-[#d6e6ff]"}`}>
              Access your dashboard, track registrations, and stay connected to campus opportunities.
            </p>
          </div>
        </section>

        <section className={`flex items-center p-5 md:p-8 ${isDark ? "bg-[linear-gradient(180deg,#101a2a,#0d1724)]" : "bg-[linear-gradient(180deg,#ffffff,#f5faff)]"}`}>
          <div className="w-full animate-fadeUp">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className={`font-display text-xl font-semibold ${isDark ? "text-[#eef4fb]" : "text-[#1a2a3d]"}`}>Sign in</p>
                <p className={`text-sm ${isDark ? "text-[#aebfd3]" : "text-[#5f748a]"}`}>Access your account</p>
              </div>
              <a href="index.html" className={`text-sm underline underline-offset-4 ${isDark ? "text-[#89ece0] hover:text-white" : "text-[#0e8f84] hover:text-[#0d7a72]"}`}>Home</a>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label className={`block text-sm ${isDark ? "text-[#dce8f4]" : "text-[#24344a]"}`}>
                Official email
                <input
                  className={`mt-2 w-full rounded-xl border px-3 py-3 outline-none transition focus:ring-2 ${isDark ? "border-white/10 bg-[#0b1320] text-[#eef4fb] focus:border-[#73d6cb] focus:ring-[#73d6cb30]" : "border-[#d2dfeb] bg-[#ffffff] text-[#1a2a3d] focus:border-[#0ea596] focus:ring-[#0ea59630]"}`}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInput}
                  placeholder="you@university.edu"
                />
              </label>

              <label className={`mt-3 block text-sm ${isDark ? "text-[#dce8f4]" : "text-[#24344a]"}`}>
                Password
                <input
                  className={`mt-2 w-full rounded-xl border px-3 py-3 outline-none transition focus:ring-2 ${isDark ? "border-white/10 bg-[#0b1320] text-[#eef4fb] focus:border-[#73d6cb] focus:ring-[#73d6cb30]" : "border-[#d2dfeb] bg-[#ffffff] text-[#1a2a3d] focus:border-[#0ea596] focus:ring-[#0ea59630]"}`}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInput}
                  placeholder="Enter your password"
                />
              </label>

              <button
                type="submit"
                disabled={isBusy}
                className="mt-4 w-full rounded-xl bg-[linear-gradient(135deg,#169f91,#36cfc0)] px-4 py-3 font-semibold text-[#ffffff] shadow-[0_8px_16px_rgba(22,159,145,0.2)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                {isBusy ? "Signing in..." : "Sign In"}
              </button>

              <p className={`mt-3 min-h-[1.25rem] text-sm ${
                message.type === "error"
                  ? "text-[#d64a5e]"
                  : message.type === "success"
                  ? "text-[#16a084]"
                  : "text-[#5f748a]"
              }`}>{message.text}</p>

              <p className={`mt-2 text-sm ${isDark ? "text-[#aebfd3]" : "text-[#5f748a]"}`}>
                New here? <a href="signup.html" className={`underline underline-offset-4 ${isDark ? "text-[#89ece0] hover:text-white" : "text-[#0e8f84] hover:text-[#0d7a72]"}`}>Create account</a>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<SigninPage />);
