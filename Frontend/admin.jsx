const { useMemo, useState } = React;

const API_HOST = window.location.hostname || "127.0.0.1";
const API_BASE = `http://${API_HOST}:4000/api`;

function formatCreatedAt(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "idle", text: "" });

  const totalUsers = useMemo(() => users.length, [users]);

  async function loadUsers(event) {
    event.preventDefault();

    const trimmedKey = adminKey.trim();
    if (!trimmedKey) {
      setMessage({ type: "error", text: "Developer key is required." });
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ type: "idle", text: "" });

      const response = await fetch(`${API_BASE}/admin/users`, {
        method: "GET",
        headers: {
          "x-admin-key": trimmedKey
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setUsers([]);
        setMessage({ type: "error", text: data.message || "Could not load users." });
        return;
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
      setMessage({
        type: "success",
        text: `Loaded ${Array.isArray(data.users) ? data.users.length : 0} registered users.`
      });
    } catch (_error) {
      setUsers([]);
      setMessage({ type: "error", text: "Network error while fetching users." });
    } finally {
      setIsLoading(false);
    }
  }

  const messageColor =
    message.type === "error"
      ? "text-[#d64a5e]"
      : message.type === "success"
      ? "text-[#169f91]"
      : "text-[#5f748a]";

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="mx-auto w-full max-w-[1300px] rounded-[2rem] border border-[#cfdeeb] bg-[linear-gradient(180deg,#ffffff,#f5faff)] p-5 shadow-[0_22px_52px_rgba(26,49,74,0.12)] md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[#1a2a3d] md:text-4xl">Developer Admin</h1>
            <p className="mt-2 text-sm text-[#5f748a]">View registered users (safe fields only, passwords are never returned).</p>
          </div>
          <a
            href="dashboard.html"
            className="rounded-xl border border-[#c9d8e7] bg-white px-4 py-2 text-sm font-semibold text-[#1f3149] transition hover:border-[#0ea59699] hover:text-[#0e8f84]"
          >
            Back to Dashboard
          </a>
        </header>

        <form onSubmit={loadUsers} className="mt-6 flex flex-wrap items-end gap-3">
          <label className="block min-w-[280px] flex-1 text-sm text-[#24344a]">
            Developer admin key
            <input
              className="mt-2 w-full rounded-xl border border-[#d2dfeb] bg-white px-3 py-3 text-[#1a2a3d] outline-none transition focus:border-[#0ea596] focus:ring-2 focus:ring-[#0ea59630]"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter DEV_ADMIN_KEY"
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-[linear-gradient(135deg,#169f91,#36cfc0)] px-5 py-3 font-semibold text-white shadow-[0_8px_16px_rgba(22,159,145,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Loading..." : "Load Users"}
          </button>
        </form>

        <div className={`mt-3 min-h-[1.25rem] text-sm ${messageColor}`}>{message.text}</div>

        <section className="mt-6 rounded-2xl border border-[#d2dfeb] bg-white/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[#1a2a3d]">Registered Users</h2>
            <span className="rounded-full bg-[#e8f7f4] px-3 py-1 text-sm font-semibold text-[#0e8f84]">
              {totalUsers} users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dfeaf5] text-[#4e637a]">
                  <th className="px-3 py-2 font-semibold">ID</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Username</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Department</th>
                  <th className="px-3 py-2 font-semibold">Reg No</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-[#5f748a]" colSpan={8}>
                      No user data loaded yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-[#ecf3fa] text-[#1f3149]">
                      <td className="px-3 py-2">{user.id}</td>
                      <td className="px-3 py-2">{`${user.firstName || ""} ${user.lastName || ""}`.trim() || "-"}</td>
                      <td className="px-3 py-2">{user.email || "-"}</td>
                      <td className="px-3 py-2">{user.username || "-"}</td>
                      <td className="px-3 py-2">{user.accountType || "-"}</td>
                      <td className="px-3 py-2">{user.department || "-"}</td>
                      <td className="px-3 py-2">{user.regNo || "-"}</td>
                      <td className="px-3 py-2">{formatCreatedAt(user.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<AdminPage />);
