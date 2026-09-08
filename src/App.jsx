import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import RosterManager from './components/RosterManager'
import LiveTracker from './components/LiveTracker'
import StatsOverview from './components/StatsOverview'
import './App.css'

const VERSION = "v0.1.4-beta";

export default function App() {
  const [currentView, setCurrentView] = useState('menu');
  const [teamId, setTeamId] = useState(localStorage.getItem('teamId') || '');
  const [tempTeamId, setTempTeamId] = useState('');
  const [existingTeams, setExistingTeams] = useState([]);
  const [isGameActive, setIsGameActive] = useState(false);

  // NEU: States für das optionale Team-Passwort
  const [teamPassword, setTeamPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (!teamId) {
      const fetchExistingTeams = async () => {
        try {
          const teams = new Set();

          // 1. Suche in der 'players' Collection
          const playersSnap = await getDocs(collection(db, "players"));
          playersSnap.forEach(doc => {
            if (doc.data().teamId) teams.add(doc.data().teamId);
          });

          // 2. Suche in der 'games' Collection
          const gamesSnap = await getDocs(collection(db, "games"));
          gamesSnap.forEach(doc => {
            if (doc.data().teamId) teams.add(doc.data().teamId);
          });

          setExistingTeams(Array.from(teams));
        } catch (error) {
          console.error("Fehler beim Laden der Teams:", error);
        }
      };
      fetchExistingTeams();
    }
  }, [teamId]);

  const handleSetTeam = async (e) => {
    e.preventDefault();
    if (tempTeamId.trim()) {
      const formattedId = tempTeamId.trim().toLowerCase().replace(/\s+/g, '-');

      try {
        // Prüfen, ob das Team ein Passwort in der Firestore 'teams'-Collection hinterlegt hat
        const teamDocRef = doc(db, "teams", formattedId);
        const teamSnap = await getDoc(teamDocRef);

        if (teamSnap.exists() && teamSnap.data().password) {
          if (!needsPassword) {
            setNeedsPassword(true);
            return;
          }
          if (teamSnap.data().password !== teamPassword) {
            alert("Falsches Passwort für dieses Team!");
            return;
          }
        }

        setTeamId(formattedId);
        localStorage.setItem('teamId', formattedId);
        setNeedsPassword(false);
        setTeamPassword('');
      } catch (error) {
        console.error("Fehler beim Team-Login:", error);
      }
    }
  };

  const handleLogout = () => {
    if (isGameActive) {
      const confirmLeave = window.confirm("Achtung: Es läuft ein aktives Spiel! Wenn du das Team wechselst, gehen alle ungespeicherten Daten verloren. Fortfahren?");
      if (!confirmLeave) return;
    }
    setTeamId('');
    setTempTeamId('');
    setNeedsPassword(false);
    setTeamPassword('');
    localStorage.removeItem('teamId');
    setCurrentView('menu');
    setIsGameActive(false);
  };

  const handleGoToMenu = () => {
    if (isGameActive) {
      const confirmLeave = window.confirm("Achtung: Es läuft ein aktives Spiel! Wenn du ins Menü zurückkehrst, gehen alle ungespeicherten Eingaben verloren. Wirklich abbrechen?");
      if (!confirmLeave) return;
    }
    setCurrentView('menu');
    setIsGameActive(false);
  };

  if (!teamId) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>Unihockey Tracker</h1>
          <span className="version-tag">{VERSION}</span>
          <button className="nav-btn theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Darkmode' : '☀️ Lightmode'}
          </button>
        </header>
        <main className="login-container">
          <h2>Team einrichten</h2>
          <p>
            {needsPassword
              ? `Das Team "${tempTeamId}" ist passwortgeschützt. Bitte gib das Team-Passwort ein:`
              : "Wähle ein bestehendes Team aus der Liste oder tippe einen neuen Code ein, um ein neues Team zu gründen."}
          </p>
          <form onSubmit={handleSetTeam} className="team-form">
            <input
              type="text"
              list="team-options"
              placeholder="Team-Code..."
              value={tempTeamId}
              onChange={e => setTempTeamId(e.target.value)}
              disabled={needsPassword}
            />
            <datalist id="team-options">
              {existingTeams.map(t => (
                <option key={t} value={t} />
              ))}
            </datalist>

            {needsPassword && (
              <input
                type="password"
                placeholder="Team-Passwort..."
                value={teamPassword}
                onChange={e => setTeamPassword(e.target.value)}
                autoFocus
              />
            )}

            <button type="submit" className="btn-start">
              {needsPassword ? 'Passwort bestätigen' : 'Gerät koppeln'}
            </button>

            {needsPassword && (
              <button
                type="button"
                className="nav-btn"
                style={{ background: '#666', marginTop: '0.5rem', width: '100%' }}
                onClick={() => { setNeedsPassword(false); setTeamPassword(''); }}
              >
                Abbrechen
              </button>
            )}
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>Unihockey Tracker</h1>
          <span className="version-tag-sub">{VERSION}</span>
        </div>
        <div className="header-controls">
          <span className="team-badge">Team: {teamId}</span>
          <button className="nav-btn theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {currentView !== 'menu' && (
            <button className="nav-btn" onClick={handleGoToMenu}>Menü</button>
          )}
          <button className="nav-btn logout-btn" onClick={handleLogout}>Wechseln</button>
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
        {currentView === 'tracker' && <LiveTracker teamId={teamId} onGameActiveChange={setIsGameActive} />}
        {currentView === 'stats' && <StatsOverview teamId={teamId} />}
      </main>
    </div>
  )
}