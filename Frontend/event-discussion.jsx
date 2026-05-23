const { useState, useEffect, useMemo } = React;

function getQueryParam(name){
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function EventDiscussionPage(){
  const eventId = getQueryParam('id');
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('cc_user')||'null'); } catch { return null; }});
  const displayName = useMemo(()=> (user ? (user.firstName||user.username||'').trim() : 'Anonymous'), [user]);
  const STORAGE_KEY = `cc_event_thread_${eventId||'unknown'}`;
  const [thread, setThread] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); }catch{return [];} });
  const [text, setText] = useState('');

  useEffect(()=>{
    if (!eventId) {
      const maybe = sessionStorage.getItem('cc_selected_event');
      if (maybe) {
        try { const parsed = JSON.parse(maybe); setEvent(parsed); }
        catch{} 
      }
    } else {
      campusAPI.getEvent(eventId).then(e=>{ setEvent(e); }).catch(()=>{});
    }
  },[]);

  useEffect(() => {
    let mounted = true;
    async function loadThread(){
      if (!eventId) return;
      try {
        const items = await campusAPI.getEventThread(eventId);
        if (mounted && Array.isArray(items)) {
          setThread(items);
          return;
        }
      } catch (_e) {
        // fallback to local storage handled by existing state
      }
    }
    loadThread();
    return () => { mounted = false; };
  }, [eventId]);

  useEffect(()=>{
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(thread)); }catch(_e){}
  },[thread]);

  function postComment(e){
    e.preventDefault();
    const t = (text||'').trim();
    if (!t) return;
    const payload = { text: t, author: displayName||'Anonymous' };
    if (eventId) {
      campusAPI.postEventThread(eventId, payload).then(res => {
        if (res && res.item) setThread(prev=>[res.item, ...prev]);
      }).catch(()=>{
        const item = { id: Date.now(), author: displayName||'Anonymous', text: t, createdAt: new Date().toISOString() };
        setThread(prev=>[item, ...prev]);
      });
    } else {
      const item = { id: Date.now(), author: displayName||'Anonymous', text: t, createdAt: new Date().toISOString() };
      setThread(prev=>[item, ...prev]);
    }
    setText('');
  }

  return (
    <div className="min-h-screen p-6 bg-white/0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <a href="dashboard.html" className="text-sm text-[#0e8f84]">← Back to dashboard</a>
          <h1 className="text-2xl font-bold mt-2">Discussion{event ? ` — ${event.title||event.name}` : ''}</h1>
          <p className="text-sm text-[#5a6f86]">Ask questions and coordinate with attendees for this event.</p>
        </div>

        <form onSubmit={postComment} className="mb-6">
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write your question or update..." className="w-full rounded-lg border p-3" rows={3}></textarea>
          <div className="mt-2 flex justify-end">
            <button className="rounded-full bg-[#0e8f84] px-4 py-2 text-white">Post</button>
          </div>
        </form>

        <div className="space-y-4">
          {thread.length===0 ? <div className="text-[#5a6f86]">No discussion yet — start the conversation.</div> : thread.map(item=> (
            <div key={item.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{item.author}</div>
                <div className="text-xs text-[#5a6f86]">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <p className="mt-2 text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<EventDiscussionPage />);
