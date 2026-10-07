import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function RosterManager({ teamId }) {
    const [players, setPlayers] = useState([]);
    const [newPlayer, setNewPlayer] = useState({ name: '', number: '', position: 'Feldspieler' });

    // Passwort-State
    const [teamPassword, setTeamPassword] = useState('');
    const [passwordMsg, setPasswordMsg] = useState('');

    const fetchRoster = async () => {
        const q = query(collection(db, "players"), where("teamId", "==", teamId));
        const querySnapshot = await getDocs(q);
        const rosterData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        rosterData.sort((a, b) => Number(a.number) - Number(b.number));
        setPlayers(rosterData);
    };

    const fetchTeamSecurity = async () => {
        try {
            const teamDocRef = doc(db, "teams", teamId);
            const teamSnap = await getDoc(teamDocRef);
            if (teamSnap.exists() && teamSnap.data().password) {
                setTeamPassword(teamSnap.data().password);
            }
        } catch (error) {
            console.error("Fehler beim Laden der Sicherheitseinstellungen:", error);
        }
    };

    useEffect(() => {
        fetchRoster();
        fetchTeamSecurity();
    }, [teamId]);

    const handleSavePassword = async (e) => {
        e.preventDefault();
        try {
            const teamDocRef = doc(db, "teams", teamId);
            if (teamPassword.trim() === '') {
                await setDoc(teamDocRef, { password: '' }, { merge: true });
                setPasswordMsg('Passwortschutz wurde entfernt.');
            } else {
                await setDoc(teamDocRef, { password: teamPassword.trim() }, { merge: true });
                setPasswordMsg('Passwort erfolgreich gespeichert!');
            }
            setTimeout(() => setPasswordMsg(''), 3000);
        } catch (error) {
            console.error("Fehler beim Speichern des Passworts:", error);
            setPasswordMsg('Fehler beim Speichern.');
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newPlayer.name || !newPlayer.number) return;

        await addDoc(collection(db, "players"), {
            ...newPlayer,
            teamId: teamId
        });

        setNewPlayer({ name: '', number: '', position: 'Feldspieler' });
        fetchRoster();
    };

    const handleDelete = async (id) => {
        await deleteDoc(doc(db, "players", id));
        fetchRoster();
    };

    return (
        <div className="roster-container">
            <h2>Kaderverwaltung ({teamId})</h2>

            {/* SICHERHEITS-BEREICH: PASSWORT VERWALTEN */}
            <div className="stats-table-wrapper" style={{ padding: '1.2rem', marginBottom: '2rem', marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-color)' }}>Team-Sicherheit (Passwortschutz)</h3>
                <form onSubmit={handleSavePassword} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                        type="password"
                        placeholder="Neues Passwort (leer lassen für keins)..."
                        value={teamPassword}
                        onChange={(e) => setTeamPassword(e.target.value)}
                        style={{ flex: '1 1 200px', padding: '0.8rem', border: '1px solid var(--input-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                    />
                    <button type="submit" className="btn-add" style={{ width: 'auto', padding: '0.8rem 1.2rem' }}>
                        Speichern
                    </button>
                </form>
                {passwordMsg && <p style={{ fontSize: '0.85rem', color: '#28a745', marginTop: '0.5rem' }}>{passwordMsg}</p>}
            </div>

            <form onSubmit={handleAdd} className="add-player-form">
                <input type="number" placeholder="Nr." value={newPlayer.number} onChange={e => setNewPlayer({ ...newPlayer, number: e.target.value })} />
                <input type="text" placeholder="Name" value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} />
                <select value={newPlayer.position} onChange={e => setNewPlayer({ ...newPlayer, position: e.target.value })}>
                    <option value="Feldspieler">Feldspieler</option>
                    <option value="Torhüter">Torhüter</option>
                </select>
                <button type="submit" className="btn-add">Hinzufügen</button>
            </form>

            <ul className="player-list-simple">
                {players.map(p => (
                    <li key={p.id}>
                        <span>#{p.number} {p.name} ({p.position})</span>
                        <button onClick={() => handleDelete(p.id)} className="btn-delete">Löschen</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}