import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function RosterManager({ teamId }) {
    const [players, setPlayers] = useState([]);
    const [newPlayer, setNewPlayer] = useState({ name: '', number: '', position: 'Feldspieler' });

    const fetchRoster = async () => {
        // Filtert Spieler, die genau zu diesem Team gehören
        const q = query(collection(db, "players"), where("teamId", "==", teamId));
        const querySnapshot = await getDocs(q);
        const rosterData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        rosterData.sort((a, b) => Number(a.number) - Number(b.number));
        setPlayers(rosterData);
    };

    useEffect(() => { fetchRoster(); }, [teamId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newPlayer.name || !newPlayer.number) return;

        // Speichert den neuen Spieler zusammen mit der teamId
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
            <h2>Kaderverwaltung</h2>

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