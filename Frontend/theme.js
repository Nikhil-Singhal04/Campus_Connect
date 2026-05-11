(function () {
  const SETTINGS_KEY = "cc_user_settings";

  function readStoredSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_error) {
      return {};
    }
  }

  function readThemePreference() {
    const settings = readStoredSettings();
    const theme = String(settings?.appearance?.theme || "system").toLowerCase();
    return theme === "dark" || theme === "light" ? theme : "system";
  }

  function getSystemTheme() {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return "light";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function resolveThemePreference(themePreference) {
    if (themePreference === "dark") return "dark";
    if (themePreference === "light") return "light";
    return getSystemTheme();
  }

  function applyThemePreference(themePreference) {
    if (typeof document === "undefined") {
      return "light";
    }

    const resolvedTheme = resolveThemePreference(themePreference || readThemePreference());
    document.documentElement.dataset.ccTheme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;

    if (document.body) {
      document.body.setAttribute("data-cc-theme", resolvedTheme);
    }

    return resolvedTheme;
  }

  function getThemeState() {
    const preference = readThemePreference();
    const resolved = resolveThemePreference(preference);
    return {
      preference,
      resolved,
      isDark: resolved === "dark"
    };
  }

  window.CampusConnectTheme = {
    SETTINGS_KEY,
    readThemePreference,
    resolveThemePreference,
    applyThemePreference,
    getThemeState
  };

  applyThemePreference();
})();