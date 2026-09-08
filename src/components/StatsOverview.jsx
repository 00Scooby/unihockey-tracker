import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function StatsOverview({ teamId }) {
    const [players, setPlayers] = useState([]);
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedGame, setExpandedGame] = useState(null);

    // NEU: Erweiterter Filter ('Total', 'Avg', '1', '2', '3', '4')
    const [periodFilter, setPeriodFilter] = useState('Total');

    useEffect(() => {
        fetchData();
    }, [teamId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const playersQuery = query(collection(db, "players"), where("teamId", "==", teamId));
            const gamesQuery = query(collection(db, "games"), where("teamId", "==", teamId));

            const [playersSnap, gamesSnap] = await Promise.all([
                getDocs(playersQuery),
                getDocs(gamesQuery)
            ]);

            const rosterData = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const gamesData = gamesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            gamesData.sort((a, b) => new Date(b.meta.date) - new Date(a.meta.date));

            setPlayers(rosterData.sort((a, b) => Number(a.number) - Number(b.number)));
            setGames(gamesData);
        } catch (error) {
            console.error("Fehler beim Laden der Daten:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGame = async (gameId) => {
        const isConfirmed = window.confirm("Möchtest du dieses Spiel wirklich löschen? Alle zugehörigen Statistiken werden aus der Wertung entfernt.");
        if (isConfirmed) {
            try {
                await deleteDoc(doc(db, "games", gameId));
                setGames(prevGames => prevGames.filter(g => g.id !== gameId));
                if (expandedGame === gameId) setExpandedGame(null);
            } catch (error) {
                console.error("Fehler beim Löschen:", error);
                alert("Fehler beim Löschen. Bitte versuche es erneut.");
            }
        }
    };

    const toggleDetails = (gameId) => {
        setExpandedGame(prev => prev === gameId ? null : gameId);
    };

    const accumulateStats = (target, source) => {
        if (!source) return;
        target.goals += source.goals || 0;
        target.assists += source.assists || 0;
        target.plus += source.plus || 0;
        target.minus += source.minus || 0;
        target.shotsOnGoal += source.shotsOnGoal || 0;
        target.shotsMissed += source.shotsMissed || 0;
        target.shotsBlocked += source.shotsBlocked || 0;
        target.passes += source.passes || 0;
        target.saves += source.saves || 0;
        target.goalsAgainst += source.goalsAgainst || 0;
    };

    const calculateSeasonStats = (playerId) => {
        let stats = { gamesPlayed: 0, goals: 0, assists: 0, plus: 0, minus: 0, shotsOnGoal: 0, shotsMissed: 0, shotsBlocked: 0, passes: 0, saves: 0, goalsAgainst: 0 };

        games.forEach(game => {
            const playerGameData = game.stats[playerId];
            if (playerGameData) {
                stats.gamesPlayed += 1;
                if (periodFilter === 'Total' || periodFilter === 'Avg') {
                    Object.values(playerGameData).forEach(period => accumulateStats(stats, period));
                } else {
                    accumulateStats(stats, playerGameData[periodFilter]);
                }
            }
        });

        // Wenn "Durchschnitt" gewählt ist und der Spieler mindestens 1 Spiel hat, teilen wir die Werte durch die Anzahl Spiele
        const gp = stats.gamesPlayed > 0 ? stats.gamesPlayed : 1;
        const isAvg = periodFilter === 'Avg';

        const finalGoals = isAvg ? stats.goals / gp : stats.goals;
        const finalAssists = isAvg ? stats.assists / gp : stats.assists;
        const finalPlus = isAvg ? stats.plus / gp : stats.plus;
        const finalMinus = isAvg ? stats.minus / gp : stats.minus;
        const finalShots = isAvg ? stats.shotsOnGoal / gp : stats.shotsOnGoal;
        const finalMissed = isAvg ? stats.shotsMissed / gp : stats.shotsMissed;
        const finalBlocked = isAvg ? stats.shotsBlocked / gp : stats.shotsBlocked;
        const finalPasses = isAvg ? stats.passes / gp : stats.passes;
        const finalSaves = isAvg ? stats.saves / gp : stats.saves;
        const finalGoalsAgainst = isAvg ? stats.goalsAgainst / gp : stats.goalsAgainst;

        const formatVal = (val) => isAvg ? val.toFixed(1) : val;

        return {
            gamesPlayed: stats.gamesPlayed,
            goals: formatVal(finalGoals),
            assists: formatVal(finalAssists),
            plus: formatVal(finalPlus),
            minus: formatVal(finalMinus),
            shotsOnGoal: formatVal(finalShots),
            shotsMissed: formatVal(finalMissed),
            shotsBlocked: formatVal(finalBlocked),
            passes: formatVal(finalPasses),
            saves: formatVal(finalSaves),
            goalsAgainst: formatVal(finalGoalsAgainst),
            points: isAvg ? (Number(formatVal(finalGoals)) + Number(formatVal(finalAssists))).toFixed(1) : stats.goals + stats.assists,
            diff: isAvg ? (Number(formatVal(finalPlus)) - Number(formatVal(finalMinus))).toFixed(1) : stats.plus - stats.minus,
            savePercentage: stats.saves + stats.goalsAgainst > 0 ? ((stats.saves / (stats.saves + stats.goalsAgainst)) * 100).toFixed(1) : 0,
            rawPoints: stats.goals + stats.assists // Für exakte Sortierung bei Avg
        };
    };

    const calculateSingleGameStats = (game, playerId) => {
        let stats = { goals: 0, assists: 0, plus: 0, minus: 0, shotsOnGoal: 0, shotsMissed: 0, shotsBlocked: 0, passes: 0, saves: 0, goalsAgainst: 0 };
        const playerGameData = game.stats[playerId];

        if (playerGameData) {
            if (periodFilter === 'Total' || periodFilter === 'Avg') {
                Object.values(playerGameData).forEach(period => accumulateStats(stats, period));
            } else {
                accumulateStats(stats, playerGameData[periodFilter]);
            }
        }

        return {
            ...stats,
            points: stats.goals + stats.assists,
            diff: stats.plus - stats.minus,
            savePercentage: stats.saves + stats.goalsAgainst > 0 ? ((stats.saves / (stats.saves + stats.goalsAgainst)) * 100).toFixed(1) : 0
        };
    };

    // Saison-Sortierung Feldspieler (nach Punkten, bei Avg nach rawPoints)
    const fieldPlayers = players
        .filter(p => p.position === 'Feldspieler')
        .map(p => ({ ...p, stats: calculateSeasonStats(p.id) }))
        .sort((a, b) => {
            if (Number(b.stats.points) !== Number(a.stats.points)) return Number(b.stats.points) - Number(a.stats.points);
            return Number(b.stats.goals) - Number(a.stats.goals);
        });

    // Saison-Sortierung Torhüter
    const goalies = players
        .filter(p => p.position === 'Torhüter')
        .map(p => ({ ...p, stats: calculateSeasonStats(p.id) }))
        .sort((a, b) => b.stats.savePercentage - a.stats.savePercentage);

    if (loading) return <div className="stats-container"><h2>Lade Statistiken...</h2></div>;

    const getFilterLabel = () => {
        if (periodFilter === 'Total') return 'Saison Total';
        if (periodFilter === 'Avg') return 'Saison Durchschnitt (pro Spiel)';
        return `${periodFilter}. Drittel`;
    };

    return (
        <div className="stats-container">
            <div className="stats-header-container">
                <h2>Saisonstatistik</h2>

                <div className="filter-section">
                    <label htmlFor="period-filter">Ansicht: </label>
                    <select
                        id="period-filter"
                        className="filter-select"
                        value={periodFilter}
                        onChange={(e) => setPeriodFilter(e.target.value)}
                    >
                        <option value="Total">Saison Total (kumuliert)</option>
                        <option value="Avg">Saison Durchschnitt (pro Spiel)</option>
                        <option value="1">1. Drittel</option>
                        <option value="2">2. Drittel</option>
                        <option value="3">3. Drittel</option>
                        <option value="4">Verlängerung</option>
                    </select>
                </div>
            </div>

            {/* --- SAISON TABELLEN --- */}
            <div className="stats-table-wrapper">
                <h3>Feldspieler ({getFilterLabel()})</h3>
                <table className="stats-table">
                    <thead>
                        <tr>
                            <th>Nr.</th>
                            <th>Name</th>
                            <th>Spiele</th>
                            <th>Tore</th>
                            <th>Assists</th>
                            <th>Punkte</th>
                            <th>+/-</th>
                            <th>Schuss T.</th>
                            <th>Daneben</th>
                            <th>Block</th>
                            <th>Pässe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fieldPlayers.map(p => {
                            const s = p.stats;
                            return (
                                <tr key={p.id}>
                                    <td>{p.number}</td>
                                    <td>{p.name}</td>
                                    <td>{s.gamesPlayed}</td>
                                    <td>{s.goals}</td>
                                    <td>{s.assists}</td>
                                    <td><strong>{s.points}</strong></td>
                                    <td className={Number(s.diff) >= 0 ? 'positive-stat' : 'negative-stat'}>
                                        {Number(s.diff) > 0 ? `+${s.diff}` : s.diff}
                                    </td>
                                    <td>{s.shotsOnGoal}</td>
                                    <td>{s.shotsMissed}</td>
                                    <td>{s.shotsBlocked}</td>
                                    <td>{s.passes}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="stats-table-wrapper">
                <h3>Torhüter ({getFilterLabel()})</h3>
                <table className="stats-table">
                    <thead>
                        <tr>
                            <th>Nr.</th>
                            <th>Name</th>
                            <th>Spiele</th>
                            <th>Tore</th>
                            <th>Assists</th>
                            <th>Gehalten</th>
                            <th>Gegentore</th>
                            <th>Quote</th>
                            <th>Pässe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {goalies.map(p => {
                            const s = p.stats;
                            return (
                                <tr key={p.id}>
                                    <td>{p.number}</td>
                                    <td>{p.name}</td>
                                    <td>{s.gamesPlayed}</td>
                                    <td>{s.goals}</td>
                                    <td>{s.assists}</td>
                                    <td>{s.saves}</td>
                                    <td>{s.goalsAgainst}</td>
                                    <td><strong>{s.savePercentage}%</strong></td>
                                    <td>{s.passes}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* --- SPIELÜBERSICHT --- */}
            <div className="stats-table-wrapper" style={{ marginTop: '3rem' }}>
                <h3>Erfasste Spiele</h3>
                {games.length === 0 ? (
                    <p>Noch keine Spiele gespeichert.</p>
                ) : (
                    <ul className="game-history-list">
                        {games.map(game => (
                            <li key={game.id} className="game-history-item-container">
                                <div className="game-history-item">
                                    <div className="game-info">
                                        <strong>{game.meta?.date?.split('-').reverse().join('.')}</strong>
                                        <span className="game-type-badge">{game.meta?.type}</span>
                                        <span>vs. {game.meta?.opponent}</span>
                                    </div>
                                    <div className="game-actions-list">
                                        <button onClick={() => toggleDetails(game.id)} className="btn-details">
                                            {expandedGame === game.id ? 'Schliessen' : 'Details'}
                                        </button>
                                        <button onClick={() => handleDeleteGame(game.id)} className="btn-delete">Löschen</button>
                                    </div>
                                </div>

                                {expandedGame === game.id && (
                                    <div className="game-details-box">
                                        <div className="stats-table-wrapper" style={{ margin: '0 0 1rem 0', padding: '0', boxShadow: 'none' }}>
                                            <h4 style={{ color: '#2C99FE', marginBottom: '0.5rem' }}>
                                                Feldspieler (Statistik: {getFilterLabel()})
                                            </h4>
                                            <table className="stats-table small-table">
                                                <thead>
                                                    <tr><th>Nr.</th><th>Name</th><th>Tore</th><th>Assists</th><th>Punkte</th><th>+/-</th><th>Schuss</th><th>Daneben</th><th>Block</th><th>Pässe</th></tr>
                                                </thead>
                                                <tbody>
                                                    {players
                                                        .filter(p => p.position === 'Feldspieler' && game.stats[p.id])
                                                        .map(p => ({ ...p, singleStats: calculateSingleGameStats(game, p.id) }))
                                                        .sort((a, b) => {
                                                            if (b.singleStats.points !== a.singleStats.points) return b.singleStats.points - a.singleStats.points;
                                                            return b.singleStats.goals - a.singleStats.goals;
                                                        })
                                                        .map(p => {
                                                            const s = p.singleStats;
                                                            return (
                                                                <tr key={p.id}>
                                                                    <td>{p.number}</td>
                                                                    <td>{p.name}</td>
                                                                    <td>{s.goals}</td>
                                                                    <td>{s.assists}</td>
                                                                    <td><strong>{s.points}</strong></td>
                                                                    <td className={s.diff >= 0 ? 'positive-stat' : 'negative-stat'}>{s.diff > 0 ? `+${s.diff}` : s.diff}</td>
                                                                    <td>{s.shotsOnGoal}</td>
                                                                    <td>{s.shotsMissed}</td>
                                                                    <td>{s.shotsBlocked}</td>
                                                                    <td>{s.passes}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="stats-table-wrapper" style={{ margin: '0', padding: '0', boxShadow: 'none' }}>
                                            <h4 style={{ color: '#2C99FE', marginBottom: '0.5rem' }}>
                                                Torhüter (Statistik: {getFilterLabel()})
                                            </h4>
                                            <table className="stats-table small-table">
                                                <thead>
                                                    <tr><th>Nr.</th><th>Name</th><th>Tore</th><th>Assists</th><th>Gehalten</th><th>Gegentore</th><th>Quote</th><th>Pässe</th></tr>
                                                </thead>
                                                <tbody>
                                                    {players
                                                        .filter(p => p.position === 'Torhüter' && game.stats[p.id])
                                                        .map(p => ({ ...p, singleStats: calculateSingleGameStats(game, p.id) }))
                                                        .sort((a, b) => b.singleStats.savePercentage - a.singleStats.savePercentage)
                                                        .map(p => {
                                                            const s = p.singleStats;
                                                            return (
                                                                <tr key={p.id}>
                                                                    <td>{p.number}</td>
                                                                    <td>{p.name}</td>
                                                                    <td>{s.goals}</td>
                                                                    <td>{s.assists}</td>
                                                                    <td>{s.saves}</td>
                                                                    <td>{s.goalsAgainst}</td>
                                                                    <td><strong>{s.savePercentage}%</strong></td>
                                                                    <td>{s.passes}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}