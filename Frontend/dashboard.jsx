const { useEffect, useMemo, useState } = React;

const API_HOST = window.location.hostname || "127.0.0.1";
const API_BASE = `http://${API_HOST}:4000/api`;

const MOCK_EVENTS = [
  {
    id: 1,
    title: "CodeWars Programming Contest",
    department: "CSE",
    eventType: "Coding",
    date: "2026-04-15",
    time: "10:00 AM",
    location: "CSE Lab 1",
    description: "Annual programming competition for all students",
    image: "assets/events/coding.svg"
  },
  {
    id: 2,
    title: "Marketing Strategy Workshop",
    department: "MBA",
    eventType: "Marketing",
    date: "2026-04-16",
    time: "2:00 PM",
    location: "MBA Conference Hall",
    description: "Learn digital marketing strategies and techniques",
    image: "assets/events/marketing.svg"
  },
  {
    id: 3,
    title: "Bridge Design Hackathon",
    department: "Civil",
    eventType: "Coding",
    date: "2026-04-17",
    time: "9:00 AM",
    location: "Civil Engineering Building",
    description: "Design and simulate bridge structures",
    image: "assets/events/civil.svg"
  },
  {
    id: 4,
    title: "Public Speaking Championship",
    department: "All",
    eventType: "Public Speaking",
    date: "2026-04-18",
    time: "3:00 PM",
    location: "Main Auditorium",
    description: "Inter-department public speaking competition",
    image: "assets/events/speaking.svg"
  },
  {
    id: 5,
    title: "Crop Yield Optimization Seminar",
    department: "Agriculture",
    eventType: "Seminar",
    date: "2026-04-19",
    time: "11:00 AM",
    location: "Agriculture Department",
    description: "Modern techniques for maximizing crop yield",
    image: "assets/events/agriculture.svg"
  },
  {
    id: 6,
    title: "Annual Cultural Fest",
    department: "All",
    eventType: "Cultural",
    date: "2026-04-20",
    time: "6:00 PM",
    location: "Campus Ground",
    description: "Celebrate different cultures with music, dance, and food",
    image: "assets/events/cultural.svg"
  },
  {
    id: 7,
    title: "Database Design Challenge",
    department: "CSE",
    eventType: "Coding",
    date: "2026-04-21",
    time: "1:00 PM",
    location: "CSE Lab 2",
    description: "Design efficient database schemas",
    image: "assets/events/coding.svg"
  },
  {
    id: 8,
    title: "Supply Chain Management Workshop",
    department: "MBA",
    eventType: "Workshop",
    date: "2026-04-22",
    time: "10:00 AM",
    location: "MBA Block",
    description: "Optimize supply chain operations",
    image: "assets/events/workshop.svg"
  },
  {
    id: 9,
    title: "Soil Conservation Talk",
    department: "Agriculture",
    eventType: "Seminar",
    date: "2026-04-23",
    time: "2:00 PM",
    location: "Agriculture Auditorium",
    description: "Sustainable soil management practices",
    image: "assets/events/seminar.svg"
  },
  {
    id: 10,
    title: "Structural Analysis Workshop",
    department: "Civil",
    eventType: "Workshop",
    date: "2026-04-24",
    time: "11:00 AM",
    location: "Civil Building",
    description: "Learn advanced structural analysis techniques",
    image: "assets/events/civil.svg"
  }
];

const DEPARTMENTS = ["All", "CSE", "Civil", "MBA", "Agriculture"];
const EVENT_TYPES = ["All", "Coding", "Marketing", "Public Speaking", "Cultural", "Workshop", "Seminar"];

function getFallbackEventImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#eff7ff" />
          <stop offset="100%" stop-color="#dbeeff" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#g)" />
      <rect x="0" y="280" width="600" height="120" fill="#c8dced" />
      <circle cx="80" cy="70" r="45" fill="#149a8e" fill-opacity="0.18" />
      <circle cx="530" cy="330" r="60" fill="#1f3149" fill-opacity="0.1" />
      <rect x="170" y="120" width="260" height="150" rx="16" fill="#f4f9ff" stroke="#b6ccdf" />
      <circle cx="230" cy="175" r="18" fill="#149a8e" fill-opacity="0.7" />
      <rect x="260" y="160" width="130" height="10" rx="5" fill="#7e9ab4" />
      <rect x="260" y="182" width="95" height="10" rx="5" fill="#a2b8cd" />
      <rect x="205" y="215" width="190" height="12" rx="6" fill="#d7e5f2" />
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function DashboardPage() {
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
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedEventType, setSelectedEventType] = useState("All");
  const [viewMode, setViewMode] = useState("grid");

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
        if (mounted) {
          setUser(data.user || {});
          localStorage.setItem("cc_user", JSON.stringify(data.user || {}));
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

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter(event => {
      const deptMatch = selectedDept === "All" || event.department === selectedDept || event.department === "All";
      const typeMatch = selectedEventType === "All" || event.eventType === selectedEventType;
      return deptMatch && typeMatch;
    });
  }, [selectedDept, selectedEventType]);

  const displayName = useMemo(() => {
    const first = (user.firstName || "").trim();
    const last = (user.lastName || "").trim();
    const fallback = (user.username || "student").trim();
    return `${first} ${last}`.trim() || fallback;
  }, [user.firstName, user.lastName, user.username]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning";
    }
    if (hour < 18) {
      return "Good afternoon";
    }
    return "Good evening";
  }, []);

  function signOut() {
    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_user");
    window.location.href = "signin.html";
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(140deg,#f9fcff,#e9f4ff)] p-3 md:p-6">
        <div className="mx-auto max-w-[1200px] rounded-3xl border border-[#cfe0ee] bg-[linear-gradient(180deg,#ffffff,#f5faff)] px-5 py-8 text-[#5a6f86] shadow-[0_16px_36px_rgba(30,53,79,0.1)] md:px-8">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(140deg,#f9fcff,#e9f4ff)] flex flex-col">
      <header className="bg-[linear-gradient(180deg,#ffffff,#f4faff)] border-b border-[#cfe0ee] shadow-[0_4px_12px_rgba(30,53,79,0.08)]">
        <div className="mx-auto max-w-[1400px] px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <img src="campus-connect-logo.svg" alt="Campus Connect" className="h-14 w-auto md:h-16" />
            </div>
            <div className="flex flex-1 flex-wrap justify-center gap-2 md:gap-3">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    selectedDept === dept
                      ? "bg-[#0e8f84] text-white shadow-[0_4px_12px_rgba(14,143,132,0.3)]"
                      : "bg-[#e9f4ff] text-[#1f3149] border border-[#d5e2ef] hover:bg-[#d5e2ef]"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-xl border border-[#c9d8e7] bg-[#ffffff] px-4 py-2 text-sm font-semibold text-[#1f3149] transition hover:border-[#0ea59699] hover:text-[#0e8f84]"
            >
              Sign out
            </button>
          </div>
        </div>
        </header>
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-5 py-8 md:px-8">
        <section className="animate-fadeUp rounded-3xl border border-[#cfe0ee] bg-[linear-gradient(180deg,#ffffff,#f5faff)] px-5 py-6 shadow-[0_16px_36px_rgba(30,53,79,0.1)] md:px-8 md:py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#149a8e]">{greeting}</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-[#1a2a3d] md:text-5xl">
            {displayName}
          </h1>
        </section>

        <div className="mt-12 mb-8">
          <h2 className="text-lg font-semibold text-[#1f3149] mb-4">Event Categories</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {EVENT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedEventType(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  selectedEventType === type
                    ? "bg-[#149a8e] text-white"
                    : "bg-[#e9f4ff] text-[#5a6f86] border border-[#d5e2ef] hover:bg-[#d5e2ef]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              viewMode === "grid"
                ? "bg-[#0e8f84] text-white"
                : "bg-[#e9f4ff] text-[#1f3149] border border-[#d5e2ef]"
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              viewMode === "list"
                ? "bg-[#0e8f84] text-white"
                : "bg-[#e9f4ff] text-[#1f3149] border border-[#d5e2ef]"
            }`}
          >
            List View
          </button>
        </div>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#5a6f86] text-lg">No events found for the selected filters.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="rounded-2xl border border-[#d5e2ef] bg-[linear-gradient(180deg,#ffffff,#f7fbff)] overflow-hidden shadow-[0_4px_12px_rgba(30,53,79,0.08)] hover:shadow-[0_8px_24px_rgba(30,53,79,0.12)] transition"
              >
                <img
                  src={event.image || getFallbackEventImage()}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackEventImage();
                  }}
                />
                <div className="p-4">
                  <div className="flex gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-[#d5e8e3] text-[#0e8f84] font-semibold">
                      {event.department}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#e9f4ff] text-[#1f3149] font-semibold">
                      {event.eventType}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1f3149] mb-2">{event.title}</h3>
                  <p className="text-sm text-[#5a6f86] mb-4">{event.description}</p>
                  <div className="space-y-2 text-sm text-[#5f748a]">
                    <p>📅 {event.date}</p>
                    <p>🕐 {event.time}</p>
                    <p>📍 {event.location}</p>
                  </div>
                  <button className="mt-4 w-full bg-[#0e8f84] hover:bg-[#0d7a6e] text-white py-2 rounded-lg font-semibold transition">
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="rounded-2xl border border-[#d5e2ef] bg-[linear-gradient(180deg,#ffffff,#f7fbff)] p-6 flex gap-6 shadow-[0_4px_12px_rgba(30,53,79,0.08)] hover:shadow-[0_8px_24px_rgba(30,53,79,0.12)] transition"
              >
                <img
                  src={event.image || getFallbackEventImage()}
                  alt={event.title}
                  className="w-40 h-40 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackEventImage();
                  }}
                />
                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-[#d5e8e3] text-[#0e8f84] font-semibold">
                      {event.department}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#e9f4ff] text-[#1f3149] font-semibold">
                      {event.eventType}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#1f3149] mb-2">{event.title}</h3>
                  <p className="text-[#5a6f86] mb-4">{event.description}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-[#5f748a] mb-4">
                    <p>📅 {event.date}</p>
                    <p>🕐 {event.time}</p>
                    <p>📍 {event.location}</p>
                  </div>
                  <button className="bg-[#0e8f84] hover:bg-[#0d7a6e] text-white px-6 py-2 rounded-lg font-semibold transition">
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer className="bg-[#1f3149] text-[#c9d8e7] border-t border-[#2a3f57] mt-12">
        <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-[#f3f7ff] font-semibold mb-4">About Campus Connect</h4>
              <p className="text-sm">Connect with campus events, build networks, and grow your skills.</p>
            </div>
            <div>
              <h4 className="text-[#f3f7ff] font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#0e8f84] transition">Home</a></li>
                <li><a href="#" className="hover:text-[#0e8f84] transition">Events</a></li>
                <li><a href="#" className="hover:text-[#0e8f84] transition">Departments</a></li>
                <li><a href="#" className="hover:text-[#0e8f84] transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#f3f7ff] font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#0e8f84] transition">FAQ</a></li>
                <li><a href="#" className="hover:text-[#0e8f84] transition">Help Center</a></li>
                <li><a href="#" className="hover:text-[#0e8f84] transition">Report Issue</a></li>
                <li><a href="#" className="hover:text-[#0e8f84] transition">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#f3f7ff] font-semibold mb-4">Connect With Us</h4>
              <p className="text-sm mb-3">Follow our social media for updates</p>
              <div className="flex gap-3">
                <a href="#" className="text-[#c9d8e7] hover:text-[#0e8f84] transition">📘</a>
                <a href="#" className="text-[#c9d8e7] hover:text-[#0e8f84] transition">🐦</a>
                <a href="#" className="text-[#c9d8e7] hover:text-[#0e8f84] transition">📷</a>
                <a href="#" className="text-[#c9d8e7] hover:text-[#0e8f84] transition">💼</a>
              </div>
            </div>
          </div>
          <div className="border-t border-[#2a3f57] pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-[#8a9ab3]">
              <p>&copy; 2026 Campus Connect. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-[#0e8f84] transition">Privacy Policy</a>
                <a href="#" className="hover:text-[#0e8f84] transition">Terms of Service</a>
                <a href="#" className="hover:text-[#0e8f84] transition">Cookie Policy</a>
              </div>
            </div>
          </div>
      </div>
      </footer>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<DashboardPage />);
