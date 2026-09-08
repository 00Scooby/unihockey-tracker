import { useState, useEffect } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const defaultPeriodStats = { goals: 0, assists: 0, plus: 0, minus: 0, shotsOnGoal: 0, shotsMissed: 0, shotsBlocked: 0, passes: 0, saves: 0, goalsAgainst: 0 };

export default function LiveTracker({ teamId }) {
    const [allPlayers, setAllPlayers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentPeriod, setCurrentPeriod] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    const [gameInfo, setGameInfo] = useState({
        date: new Date().toISOString().split('T')[0],
        opponent: '',
        type: 'Meisterschaft'
    });

    // Hier speichern wir zentral alle Klicks des gesamten Teams
    const [gameStats, setGameStats] = useState({});

    useEffect(() => {
        const fetchRoster = async () => {
            const q = query(collection(db, "players"), where("teamId", "==", teamId));
            const querySnapshot = await getDocs(q);
            const rosterData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            rosterData.sort((a, b) => Number(a.number) - Number(b.number));
            setAllPlayers(rosterData);
        };
        fetchRoster();
    }, []);

    const togglePlayer = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const handleStartGame = () => {
        const initialStats = {};
        selectedIds.forEach(id => {
            initialStats[id] = {
                1: { ...defaultPeriodStats },
                2: { ...defaultPeriodStats },
                3: { ...defaultPeriodStats },
                4: { ...defaultPeriodStats }
            };
        });
        setGameStats(initialStats);
        setGameStarted(true);
    };

    const handleSaveGame = async () => {
        setIsSaving(true);
        try {
            const gameDocument = {
                meta: gameInfo,
                stats: gameStats,
                timestamp: new Date().toISOString()
            };

            // Speichert das gesamte Spiel in der Collection "games"
            await addDoc(collection(db, "games"), { ...gameDocument, teamId: teamId });

            alert("Spiel erfolgreich gespeichert!");
            // Reset für das nächste Spiel
            setGameStarted(false);
            setSelectedIds([]);
            setGameInfo({ date: new Date().toISOString().split('T')[0], opponent: '', type: 'Meisterschaft' });
        } catch (error) {
            console.error("Fehler beim Speichern:", error);
            alert("Fehler beim Speichern des Spiels.");
        } finally {
            setIsSaving(false);
        }
    };

    // Funktion wird an die PlayerRow weitergegeben
    const updateGlobalStat = (playerId, period, statKey, value) => {
        setGameStats(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [period]: {
                    ...prev[playerId][period],
                    [statKey]: Math.max(0, prev[playerId][period][statKey] + value)
                }
            }
        }));
    };

    if (!gameStarted) {
        return (
            <div className="setup-container">
                <h2>Neues Spiel einrichten</h2>
                <div className="game-setup-form">
                    <input type="date" value={gameInfo.date} onChange={e => setGameInfo({ ...gameInfo, date: e.target.value })} />
                    <input type="text" placeholder="Gegner (z.B. Floorball Köniz)" value={gameInfo.opponent} onChange={e => setGameInfo({ ...gameInfo, opponent: e.target.value })} />
                    <select value={gameInfo.type} onChange={e => setGameInfo({ ...gameInfo, type: e.target.value })}>
                        <option value="Meisterschaft">Meisterschaft</option>
                        <option value="Cup">Cup</option>
                        <option value="Testspiel">Testspiel</option>
                    </select>
                </div>

                <h3 style={{ marginTop: '2rem' }}>Match-Kader auswählen</h3>
                <div className="setup-list">
                    {allPlayers.map(p => (
                        <label key={p.id} className="setup-item">
                            <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => togglePlayer(p.id)} />
                            #{p.number} {p.name} ({p.position})
                        </label>
                    ))}
                </div>

                <button className="btn-start" onClick={handleStartGame} disabled={selectedIds.length === 0 || !gameInfo.opponent.trim()}>
                    Spiel starten
                </button>
            </div>
        );
    }

    const activePlayers = allPlayers.filter(p => selectedIds.includes(p.id));

    return (
        <div className="tracker-container">
            <div className="tracker-header">
                <div className="game-meta-display">
                    <strong>{gameInfo.type}</strong> vs {gameInfo.opponent} ({gameInfo.date.split('-').reverse().join('.')})
                </div>

                <div className="game-actions">
                    <select value={currentPeriod} onChange={(e) => setCurrentPeriod(Number(e.target.value))} className="period-select">
                        <option value={1}>1. Drittel</option>
                        <option value={2}>2. Drittel</option>
                        <option value={3}>3. Drittel</option>
                        <option value={4}>Verlängerung</option>
                    </select>
                    <button className="btn-save" onClick={handleSaveGame} disabled={isSaving}>
                        {isSaving ? 'Speichert...' : 'Spiel abschliessen'}
                    </button>
                </div>
            </div>

            <div className="player-list">
                {activePlayers.map(player => (
                    <PlayerRow
                        key={player.id}
                        player={player}
                        currentPeriod={currentPeriod}
                        playerStats={gameStats[player.id]}
                        onUpdateStat={(period, stat, val) => updateGlobalStat(player.id, period, stat, val)}
                    />
                ))}
            </div>
        </div>
    );
}

function PlayerRow({ player, currentPeriod, playerStats, onUpdateStat }) {

    const StatButton = ({ label, statKey }) => (
        <div className="stat-box">
            <span className="stat-label">{label}</span>
            <div className="stat-controls">
                <button onClick={() => onUpdateStat(currentPeriod, statKey, -1)} className="btn-minus"><FaMinus /></button>
                <span className="stat-value">{playerStats[currentPeriod][statKey]}</span>
                <button onClick={() => onUpdateStat(currentPeriod, statKey, 1)} className="btn-plus"><FaPlus /></button>
            </div>
        </div>
    );

    return (
        <div className="player-row">
            <div className="player-info">
                <span className="player-number">#{player.number}</span>
                <span className="player-name">{player.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: 'auto' }}>{player.position}</span>
            </div>

            <div className="player-stats">
                {player.position === 'Torhüter' ? (
                    <>
                        <StatButton label="Tor" statKey="goals" />
                        <StatButton label="Gehalten" statKey="saves" />
                        <StatButton label="Gegentor" statKey="goalsAgainst" />
                        <StatButton label="Assist" statKey="assists" />
                        <StatButton label="Pass" statKey="passes" />
                    </>
                ) : (
                    <>
                        <StatButton label="Tor" statKey="goals" />
                        <StatButton label="Assist" statKey="assists" />
                        <StatButton label="Plus" statKey="plus" />
                        <StatButton label="Minus" statKey="minus" />
                        <StatButton label="Schuss Tor" statKey="shotsOnGoal" />
                        <StatButton label="Daneben" statKey="shotsMissed" />
                        <StatButton label="Block" statKey="shotsBlocked" />
                        <StatButton label="Pass" statKey="passes" />
                    </>
                )}
            </div>
        </div>
    );
}