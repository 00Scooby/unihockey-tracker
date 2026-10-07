import { useState, useEffect } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const defaultPeriodStats = { goals: 0, assists: 0, plus: 0, minus: 0, shotsOnGoal: 0, shotsMissed: 0, shotsBlocked: 0, passes: 0, saves: 0, goalsAgainst: 0 };

export default function LiveTracker({ teamId, onGameActiveChange }) {
    const [allPlayers, setAllPlayers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [lineup, setLineup] = useState({});
    const [gameMode, setGameMode] = useState('kleinfeld'); // GEÄNDERT: Standard ist jetzt Kleinfeld
    const [gameStarted, setGameStarted] = useState(false);
    const [currentPeriod, setCurrentPeriod] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    const [gameInfo, setGameInfo] = useState({
        date: new Date().toISOString().split('T')[0],
        opponent: '',
        type: 'Meisterschaft'
    });

    const [gameStats, setGameStats] = useState({});

    useEffect(() => {
        if (onGameActiveChange) {
            onGameActiveChange(gameStarted);
        }
    }, [gameStarted, onGameActiveChange]);

    useEffect(() => {
        const fetchRoster = async () => {
            const q = query(collection(db, "players"), where("teamId", "==", teamId));
            const querySnapshot = await getDocs(q);
            const rosterData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            rosterData.sort((a, b) => Number(a.number) - Number(b.number));
            setAllPlayers(rosterData);
        };
        fetchRoster();
    }, [teamId]);

    const togglePlayer = (id) => {
        setSelectedIds(prev => {
            const isSelected = prev.includes(id);
            if (isSelected) {
                const updated = prev.filter(pId => pId !== id);
                const newLineup = { ...lineup };
                delete newLineup[id];
                setLineup(newLineup);
                return updated;
            } else {
                setLineup({ ...lineup, [id]: 'Block 1' });
                return [...prev, id];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.length === allPlayers.length) {
            setSelectedIds([]);
            setLineup({});
        } else {
            setSelectedIds(allPlayers.map(p => p.id));
            const defaultLineup = {};
            allPlayers.forEach(p => defaultLineup[p.id] = 'Block 1');
            setLineup(defaultLineup);
        }
    };

    const handleLineChange = (playerId, blockName) => {
        setLineup(prev => ({ ...prev, [playerId]: blockName }));
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
                meta: { ...gameInfo, gameMode },
                stats: gameStats,
                lineup: lineup,
                timestamp: new Date().toISOString(),
                teamId: teamId
            };

            await addDoc(collection(db, "games"), gameDocument);
            alert("Spiel erfolgreich gespeichert!");
            setGameStarted(false);
            setSelectedIds([]);
            setLineup({});
            setGameInfo({ date: new Date().toISOString().split('T')[0], opponent: '', type: 'Meisterschaft' });
        } catch (error) {
            console.error("Fehler beim Speichern:", error);
            alert("Fehler beim Speichern des Spiels.");
        } finally {
            setIsSaving(false);
        }
    };

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

                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.5rem' }}>Spielmodus / Feldgrösse:</label>
                    <select value={gameMode} onChange={e => setGameMode(e.target.value)}>
                        <option value="kleinfeld">Kleinfeld (3er Blöcke)</option>
                        <option value="grossfeld">Grossfeld (5er Blöcke)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '0.5rem' }}>
                    <h3>Match-Kader & Linien</h3>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        style={{ width: 'auto', height: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '4px', background: 'var(--surface-alt)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                    >
                        {selectedIds.length === allPlayers.length && allPlayers.length > 0 ? 'Alle abwählen' : 'Alle auswählen'}
                    </button>
                </div>

                <div className="setup-list">
                    {allPlayers.map(p => {
                        const isSelected = selectedIds.includes(p.id);
                        return (
                            <div key={p.id} className="setup-item" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={isSelected} onChange={() => togglePlayer(p.id)} />
                                    <span>#{p.number} {p.name} ({p.position})</span>
                                </label>

                                {isSelected && p.position !== 'Torhüter' && (
                                    <select
                                        value={lineup[p.id] || 'Block 1'}
                                        onChange={(e) => handleLineChange(p.id, e.target.value)}
                                        style={{ padding: '0.3rem', fontSize: '0.9rem', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                                    >
                                        <option value="Block 1">Block 1</option>
                                        <option value="Block 2">Block 2</option>
                                        <option value="Block 3">Block 3</option>
                                        <option value="Block 4">Block 4</option>
                                        <option value="Ersatz">Ersatz</option>
                                    </select>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button className="btn-start" onClick={handleStartGame} disabled={selectedIds.length === 0 || !gameInfo.opponent.trim()}>
                    Spiel starten
                </button>
            </div>
        );
    }

    const activePlayers = allPlayers.filter(p => selectedIds.includes(p.id));

    const blocks = ['Block 1', 'Block 2', 'Block 3', 'Block 4', 'Ersatz'];
    const groupedPlayers = {};
    blocks.forEach(b => groupedPlayers[b] = []);

    const goaliesList = [];

    activePlayers.forEach(p => {
        if (p.position === 'Torhüter') {
            goaliesList.push(p);
        } else {
            const block = lineup[p.id] || 'Block 1';
            if (groupedPlayers[block]) {
                groupedPlayers[block].push(p);
            } else {
                groupedPlayers['Block 1'].push(p);
            }
        }
    });

    return (
        <div className="tracker-container">
            <div className="tracker-header">
                <div className="game-meta-display">
                    <strong>{gameInfo.type}</strong> vs {gameInfo.opponent} ({gameInfo.date.split('-').reverse().join('.')}) [{gameMode === 'grossfeld' ? 'Grossfeld' : 'Kleinfeld'}]
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

            <div className="player-list" style={{ gap: '1rem' }}>
                {blocks.map(blockName => {
                    const blockPlayers = groupedPlayers[blockName];
                    if (blockPlayers.length === 0) return null;

                    return (
                        <div key={blockName} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <h4 style={{ color: '#2C99FE', fontSize: '0.95rem', borderBottom: '1px solid #2C99FE', paddingBottom: '0.1rem', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {blockName}
                            </h4>
                            {blockPlayers.map(player => (
                                <PlayerRow
                                    key={player.id}
                                    player={player}
                                    currentPeriod={currentPeriod}
                                    playerStats={gameStats[player.id]}
                                    onUpdateStat={(period, stat, val) => updateGlobalStat(player.id, period, stat, val)}
                                />
                            ))}
                        </div>
                    );
                })}

                {goaliesList.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                        <h4 style={{ color: '#28a745', fontSize: '0.95rem', borderBottom: '1px solid #28a745', paddingBottom: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Torhüter
                        </h4>
                        {goaliesList.map(player => (
                            <PlayerRow
                                key={player.id}
                                player={player}
                                currentPeriod={currentPeriod}
                                playerStats={gameStats[player.id]}
                                onUpdateStat={(period, stat, val) => updateGlobalStat(player.id, period, stat, val)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function PlayerRow({ player, currentPeriod, playerStats, onUpdateStat }) {

    const StatButton = ({ label, statKey }) => (
        <div className="stat-box-compact">
            <span className="stat-label-compact">{label}</span>
            <div className="stat-controls-compact">
                <button onClick={() => onUpdateStat(currentPeriod, statKey, -1)} className="btn-minus-compact"><FaMinus /></button>
                <span className="stat-value-compact">{playerStats[currentPeriod][statKey]}</span>
                <button onClick={() => onUpdateStat(currentPeriod, statKey, 1)} className="btn-plus-compact"><FaPlus /></button>
            </div>
        </div>
    );

    return (
        <div className="player-row-compact">
            <div className="player-info-compact">
                <span className="player-number">#{player.number}</span>
                <span className="player-name">{player.name}</span>
                <span className="player-pos-badge">{player.position}</span>
            </div>

            <div className="player-stats-compact">
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
                        <StatButton label="Schuss T." statKey="shotsOnGoal" />
                        <StatButton label="Daneben" statKey="shotsMissed" />
                        <StatButton label="Block" statKey="shotsBlocked" />
                        <StatButton label="Pass" statKey="passes" />
                    </>
                )}
            </div>
        </div>
    );
}