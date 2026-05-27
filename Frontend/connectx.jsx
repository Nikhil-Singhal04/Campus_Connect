const { useState, useEffect, useMemo, useRef } = React;

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

function formatPostDate(dateVal) {
  if (!dateVal) return 'Date Unavailable';
  try {
    const num = Number(dateVal);
    const d = !isNaN(num) ? new Date(num) : new Date(dateVal);
    return isNaN(d.getTime()) ? 'Date Unavailable' : d.toLocaleString();
  } catch (_) {
    return 'Date Unavailable';
  }
}

function getClubTheme(clubId) {
  const themes = {
    coding: {
      border: 'border-emerald-200 dark:border-emerald-800/80',
      badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
    },
    design: {
      border: 'border-violet-200 dark:border-violet-800/80',
      badge: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800'
    },
    sports: {
      border: 'border-blue-200 dark:border-blue-800/80',
      badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
    },
    entrepreneurship: {
      border: 'border-amber-200 dark:border-amber-800/80',
      badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-750 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
    },
    cultural: {
      border: 'border-pink-200 dark:border-pink-800/80',
      badge: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800'
    },
    agri: {
      border: 'border-green-200 dark:border-green-800/80',
      badge: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
    }
  };
  return themes[normalizeClubId(clubId)] || {
    border: 'border-slate-200 dark:border-slate-800',
    badge: 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
  };
}

function ConnectXPage() {
  const token = localStorage.getItem("cc_token");
  if (!token) {
    window.location.href = "signin.html";
    return null;
  }

  const [user, setUser] = useState(() => {
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

  const [posts, setPosts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  });

  const persistPosts = (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_) { }
    setPosts(list);
  };

  const [text, setText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState('home');
  const [availableClubs, setAvailableClubs] = useState(DEFAULT_CLUBS);
  const [replyingTo, setReplyingTo] = useState(null);

  const [joinedClubs, setJoinedClubs] = useState(() => {
    try {
      const storageId = resolveUserStorageId(user);
      const key = `cc_joined_clubs_${storageId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  });

  const persistJoinedClubs = (list) => {
    try {
      localStorage.setItem(joinedClubsKey, JSON.stringify(list));
    } catch (_) { }
    setJoinedClubs(list);
  };

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

  // Load posts on mount and set up periodic polling
  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      try {
        const serverPosts = await campusAPI.getConnectXPosts();
        if (mounted && Array.isArray(serverPosts)) {
          setPosts(serverPosts);
        }
      } catch (_error) {
        // use local storage fallback
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw && mounted) {
            setPosts(JSON.parse(raw));
          }
        } catch (_e) { }
      }
    }

    loadPosts();

    const interval = setInterval(() => {
      loadPosts();
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sync state and load initial clubs on mount
  useEffect(() => {
    let mounted = true;
    window.scrollTo(0, 0);

    async function ensureUserFromServer() {
      try {
        const t = window.campusAPI.getToken();
        if (t && !user) {
          const me = await campusAPI.getMe();
          if (mounted && me) {
            setUser(me);
            try { localStorage.setItem('cc_user', JSON.stringify(me)); } catch (_) { }
          }
        }
      } catch (err) {
        console.debug('Could not refresh user from API', err);
      }
    }

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
        // use defaults
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
          persistJoinedClubs(nextJoined);
          return;
        }
      } catch (err) {
        console.debug('getJoinedClubs failed, fallback to cache', err);
      }

      try {
        const raw = localStorage.getItem(joinedClubsKey);
        if (raw && mounted) {
          setJoinedClubs(JSON.parse(raw));
        }
      } catch (_error) { }
    }

    (async () => {
      await ensureUserFromServer();
      await loadClubs();
      await loadJoinedClubs();
    })();

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
      try {
        const serverJoined = await campusAPI.getJoinedClubs();
        const nextJoined = [];
        const seen = new Set();
        for (const club of serverJoined) {
          const cid = normalizeClubId(club?.id || club?.clubId || club);
          if (!cid || seen.has(cid)) continue;
          seen.add(cid);
          nextJoined.push(cid);
        }
        persistJoinedClubs(nextJoined);
      } catch (err) {
        persistJoinedClubs(joinedClubs.includes(normalizedId) ? joinedClubs : [...joinedClubs, normalizedId]);
      }
    } catch (err) {
      console.error('Join club failed', err);
      persistJoinedClubs(joinedClubs.includes(normalizedId) ? joinedClubs : [...joinedClubs, normalizedId]);
    }
    setSelectedView(normalizedId);
  }

  // Handle local image attachment and canvas-based compression
  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        setPostImage(compressed);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  function addPost(e) {
    if (e) e.preventDefault();
    const t = (text || '').trim();
    if (!t && !postImage) return;

    const club = selectedView === 'home' || selectedView === 'clubs' ? null : normalizeClubId(selectedView);
    const newPost = {
      id: Date.now(),
      author: displayName,
      text: t,
      image: postImage,
      club,
      createdAt: Date.now(),
      likes: 0,
      comments: [],
      replyToId: replyingTo ? replyingTo.id : null,
      replyToAuthor: replyingTo ? replyingTo.author : null,
      replyToText: replyingTo ? replyingTo.text : null
    };

    campusAPI.createConnectXPost(newPost).then((res) => {
      if (res && res.post) {
        setPosts((prev) => [res.post, ...prev]);
      }
    }).catch(() => {
      setPosts((prev) => [newPost, ...prev]);
    });

    setText('');
    setPostImage(null);
    setReplyingTo(null);
    setTimeout(() => scrollToBottom(true), 50);
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
          createdAt: Date.now()
        });
        return next;
      }));
    });
  }

  // Filter posts by club and search query, then sort chronologically (oldest first)
  const filtered = posts.filter((post) => {
    const club = normalizeClubId(post.club);
    let matchesView = false;
    if (selectedView === 'home') {
      matchesView = !club;
    } else if (selectedView === 'clubs') {
      matchesView = false;
    } else {
      matchesView = club === normalizeClubId(selectedView);
    }
    if (!matchesView) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (post.text || '').toLowerCase().includes(q) || (post.author || '').toLowerCase().includes(q);
  }).sort((a, b) => {
    const tA = !isNaN(Number(a.createdAt)) ? Number(a.createdAt) : new Date(a.createdAt).getTime();
    const tB = !isNaN(Number(b.createdAt)) ? Number(b.createdAt) : new Date(b.createdAt).getTime();
    return (tA || 0) - (tB || 0);
  });

  const currentClubLabel = selectedView === 'home'
    ? 'Home'
    : selectedView === 'clubs'
      ? 'Browse Clubs'
      : getClubLabel(selectedView);

  const messagesContainerRef = useRef(null);

  const scrollToBottom = (force = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      if (force || isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [filtered.length]);

  useEffect(() => {
    scrollToBottom(true);
  }, [selectedView]);

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a] overflow-hidden text-[#1f3149] dark:text-[#e2eaf5] transition-colors duration-300">
      {/* Header */}
      <header className={`z-30 border-b flex-shrink-0 transition-all ${isDark ? 'bg-[#202c33] border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.15)]' : 'bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'}`}>
        <div className="mx-auto max-w-[1400px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <img src="campus-connect-logo.svg" alt="Campus Connect" className="h-9 w-auto origin-left scale-105" />

            <div className="flex items-center gap-3">
              <a href="dashboard.html" className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-900 text-[#1f3149] dark:text-slate-200 border border-[#d5e2ef] dark:border-slate-800 hover:bg-[#f5fbff] dark:hover:bg-slate-800 transition duration-300 shadow-sm">Dashboard</a>

              <button type="button" aria-label="Profile" onClick={() => { window.location.href = 'profile.html'; }} className={`inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition duration-300 hover:scale-105 ${isDark ? 'border-white/10 bg-white/5 text-[#e8eef7]' : 'border-[#c9d8e7] bg-white text-[#1f3149]'}`}>
                {profileImage ? (<img src={profileImage} alt="Profile" className="h-8 w-8 rounded-full object-cover" />) : (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></svg>)}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main chat layout */}
      <div className="flex-1 flex overflow-hidden max-w-[1400px] w-full mx-auto">
        {/* Left Sidebar (Clubs roster) */}
        <aside className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <h2 className="text-xl font-extrabold text-[#1f3149] dark:text-white tracking-tight">ConnectX</h2>
            <p className="text-[10px] text-[#8fa0b5] dark:text-slate-500 font-extrabold uppercase tracking-wider mt-0.5">Quick navigation</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button onClick={() => setSelectedView('home')} className={`w-full text-left px-3 py-3 rounded-xl font-bold flex items-center gap-3 transition-all duration-200 ${selectedView === 'home' ? 'bg-[#00a884] text-white shadow-md shadow-[#00a884]/20 scale-[1.01]' : 'bg-transparent text-[#5a6f86] dark:text-slate-400 hover:bg-[#f0f2f5] dark:hover:bg-slate-800 hover:text-[#1f3149] dark:hover:text-white'}`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </button>

            <button onClick={() => setSelectedView('clubs')} className={`w-full text-left px-3 py-3 rounded-xl font-bold flex items-center gap-3 transition-all duration-200 ${selectedView === 'clubs' ? 'bg-[#00a884] text-white shadow-md shadow-[#00a884]/20 scale-[1.01]' : 'bg-transparent text-[#5a6f86] dark:text-slate-400 hover:bg-[#f0f2f5] dark:hover:bg-slate-800 hover:text-[#1f3149] dark:hover:text-white'}`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Browse Clubs
            </button>

            {joinedClubs.length > 0 && (
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 px-2 flex-shrink-0">
                <p className="text-[10px] font-bold text-[#8fa0b5] dark:text-slate-500 uppercase tracking-wider mb-2">My Clubs</p>
              </div>
            )}

            {joinedClubs.map((clubId) => {
              const club = getClubById(clubId);
              if (!club) return null;
              const isSelected = selectedView === club.id;

              return (
                <button key={club.id} onClick={() => setSelectedView(club.id)} className={`w-full text-left px-3 py-3 rounded-xl font-bold flex items-center gap-3 transition-all duration-200 ${isSelected ? 'bg-[#00a884] text-white shadow-md shadow-[#00a884]/20 scale-[1.01]' : 'bg-transparent text-[#5a6f86] dark:text-slate-400 hover:bg-[#f0f2f5] dark:hover:bg-slate-800 hover:text-[#1f3149] dark:hover:text-white'}`}>
                  <span className="text-lg">{club.icon}</span>
                  <span className="truncate">{club.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Chat Column */}
        <main className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] h-full overflow-hidden relative">
          {/* Subtle WhatsApp wallpaper pattern */}
          <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] -z-10"></div>

          {selectedView === 'clubs' ? (
            <div className="flex-1 overflow-y-auto p-6 bg-white/50 dark:bg-slate-900/40">
              <BrowseClubsView availableClubs={availableClubs} joinedClubs={joinedClubs} onJoin={joinClub} />
            </div>
          ) : (
            <>
              {/* Chat Area Header */}
              <div className="h-16 flex items-center justify-between px-6 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200/50 dark:border-slate-800/80 flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#00a884] to-[#25d366] text-white flex items-center justify-center text-lg font-bold shadow-sm">
                    {selectedView === 'home' ? '🏠' : (getClubById(selectedView)?.icon || '💬')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#1f3149] dark:text-slate-100 text-sm md:text-base leading-none">{currentClubLabel}</h3>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 inline-block">Active channel</span>
                  </div>
                </div>

                {/* Compact Search box embedded in header */}
                <div className="relative w-48 md:w-64">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-850 bg-white/80 dark:bg-slate-900/80 text-xs focus:outline-none focus:border-[#00a884] placeholder-slate-400 text-slate-800 dark:text-slate-100 font-semibold"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Scrollable Message Feed */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-60">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">No messages in {currentClubLabel} yet. Start the conversation below!</p>
                  </div>
                ) : (
                  filtered.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      displayName={displayName}
                      clubLabel={getClubLabel(post.club)}
                      onLike={() => likePost(post.id)}
                      onComment={(txt) => addComment(post.id, txt)}
                      onReply={setReplyingTo}
                    />
                  ))
                )}
              </div>

              {/* Sticky bottom composer */}
              <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/80 bg-[#f0f2f5] dark:bg-[#202c33] flex-shrink-0">
                {replyingTo && (
                  <div className="mb-2 bg-white dark:bg-[#111b21] rounded-xl p-2.5 flex items-center justify-between border-l-4 border-[#00a884] border border-slate-200 dark:border-slate-800/80 shadow-sm animate-fadeUp">
                    <div className="flex-1 min-w-0 pr-4">
                      <span className="text-[11px] font-extrabold text-[#00a884] dark:text-emerald-400 block">
                        Replying to {replyingTo.author}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-semibold">
                        {replyingTo.text}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400 flex items-center justify-center text-xs transition duration-200"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {postImage && (
                  <div className="mb-2 bg-white dark:bg-slate-900 rounded-xl p-2.5 flex items-center justify-between border border-slate-200 dark:border-slate-800/80 shadow-inner max-w-sm animate-fadeUp">
                    <div className="flex items-center gap-2.5">
                      <img src={postImage} alt="Attachment preview" className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                      <span className="text-[10px] text-slate-500 font-bold">Image attached ready to post</span>
                    </div>
                    <button onClick={() => setPostImage(null)} className="h-6 w-6 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-xs transition duration-200">✕</button>
                  </div>
                )}

                <form onSubmit={addPost} className="flex items-center gap-2">
                  <label className="flex-shrink-0 cursor-pointer p-2 text-slate-500 hover:text-[#00a884] dark:text-slate-400 dark:hover:text-emerald-400 transition hover:scale-105">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </label>

                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Type a message, ${displayName.split(' ')[0]}...`}
                    className="flex-1 rounded-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#2a3942] px-5 py-2.5 text-sm focus:outline-none focus:border-[#00a884] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                  />

                  <button
                    type="submit"
                    className="h-10 w-10 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white flex items-center justify-center shadow-md active:scale-95 transition-all duration-150 flex-shrink-0"
                  >
                    <svg className="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
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
    <div className="animate-fadeUp">
      <h2 className="text-2xl font-extrabold text-[#1f3149] dark:text-white mb-5 tracking-tight">Available Clubs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableClubs.map((club) => {
          const isJoined = joinedClubs.includes(club.id);
          const theme = getClubTheme(club.id);

          return (
            <div key={club.id} className={`bg-white dark:bg-[#111b21] rounded-2xl border p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex flex-col justify-between transition hover:-translate-y-0.5 duration-200 ${theme.border}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{club.icon}</span>
                  <h3 className="text-lg font-extrabold text-[#1f3149] dark:text-slate-100">{club.label}</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{club.description || 'Join this club to discover content and discuss topics.'}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                  {club.label.split(' ')[0]}
                </span>
                <button
                  onClick={() => onJoin(club.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition duration-200 active:scale-95 ${isJoined ? 'bg-[#e6f6f3] dark:bg-emerald-950/45 text-[#00a884] border border-[#c4ecd0]/60 dark:border-emerald-900/60' : 'bg-[#00a884] hover:bg-[#008f72] text-white'}`}
                >
                  {isJoined ? 'Joined' : 'Join'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostCard({ post, displayName, clubLabel, onLike, onComment, onReply }) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  function submitComment(e) {
    e.preventDefault();
    const t = (commentText || '').trim();
    if (!t) return;
    onComment(t);
    setCommentText('');
    setCommentOpen(true);
  }

  const handleLikeClick = () => {
    setIsLiked(true);
    setTimeout(() => setIsLiked(false), 350);
    onLike();
  };

  const handleCopyClick = () => {
    const textToCopy = post.text || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error('Failed to copy message:', err);
    });
  };

  const isSelf = post.author === displayName;
  const clubTheme = post.club ? getClubTheme(post.club) : null;

  return (
    <div className={`flex w-full ${isSelf ? 'justify-end' : 'justify-start'} animate-fadeUp mb-2`}>
      <div className={`max-w-[75%] min-w-[220px] rounded-2xl shadow-[0_1px_1px_rgba(0,0,0,0.06)] p-3.5 relative flex flex-col ${isSelf ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none border border-[#c4ecd0]/60 dark:border-[#005c4b]' : 'bg-white dark:bg-[#202c33] rounded-tl-none border border-slate-100 dark:border-[#202c33]'}`}>

        {!isSelf && (
          <span className="font-extrabold text-xs text-[#00a884] dark:text-emerald-400 mb-1.5 block">
            {post.author}
          </span>
        )}

        {post.replyToId && (
          <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-white/5 border-l-4 border-[#00a884] text-[11px] max-w-full">
            <span className="font-extrabold text-[#00a884] dark:text-emerald-400 block mb-0.5 text-[10px]">
              {post.replyToAuthor}
            </span>
            <p className="text-slate-600 dark:text-slate-350 truncate font-semibold leading-tight">
              {post.replyToText}
            </p>
          </div>
        )}

        {post.text && (
          <p className="text-sm text-slate-850 dark:text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">{post.text}</p>
        )}

        {post.image && (
          <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-80 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center shadow-sm">
            <img src={post.image} alt="Post attachment" className="object-cover max-h-80 w-full" />
          </div>
        )}

        {post.club && clubTheme && (
          <div className={`mt-2.5 self-start inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${clubTheme.badge}`}>
            <span>{clubLabel}</span>
          </div>
        )}

        <div className="mt-3.5 pt-2 border-t border-slate-100/50 dark:border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold">
          <div className="flex items-center gap-3">
            <button onClick={handleLikeClick} className="flex items-center gap-1 hover:text-[#00a884] dark:hover:text-emerald-400 transition">
              <span className={`inline-block text-[12px] ${isLiked ? 'animate-heartPop' : ''}`}>❤️</span>
              <span>{post.likes}</span>
            </button>
            <button onClick={() => setCommentOpen((prev) => !prev)} className="flex items-center gap-1 hover:text-[#00a884] dark:hover:text-emerald-400 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.comments ? post.comments.length : 0}</span>
            </button>
            
            {post.text && (
              <button onClick={handleCopyClick} className="flex items-center gap-1 hover:text-[#00a884] dark:hover:text-emerald-400 transition" title="Copy message text">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            )}

            <button onClick={() => onReply({ id: post.id, author: post.author, text: post.text || (post.image ? '[Image]' : '') })} className="flex items-center gap-1 hover:text-[#00a884] dark:hover:text-emerald-400 transition" title="Reply to message">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Reply</span>
            </button>
          </div>
          <span>{formatPostDate(post.createdAt)}</span>
        </div>

        {commentOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100/50 dark:border-slate-800/40 animate-fadeUp">
            <form onSubmit={submitComment} className="flex gap-2 mb-3">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Reply to message..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 px-3 py-1.5 text-xs focus:outline-none focus:border-[#00a884] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
              />
              <button type="submit" className="rounded-xl bg-[#00a884] text-white px-3 py-1.5 text-[11px] font-bold shadow-sm transition active:scale-95">Reply</button>
            </form>

            {post.comments && post.comments.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {post.comments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-[#f0f2f5] dark:bg-slate-950/40 p-2 text-xs flex gap-2 border border-slate-100 dark:border-slate-800/30">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#00a884] to-[#25d366] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {(c.author || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[11px] text-[#2b3e56] dark:text-slate-250">{c.author}</span>
                        <span className="text-slate-450 dark:text-slate-550 text-[9px]">{formatPostDate(c.createdAt)}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-350 mt-0.5 leading-relaxed">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ConnectXPage />);
