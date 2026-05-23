const { useState, useEffect } = React;

function ClubsPage(){
  const DEFAULT_CLUBS = [
    { id: 'coding', name: 'Coding Club', desc: 'Algorithms, contests and hackathons.' },
    { id: 'entre', name: 'Entrepreneurship', desc: 'Startup ideas, pitching and mentorship.' },
    { id: 'culture', name: 'Cultural Club', desc: 'Events, performances and festivals.' },
    { id: 'sports', name: 'Sports Club', desc: 'Organize matches and fitness sessions.' },
    { id: 'design', name: 'Design & UX', desc: 'Workshops and portfolio reviews.' }
  ];

  const [clubs] = useState(DEFAULT_CLUBS);
  const [clubsState, setClubsState] = useState(DEFAULT_CLUBS);
  const [memberships, setMemberships] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('cc_club_memberships')||'{}'); }catch{return {}}
  });

  useEffect(()=>{
    let mounted = true;
    campusAPI.getClubs().then(list => { if (mounted && Array.isArray(list) && list.length) setClubsState(list); }).catch(()=>{});
    return ()=>{ mounted = false; };
  },[]);

  useEffect(()=>{
    localStorage.setItem('cc_club_memberships', JSON.stringify(memberships));
  },[memberships]);

  function toggleJoin(id){
    const user = (function(){ try { return JSON.parse(localStorage.getItem('cc_user')||'null'); } catch { return null; } })() || {};
    const userId = user.id || user.email || user.username || 'anonymous';
    campusAPI.joinClub(id, { user: userId }).then(()=>{
      setMemberships(prev => { const next = {...prev}; next[id] = true; try{ localStorage.setItem('cc_club_memberships', JSON.stringify(next)); }catch{} return next; });
    }).catch(()=>{
      setMemberships(prev => {
        const next = {...prev};
        if (next[id]) delete next[id]; else next[id] = true;
        try{ localStorage.setItem('cc_club_memberships', JSON.stringify(next)); }catch{}
        return next;
      });
    });
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Clubs & Interest Groups</h1>
          <p className="text-sm text-[#5a6f86]">Browse clubs, join groups, and see members.</p>
        </div>

        <div className="grid gap-4">
          {clubsState.map(c => (
            <div key={c.id} className="rounded-lg border bg-white p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-[#5a6f86]">{c.desc}</div>
              </div>
              <div className="flex flex-col items-end">
                <button onClick={()=>toggleJoin(c.id)} className={`rounded-full px-4 py-2 ${memberships[c.id] ? 'bg-[#0e8f84] text-white' : 'bg-white border border-[#d5e2ef]'}`}>
                  {memberships[c.id] ? 'Joined' : 'Join'}
                </button>
                <a href="#" onClick={(e)=>{e.preventDefault(); alert('Club page coming soon.')}} className="text-xs text-[#5a6f86] mt-2">View</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ClubsPage />);
