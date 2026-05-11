const { useEffect, useState } = React;

const API_HOST = window.location.hostname || "127.0.0.1";
const API_BASE = `http://${API_HOST}:4000/api`;
const SETTINGS_KEY = "cc_user_settings";
const DEPARTMENTS = ["All", "CSE", "Civil", "MBA", "Agriculture"];
const NAV_ITEMS = [
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "accessibility", label: "Accessibility" },
  { id: "privacy", label: "Privacy" },
  { id: "event-behavior", label: "Event behavior" },
  { id: "security", label: "Security" },
  { id: "data-account", label: "Data & account" }
];

function getDefaultSettings() {
  return {
    notifications: {
      emailAnnouncements: true,
      smsAlerts: false,
      inAppAlerts: true,
      reminderLeadTime: "1 day",
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00"
    },
    appearance: {
      theme: "system",
      spacing: "comfortable",
      reduceMotion: false,
      highContrast: false,
      fontScale: "100"
    },
    privacy: {
      profileVisibility: "campus",
      showPhone: false,
      showDepartment: true,
      showYear: true,
      showActivity: true
    },
    eventBehavior: {
      defaultDepartment: "All",
      defaultViewMode: "grid",
      autoSaveViewed: true,
      openRegistrationInNewTab: false
    },
    accessibility: {
      reduceMotion: false,
      highContrast: false
    },
    security: {
      twoFactor: false
    }
  };
}

function mergeSettings(defaults, stored) {
  return {
    notifications: { ...defaults.notifications, ...(stored.notifications || {}) },
    appearance: { ...defaults.appearance, ...(stored.appearance || {}) },
    privacy: { ...defaults.privacy, ...(stored.privacy || {}) },
    eventBehavior: { ...defaults.eventBehavior, ...(stored.eventBehavior || {}) },
    accessibility: { ...defaults.accessibility, ...(stored.accessibility || {}) },
    security: { ...defaults.security, ...(stored.security || {}) }
  };
}

function readSettings() {
  const defaults = getDefaultSettings();

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw);
    return mergeSettings(defaults, parsed || {});
  } catch (_error) {
    return defaults;
  }
}

function SettingsPage() {
  const token = localStorage.getItem("cc_token");
  const [user, setUser] = useState(() => {
    const rawUser = localStorage.getItem("cc_user");
    try {
      return rawUser ? JSON.parse(rawUser) : {};
    } catch (_error) {
      return {};
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(readSettings);
  const [activeSection, setActiveSection] = useState("notifications");
  const [saveMessage, setSaveMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  if (!token) {
    window.location.href = "signin.html";
    return null;
  }

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        const data = await response.json();
        const normalizedType = String(data?.user?.accountType || "").toLowerCase();

        if (normalizedType === "organizer") {
          window.location.href = "organiser.html";
          return;
        }

        if (mounted) {
          const nextUser = data.user || {};
          setUser(nextUser);
          localStorage.setItem("cc_user", JSON.stringify(nextUser));
        }
      } catch (_error) {
        localStorage.removeItem("cc_token");
        localStorage.removeItem("cc_user");
        window.location.href = "signin.html";
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    window.CampusConnectTheme?.applyThemePreference?.(settings.appearance.theme);
    document.documentElement.dataset.ccSpacing = settings.appearance.spacing;
    document.documentElement.dataset.ccReduceMotion = settings.accessibility.reduceMotion ? "true" : "false";
    document.documentElement.dataset.ccHighContrast = settings.accessibility.highContrast ? "true" : "false";
    document.body.style.fontSize = `${settings.appearance.fontScale}%`;

    return () => {
      document.body.style.fontSize = "";
      document.documentElement.dataset.ccTheme = "";
      document.documentElement.dataset.ccSpacing = "";
      document.documentElement.dataset.ccReduceMotion = "";
      document.documentElement.dataset.ccHighContrast = "";
    };
  }, [settings.appearance.theme, settings.appearance.spacing, settings.appearance.fontScale, settings.accessibility.reduceMotion, settings.accessibility.highContrast]);

  const shellClasses = settings.appearance.theme === "dark"
    ? "relative min-h-screen overflow-hidden flex flex-col bg-[radial-gradient(circle_at_top_left,#16263a_0%,#0f1724_55%,#09111c_100%)] text-[#e8eef7]"
    : "relative min-h-screen overflow-hidden flex flex-col bg-[radial-gradient(circle_at_top_left,#f7fbff_0%,#eef6ff_36%,#e9f4ff_100%)] text-[#1f3149]";

  const cardClasses = settings.appearance.theme === "dark"
    ? "rounded-[2rem] border border-white/10 bg-[#111c2d]/88 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm"
    : "rounded-[2rem] border border-[#d7e5f1] bg-white/80 shadow-[0_18px_40px_rgba(30,53,79,0.08)] backdrop-blur-sm";

  const surfaceClasses = settings.appearance.theme === "dark"
    ? "rounded-2xl border border-white/10 bg-white/5"
    : "rounded-2xl border border-[#dbe8f3] bg-[#f9fcff]";

  const sectionLabelClasses = settings.appearance.theme === "dark" ? "text-[#8edfd8]" : "text-[#149a8e]";
  const titleClasses = settings.appearance.theme === "dark" ? "text-[#f4f8fc]" : "text-[#16263a]";
  const bodyTextClasses = settings.appearance.theme === "dark" ? "text-[#b8c7da]" : "text-[#5a6f86]";
  const inputClasses = settings.appearance.theme === "dark"
    ? "mt-3 w-full rounded-xl border border-white/10 bg-[#0b1320] px-3 py-2 text-sm text-[#f4f8fc] outline-none ring-[#7ee6d9] focus:ring"
    : "mt-3 w-full rounded-xl border border-[#cfe0ee] bg-white px-3 py-2 text-sm text-[#1a2a3d] outline-none ring-[#149a8e] focus:ring";

  function updateSection(section, name, value) {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
    setSaveMessage("");
  }

  function saveSettings(event) {
    event.preventDefault();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaveMessage("Settings saved successfully.");
  }

  function resetSettings() {
    const defaults = getDefaultSettings();
    setSettings(defaults);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
    setSaveMessage("Settings reset to defaults.");
  }

  function exportSettings() {
    const payload = {
      user,
      settings,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "campus-connect-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    setSaveMessage("Settings export downloaded.");
  }

  function clearSavedPreferences() {
    const defaults = getDefaultSettings();
    setSettings(defaults);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
    setSaveMessage("Saved preferences cleared.");
  }

  function handlePasswordInput(event) {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setSecurityMessage("");
  }

  function handlePasswordSave(event) {
    event.preventDefault();

    if (!passwordForm.currentPassword.trim() || !passwordForm.newPassword.trim()) {
      setSecurityMessage("Fill in the current and new password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSecurityMessage("New password and confirmation do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setSecurityMessage("New password must be at least 6 characters long.");
      return;
    }

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setSecurityMessage("Password updated locally. Connect this to the backend when ready.");
  }

  function toggleTwoFactor() {
    updateSection("security", "twoFactor", !settings.security.twoFactor);
    setSecurityMessage(settings.security.twoFactor ? "Two-factor authentication turned off." : "Two-factor authentication turned on.");
  }

  function deleteAccount() {
    const confirmed = window.confirm("Delete this account from this browser and sign out now?");
    if (!confirmed) {
      return;
    }

    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_user");
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem("cc_profile_extra");
    window.location.href = "signin.html";
  }

  function goToDashboard() {
    window.location.href = "dashboard.html";
  }

  function goToProfile() {
    window.location.href = "profile.html";
  }

  function signOut() {
    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_user");
    window.location.href = "signin.html";
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f7fbff_0%,#eef6ff_36%,#e9f4ff_100%)] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1400px] rounded-3xl border border-[#d7e5f1] bg-white/85 p-8 text-[#5a6f86] shadow-[0_18px_40px_rgba(30,53,79,0.08)] backdrop-blur-sm">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className={shellClasses}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0))]" />
      <header className="relative z-30 border-b border-[#d7e5f1] bg-white/80 backdrop-blur-md shadow-[0_10px_30px_rgba(30,53,79,0.06)]">
        <div className="mx-auto max-w-[1400px] px-5 py-3 md:px-8 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sectionLabelClasses}`}>Account Settings</p>
              <img src="campus-connect-logo.svg" alt="Campus Connect" className="mt-2 h-12 w-auto origin-left scale-105 md:h-14 md:scale-110" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={goToDashboard}
                className="rounded-full border border-[#c8d9ea] bg-white px-4 py-2 text-sm font-semibold text-[#1f3149] transition hover:bg-[#f4f8ff]"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={goToProfile}
                className="rounded-full border border-[#c8d9ea] bg-white px-4 py-2 text-sm font-semibold text-[#1f3149] transition hover:bg-[#f4f8ff]"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-[#f4ccc8] bg-[#fff5f4] px-4 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe9e7]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-0 mx-auto w-full max-w-[1400px] flex-1 px-5 py-8 md:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-72 lg:shrink-0">
            <div className={`${cardClasses} sticky top-6 animate-fadeUp p-4 md:p-5`}>
              <div className="mb-4">
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sectionLabelClasses}`}>Settings Menu</p>
                <h2 className={`mt-2 font-display text-2xl font-bold ${titleClasses}`}>Choose a section</h2>
              </div>
              <nav className="space-y-2" aria-label="Settings sections">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      activeSection === item.id
                        ? "border-[#149a8e] bg-[#149a8e]/10 text-[#149a8e]"
                        : settings.appearance.theme === "dark"
                          ? "border-white/10 bg-white/5 text-[#e8eef7] hover:bg-white/10"
                          : "border-[#dbe8f3] bg-[#f9fcff] text-[#1f3149] hover:bg-white"
                    }`}
                    aria-pressed={activeSection === item.id}
                  >
                    <span>{item.label}</span>
                    <span className={activeSection === item.id ? "text-[#149a8e]" : sectionLabelClasses}>→</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 mt-2 flex flex-wrap gap-2 lg:hidden">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeSection === item.id
                      ? "border-[#149a8e] bg-[#149a8e]/10 text-[#149a8e]"
                      : settings.appearance.theme === "dark"
                        ? "border-white/10 bg-white/5 text-[#e8eef7] hover:bg-white/10"
                        : "border-[#c8d9ea] bg-white text-[#1f3149] hover:bg-[#f4f8ff]"
                  }`}
                  aria-pressed={activeSection === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={saveSettings} className={`${cardClasses} animate-fadeUp px-6 py-7 md:px-10 md:py-10`}>
          <section id="notifications" className={`${activeSection === "notifications" ? "block" : "hidden"} space-y-4`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sectionLabelClasses}`}>Notifications</p>
              <h3 className={`mt-2 font-display text-2xl font-bold ${titleClasses}`}>Alert preferences</h3>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Email announcements</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Get updates for featured events and campus news.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailAnnouncements}
                  onChange={(e) => updateSection("notifications", "emailAnnouncements", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>SMS alerts</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Send urgent reminders to your phone number when available.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.smsAlerts}
                  onChange={(e) => updateSection("notifications", "smsAlerts", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>In-app alerts</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Show event and account updates inside the app.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.inAppAlerts}
                  onChange={(e) => updateSection("notifications", "inAppAlerts", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Reminder timing</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Choose when event reminders should arrive.</p>
              <select
                value={settings.notifications.reminderLeadTime}
                onChange={(e) => updateSection("notifications", "reminderLeadTime", e.target.value)}
                className={inputClasses}
              >
                <option value="30 minutes">30 minutes before</option>
                <option value="1 hour">1 hour before</option>
                <option value="3 hours">3 hours before</option>
                <option value="1 day">1 day before</option>
              </select>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Quiet hours</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Mute non-essential notifications during a time window.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.quietHoursEnabled}
                  onChange={(e) => updateSection("notifications", "quietHoursEnabled", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
              <div className="mt-4 flex flex-col gap-4 md:flex-row">
                <label className="flex-1">
                  <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${sectionLabelClasses}`}>Start</span>
                  <input
                    type="time"
                    value={settings.notifications.quietHoursStart}
                    onChange={(e) => updateSection("notifications", "quietHoursStart", e.target.value)}
                    className={inputClasses}
                  />
                </label>
                <label className="flex-1">
                  <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${sectionLabelClasses}`}>End</span>
                  <input
                    type="time"
                    value={settings.notifications.quietHoursEnd}
                    onChange={(e) => updateSection("notifications", "quietHoursEnd", e.target.value)}
                    className={inputClasses}
                  />
                </label>
              </div>
            </div>
          </section>

          <section id="appearance" className={`${activeSection === "appearance" ? "block" : "hidden"} space-y-4`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sectionLabelClasses}`}>Appearance</p>
              <h3 className={`mt-2 font-display text-2xl font-bold ${titleClasses}`}>Look and feel</h3>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Theme</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Choose light, dark, or system theme.</p>
              <select
                value={settings.appearance.theme}
                onChange={(e) => updateSection("appearance", "theme", e.target.value)}
                className={inputClasses}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Spacing density</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Adjust whether cards feel compact or roomy.</p>
              <select
                value={settings.appearance.spacing}
                onChange={(e) => updateSection("appearance", "spacing", e.target.value)}
                className={inputClasses}
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Font size</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Scale text for easier reading.</p>
              <select
                value={settings.appearance.fontScale}
                onChange={(e) => updateSection("appearance", "fontScale", e.target.value)}
                className={inputClasses}
              >
                <option value="90">Small</option>
                <option value="100">Default</option>
                <option value="110">Large</option>
                <option value="120">Extra large</option>
              </select>
            </div>
          </section>

          <section id="accessibility" className={`${activeSection === "accessibility" ? "block" : "hidden"} space-y-4`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sectionLabelClasses}`}>Accessibility</p>
              <h3 className={`mt-2 font-display text-2xl font-bold ${titleClasses}`}>Comfort controls</h3>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Reduce motion</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Minimize animated transitions and movement.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.accessibility.reduceMotion}
                  onChange={(e) => updateSection("accessibility", "reduceMotion", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>High contrast</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Boost contrast for better readability.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.accessibility.highContrast}
                  onChange={(e) => updateSection("accessibility", "highContrast", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>
          </section>

          <section id="privacy" className={`${activeSection === "privacy" ? "block" : "hidden"} space-y-4`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sectionLabelClasses}`}>Privacy</p>
              <h3 className={`mt-2 font-display text-2xl font-bold ${titleClasses}`}>Profile visibility</h3>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Who can view your profile</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Control profile visibility across the campus app.</p>
              <select
                value={settings.privacy.profileVisibility}
                onChange={(e) => updateSection("privacy", "profileVisibility", e.target.value)}
                className={inputClasses}
              >
                <option value="campus">Campus users</option>
                <option value="organizers">Organizers only</option>
                <option value="private">Only me</option>
              </select>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Show phone number</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Allow your phone number to appear on your profile.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.showPhone}
                  onChange={(e) => updateSection("privacy", "showPhone", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Show department</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Display your department on your public profile.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.showDepartment}
                  onChange={(e) => updateSection("privacy", "showDepartment", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Show year / section</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Keep academic details visible on your profile.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.showYear}
                  onChange={(e) => updateSection("privacy", "showYear", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Show activity status</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Let others see whether you are active in the app.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.showActivity}
                  onChange={(e) => updateSection("privacy", "showActivity", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>
          </section>

          <section id="event-behavior" className={`${activeSection === "event-behavior" ? "block" : "hidden"} space-y-4`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sectionLabelClasses}`}>Event behavior</p>
              <h3 className={`mt-2 font-display text-2xl font-bold ${titleClasses}`}>Default dashboard choices</h3>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Default department filter</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Pick the department that opens first on the dashboard.</p>
              <select
                value={settings.eventBehavior.defaultDepartment}
                onChange={(e) => updateSection("eventBehavior", "defaultDepartment", e.target.value)}
                className={inputClasses}
              >
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Default dashboard layout</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Choose the view mode the dashboard should open with.</p>
              <select
                value={settings.eventBehavior.defaultViewMode}
                onChange={(e) => updateSection("eventBehavior", "defaultViewMode", e.target.value)}
                className={inputClasses}
              >
                <option value="grid">Grid view</option>
                <option value="list">List view</option>
              </select>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Auto-save viewed events</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Remember recently viewed events on this device.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.eventBehavior.autoSaveViewed}
                  onChange={(e) => updateSection("eventBehavior", "autoSaveViewed", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Open registrations in a new tab</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Keep the dashboard open when registering for an event.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.eventBehavior.openRegistrationInNewTab}
                  onChange={(e) => updateSection("eventBehavior", "openRegistrationInNewTab", e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>
          </section>

          <section id="security" className={`${activeSection === "security" ? "block" : "hidden"} space-y-4`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sectionLabelClasses}`}>Security</p>
              <h3 className={`mt-2 font-display text-2xl font-bold ${titleClasses}`}>Account protection</h3>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <p className={`text-sm font-semibold ${titleClasses}`}>Two-factor authentication</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>Require a second step when signing in on new devices.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactor}
                  onChange={toggleTwoFactor}
                  className="h-5 w-5 shrink-0 accent-[#0e8f84]"
                />
              </div>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm font-semibold ${titleClasses}`}>Change password</p>
                  <p className={`mt-1 text-xs ${bodyTextClasses}`}>This is a local form until the backend password endpoint is connected.</p>
                </div>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInput}
                  placeholder="Current password"
                  className={inputClasses}
                />
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInput}
                  placeholder="New password"
                  className={inputClasses}
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInput}
                  placeholder="Confirm new password"
                  className={inputClasses}
                />
                <button
                  type="button"
                  onClick={handlePasswordSave}
                  className="rounded-full bg-[#0e8f84] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(14,143,132,0.24)] transition hover:bg-[#0d7a6e]"
                >
                  Update password
                </button>
              </div>
            </div>

            {securityMessage ? (
              <p className="rounded-xl bg-[#ecf8f6] px-3 py-2 text-sm font-medium text-[#0f766e]">{securityMessage}</p>
            ) : null}
          </section>

          <section id="data-account" className={`${activeSection === "data-account" ? "block" : "hidden"} space-y-4`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${sectionLabelClasses}`}>Data and account</p>
              <h3 className={`mt-2 font-display text-2xl font-bold ${titleClasses}`}>Manage saved data</h3>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Export your settings</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Download your profile and settings as a JSON file.</p>
              <button
                type="button"
                onClick={exportSettings}
                className="mt-3 rounded-full border border-[#c8d9ea] bg-white px-4 py-2 text-sm font-semibold text-[#1f3149] transition hover:bg-[#f4f8ff]"
              >
                Export data
              </button>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Clear saved preferences</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Reset all settings in this browser back to defaults.</p>
              <button
                type="button"
                onClick={clearSavedPreferences}
                className="mt-3 rounded-full border border-[#c8d9ea] bg-white px-4 py-2 text-sm font-semibold text-[#1f3149] transition hover:bg-[#f4f8ff]"
              >
                Clear preferences
              </button>
            </div>

            <div className={`${surfaceClasses} p-4 md:p-5`}>
              <p className={`text-sm font-semibold ${titleClasses}`}>Delete account from this device</p>
              <p className={`mt-1 text-xs ${bodyTextClasses}`}>Remove your login and saved data from this browser session.</p>
              <button
                type="button"
                onClick={deleteAccount}
                className="mt-3 rounded-full border border-[#f4ccc8] bg-[#fff5f4] px-4 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe9e7]"
              >
                Delete account
              </button>
            </div>
          </section>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e6eef6] pt-4">
            <button
              type="button"
              onClick={resetSettings}
              className="rounded-full border border-[#c8d9ea] bg-white px-4 py-2 text-sm font-semibold text-[#1f3149] transition hover:bg-[#f4f8ff]"
            >
              Reset to defaults
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#0e8f84] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(14,143,132,0.24)] transition hover:bg-[#0d7a6e]"
            >
              Save settings
            </button>
          </div>

          {saveMessage ? (
            <p className="mt-4 rounded-xl bg-[#ecf8f6] px-3 py-2 text-sm font-medium text-[#0f766e]">{saveMessage}</p>
          ) : null}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<SettingsPage />);