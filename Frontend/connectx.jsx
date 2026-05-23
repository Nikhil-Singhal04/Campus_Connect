const { useState, useEffect, useMemo } = React;

const CLUB_ICON_MAP = {
  coding: '💻',
  design: '🎨',
  entrepreneurship: '🚀',
  cultural: '🎭',
  sports: '⚽',
  agri: '🌾'
};

const DEFAULT_CLUBS = [
  { id: 'coding', label: 'Coding Club', description: 'Algorithms, contests and hackathons.' },
  { id: 'design', label: 'Design & UX', description: 'Workshops and portfolio reviews.' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', description: 'Startup ideas, pitching and mentorship.' },
  { id: 'cultural', label: 'Cultural Club', description: 'Events, performances and festivals.' },
  { id: 'sports', label: 'Sports Club', description: 'Matches, fitness and team activities.' },
  { id: 'agri', label: 'AgriClub', description: 'Agriculture, sustainability and campus farming.' }
];

function normalizeClubId(value) {
  const raw = String(value || '').trim();
  if (raw === 'entre') return 'entrepreneurship';
  if (raw === 'culture') return 'cultural';
  return raw;
}

function normalizeClubRecord(record) {
  if (!record) return null;
  const id = normalizeClubId(record.id);
  if (!id) return null;
  return {
    id,
    label: String(record.name || record.label || id).trim(),
    description: String(record.description || record.desc || '').trim(),
    icon: CLUB_ICON_MAP[id] || '•'
  };
}

function resolveUserStorageId(user) {
  const raw = user?.id || user?.email || user?.username || 'guest';
  return String(raw).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
}

function ConnectXPage() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_user') || 'null');
    } catch {
      return null;
    }
  });

  const displayName = useMemo(() => {
    if (!user) return 'Anonymous';
    return `${(user.firstName || user.username || '').trim()} ${(user.lastName || '').trim()}`.trim() || (user.username || 'student');
  }, [user]);

  const STORAGE_KEY = 'cc_connectx_posts_v1';
  const joinedClubsKey = useMemo(() => `cc_joined_clubs_${resolveUserStorageId(user)}`, [user]);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [selectedView, setSelectedView] = useState('home');
  const [availableClubs, setAvailableClubs] = useState(DEFAULT_CLUBS);
  const [joinedClubs, setJoinedClubs] = useState([]);

  const isDark = window.CampusConnectTheme?.getThemeState?.()?.isDark || false;

  function readExtraProfile(u) {
    try {
      const id = u?.id || u?.email || u?.username || 'guest';
      const raw = localStorage.getItem(`cc_profile_extra_${id}`);
      return raw ? JSON.parse(raw) : {};
    } catch (_e) {
      return {};
    }
  }

  const profileImage = useMemo(() => {
    const extra = readExtraProfile(user || {});
    return String(extra.profileImage || '').trim();
  }, [user?.id, user?.email, user?.username]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (_error) {
      // ignore storage failures
    }
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem(joinedClubsKey, JSON.stringify(joinedClubs));
    } catch (_error) {
      // ignore storage failures
    }
  }, [joinedClubs, joinedClubsKey]);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      try {
        const serverPosts = await campusAPI.getConnectXPosts();
        if (mounted && Array.isArray(serverPosts)) {
          setPosts(serverPosts);
          return;
        }
      } catch (_error) {
        // fall back to local cache
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw && mounted) {
          setPosts(JSON.parse(raw));
        }
      } catch (_error) {
        // ignore parse failures
      }
    }

    loadPosts();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadClubs() {
      try {
        const serverClubs = await campusAPI.getClubs();
        if (mounted && Array.isArray(serverClubs) && serverClubs.length > 0) {
          const normalized = [];
          const seen = new Set();
          for (const club of serverClubs) {
            const entry = normalizeClubRecord(club);
            if (!entry || seen.has(entry.id)) continue;
            seen.add(entry.id);
            normalized.push(entry);
          }
          if (normalized.length > 0) {
            setAvailableClubs(normalized);
          }
        }
      } catch (_error) {
        // use default clubs
      }
    }

    async function loadJoinedClubs() {
      try {
        const serverJoined = await campusAPI.getJoinedClubs();
        if (mounted && Array.isArray(serverJoined)) {
          const nextJoined = [];
          const seen = new Set();
          for (const club of serverJoined) {
            const clubId = normalizeClubId(club?.id || club?.clubId || club);
            if (!clubId || seen.has(clubId)) continue;
            seen.add(clubId);
            nextJoined.push(clubId);
          }
          setJoinedClubs(nextJoined);
          return;
        }
      } catch (_error) {
        // fall back to local cache
      }

      try {
        const raw = localStorage.getItem(joinedClubsKey);
        if (raw && mounted) {
          const parsed = JSON.parse(raw);
          const nextJoined = [];
          const seen = new Set();
          for (const item of Array.isArray(parsed) ? parsed : []) {
            const clubId = normalizeClubId(item);
            if (!clubId || seen.has(clubId)) continue;
            seen.add(clubId);
            nextJoined.push(clubId);
          }
          setJoinedClubs(nextJoined);
        }
      } catch (_error) {
        // ignore parse failures
      }
    }

    loadClubs();
    loadJoinedClubs();

    return () => {
      mounted = false;
    };
  }, [joinedClubsKey]);

  function getClubById(clubId) {
    const normalizedId = normalizeClubId(clubId);
    return availableClubs.find((club) => club.id === normalizedId) || null;
  }

  function getClubLabel(clubId) {
    const club = getClubById(clubId);
    if (club) return club.label;
    const normalizedId = normalizeClubId(clubId);
    return normalizedId || 'Home';
  }

  async function joinClub(clubId) {
    const normalizedId = normalizeClubId(clubId);
    if (!normalizedId) return;

    try {
      await campusAPI.joinClub(normalizedId);
    } catch (_error) {
      // keep the UI usable even if the network fails, but still scope the cache to this user
    }

    setJoinedClubs((prev) => {
      if (prev.includes(normalizedId)) return prev;
      return [...prev, normalizedId];
    });

    setSelectedView(normalizedId);
  }

  function addPost(e) {
    e.preventDefault();
    const t = (text || '').trim();
    if (!t) return;

    const club = selectedView === 'home' || selectedView === 'clubs' ? null : normalizeClubId(selectedView);
    const newPost = {
      id: Date.now(),
      author: displayName,
      text: t,
      club,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };

    campusAPI.createConnectXPost(newPost).then((res) => {
      if (res && res.post) {
        setPosts((prev) => [res.post, ...prev]);
      }
    }).catch(() => {
      setPosts((prev) => [newPost, ...prev]);
    });

    setText('');
  }

  function likePost(id) {
    campusAPI.likeConnectXPost(id).then(() => {
      setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, likes: (post.likes || 0) + 1 } : post)));
    }).catch(() => {
      setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, likes: (post.likes || 0) + 1 } : post)));
    });
  }

  function addComment(id, commentText) {
    const payload = { text: commentText, author: displayName };
    campusAPI.commentConnectXPost(id, payload).then((res) => {
      if (res && res.comment) {
        setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, comments: (post.comments || []).concat(res.comment) } : post)));
      }
    }).catch(() => {
      setPosts((prev) => prev.map((post) => {
        if (post.id !== id) return post;
        const next = { ...post };
        next.comments = (next.comments || []).concat({
          id: Date.now(),
          author: displayName,
          text: commentText,
          createdAt: new Date().toISOString()
        });
        return next;
      }));
    });
  }

  const filtered = posts.filter((post) => {
    const club = normalizeClubId(post.club);
    if (selectedView === 'home') return !club;
    if (selectedView === 'clubs') return false;
    return club === normalizeClubId(selectedView);
  });

  const currentClubLabel = selectedView === 'home'
    ? 'Home'
    : selectedView === 'clubs'
      ? 'Browse Clubs'
      : getClubLabel(selectedView);

  return (
    <div className="min-h-screen pt-0 px-0 md:pt-0 md:px-0 bg-white/0">
      <header className={`relative z-30 backdrop-blur-md shadow-[0_10px_30px_rgba(30,53,79,0.06)] ${isDark ? 'bg-[#0f1724]/80' : 'bg-white/80'}`}>
        <div className="mx-auto max-w-[1400px] px-0 py-3 md:px-0 md:py-4">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <img src="campus-connect-logo.svg" alt="Campus Connect" className="h-12 w-auto origin-left scale-105 md:h-14 md:scale-110" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-semibold">ConnectX</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="dashboard.html" className="hidden md:inline-flex items-center rounded-full px-3 py-2 text-sm font-medium bg-white text-[#1f3149] border border-[#d5e2ef] hover:bg-[#f5fbff]">Dashboard</a>
            </div>
            <div className="relative flex items-center gap-2">
              <button type="button" aria-label="Profile" onClick={() => { window.location.href = 'profile.html'; }} className={`inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm ${isDark ? 'border-white/10 bg-white/5 text-[#e8eef7]' : 'border-[#c9d8e7] bg-white text-[#1f3149]'}`}>
                {profileImage ? (<img src={profileImage} alt="Profile" className="h-10 w-10 rounded-full object-cover" />) : (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></svg>)}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
        <aside className="md:col-span-3 bg-white rounded-lg border p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold">ConnectX</h2>
            <p className="text-xs text-[#5a6f86]">Quick navigation</p>
          </div>

          <div className="space-y-2">
            <button onClick={() => setSelectedView('home')} className={`w-full text-left px-3 py-2 rounded-md ${selectedView === 'home' ? 'bg-[#0e8f84] text-white' : 'bg-white text-[#1f3149] border border-[#e6eef5]'}`}>Home</button>
            <button onClick={() => setSelectedView('clubs')} className={`w-full text-left px-3 py-2 rounded-md ${selectedView === 'clubs' ? 'bg-[#0e8f84] text-white' : 'bg-white text-[#1f3149] border border-[#e6eef5]'}`}>Browse Clubs</button>

            {joinedClubs.length > 0 && (
              <div className="mt-3 border-t pt-2">
                <p className="text-xs font-semibold text-[#5a6f86]">My Clubs</p>
              </div>
            )}

            {joinedClubs.map((clubId) => {
              const club = getClubById(clubId);
              if (!club) return null;

              return (
                <button key={club.id} onClick={() => setSelectedView(club.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm ${selectedView === club.id ? 'bg-[#0e8f84] text-white' : 'bg-white text-[#1f3149] border border-[#e6eef5]'}`}>
                  {club.icon} {club.label}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="md:col-span-9">
          {selectedView === 'clubs' ? (
            <BrowseClubsView availableClubs={availableClubs} joinedClubs={joinedClubs} onJoin={joinClub} />
          ) : (
            <>
              <div className="mb-6 bg-white rounded-lg border p-4 shadow-sm">
                <form onSubmit={addPost}>
                  <div className="mb-3">
                    <label className="text-xs text-[#5a6f86]">Posting as</label>
                    <div className="font-semibold">{displayName}</div>
                  </div>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={`What's on your mind, ${displayName.split(' ')[0] || 'there'}?`} className="w-full rounded-lg border p-3 resize-none" rows="4"></textarea>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-[#5a6f86]">Posting to: <span className="font-semibold">{currentClubLabel}</span></div>
                    <button type="submit" className="rounded-full bg-[#0e8f84] px-4 py-2 text-white">Post</button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                {filtered.length === 0 ? (
                  <div className="text-center text-[#5a6f86]">No posts yet. Be the first to post!</div>
                ) : filtered.map((post) => (
                  <PostCard key={post.id} post={post} clubLabel={getClubLabel(post.club)} onLike={() => likePost(post.id)} onComment={(txt) => addComment(post.id, txt)} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function BrowseClubsView({ availableClubs, joinedClubs, onJoin }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Available Clubs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableClubs.map((club) => (
          <div key={club.id} className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold">{club.icon} {club.label}</div>
                <p className="text-xs text-[#5a6f86] mt-1">{club.description || 'Join this club to see and post content.'}</p>
              </div>
              <button onClick={() => onJoin(club.id)} className={`px-3 py-1 rounded-full text-sm font-medium ${joinedClubs.includes(club.id) ? 'bg-[#e6f6f3] text-[#0e8f84]' : 'bg-[#0e8f84] text-white'}`}>
                {joinedClubs.includes(club.id) ? 'Joined' : 'Join'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, clubLabel, onLike, onComment }) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  function submitComment(e) {
    e.preventDefault();
    const t = (commentText || '').trim();
    if (!t) return;
    onComment(t);
    setCommentText('');
    setCommentOpen(true);
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-[#eef5ff] flex items-center justify-center text-sm font-semibold">{(post.author || 'A').charAt(0).toUpperCase()}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{post.author}</div>
              <div className="text-xs text-[#5a6f86]">{new Date(post.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-sm text-[#4e637a]">{post.likes} ❤️</div>
          </div>
          <p className="mt-3 text-sm text-[#16263a]">{post.text}</p>

          {post.club && (
            <div className="mt-2 inline-block text-xs px-2 py-1 bg-[#f0fbf9] rounded-md text-[#077c6b] border border-[#e6f6f3]">{clubLabel}</div>
          )}

          <div className="mt-3 flex gap-3 text-sm">
            <button onClick={onLike} className="text-[#0e8f84]">Like</button>
            <button onClick={() => setCommentOpen((prev) => !prev)} className="text-[#0e8f84]">Comment</button>
          </div>

          {commentOpen && (
            <form onSubmit={submitComment} className="mt-3">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="w-full rounded-md border px-3 py-2 text-sm" />
            </form>
          )}

          {post.comments && post.comments.length > 0 && (
            <div className="mt-3 space-y-2">
              {post.comments.map((c) => (
                <div key={c.id} className="rounded-md bg-[#f7fbff] p-2 text-sm">
                  <div className="font-semibold text-xs">{c.author} <span className="text-[#5a6f86] text-[11px]">· {new Date(c.createdAt).toLocaleString()}</span></div>
                  <div className="text-sm">{c.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ConnectXPage />);
