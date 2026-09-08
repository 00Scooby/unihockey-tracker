import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import RosterManager from './components/RosterManager'
import LiveTracker from './components/LiveTracker'
import StatsOverview from './components/StatsOverview'
import './App.css'

export default function App() {
  const [currentView, setCurrentView] = useState('menu');
  const [teamId, setTeamId] = useState(localStorage.getItem('teamId') || '');
  const [tempTeamId, setTempTeamId] = useState('');
  const [existingTeams, setExistingTeams] = useState([]);

  // Sucht nach bereits existierenden Teams in der Datenbank
  useEffect(() => {
    if (!teamId) {
      const fetchExistingTeams = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "players"));
          const teams = new Set();
          querySnapshot.forEach(doc => {
            if (doc.data().teamId) {
              teams.add(doc.data().teamId);
            }
          });
          setExistingTeams(Array.from(teams));
        } catch (error) {
          console.error("Fehler beim Laden der Teams:", error);
        }
      };
      fetchExistingTeams();
    }
  }, [teamId]);

  const handleSetTeam = (e) => {
    e.preventDefault();
    if (tempTeamId.trim()) {
      const formattedId = tempTeamId.trim().toLowerCase().replace(/\s+/g, '-');
      setTeamId(formattedId);
      localStorage.setItem('teamId', formattedId);
    }
  };

  const handleLogout = () => {
    setTeamId('');
    setTempTeamId('');
    localStorage.removeItem('teamId');
    setCurrentView('menu');
  };

  if (!teamId) {
    return (
      <div className="app-container">
        <header className="app-header"><h1>Unihockey Tracker</h1></header>
        <main className="login-container">
          <h2>Team einrichten</h2>
          <p>Wähle ein bestehendes Team aus der Liste oder tippe einen neuen Code ein, um ein neues Team zu gründen.</p>
          <form onSubmit={handleSetTeam} className="team-form">
            <input
              type="text"
              list="team-options"
              placeholder="Team-Code..."
              value={tempTeamId}
              onChange={e => setTempTeamId(e.target.value)}
            />
            {/* Hier wird die Vorschlagsliste gerendert */}
            <datalist id="team-options">
              {existingTeams.map(t => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <button type="submit" className="btn-start">Gerät koppeln</button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Unihockey Tracker</h1>
        <div className="header-controls">
          <span className="team-badge">Team: {teamId}</span>
          {currentView !== 'menu' && (
            <button className="nav-btn" onClick={() => setCurrentView('menu')}>Menü</button>
          )}
          <button className="nav-btn logout-btn" onClick={handleLogout}>Team wechseln</button>
        </div>
      </header>

      <main>
        {currentView === 'menu' && (
          <div className="menu-grid">
            <button className="menu-btn" onClick={() => setCurrentView('roster')}>Kaderverwaltung</button>
            <button className="menu-btn" onClick={() => setCurrentView('tracker')}>Neues Spiel starten</button>
            <button className="menu-btn stats-btn" onClick={() => setCurrentView('stats')}>Saisonstatistik</button>
          </div>
        )}

        {currentView === 'roster' && <RosterManager teamId={teamId} />}
        {currentView === 'tracker' && <LiveTracker teamId={teamId} />}
        {currentView === 'stats' && <StatsOverview teamId={teamId} />}
      </main>
    </div>
  )
}