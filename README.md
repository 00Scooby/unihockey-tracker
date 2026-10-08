# Unihockey Tracker 🏑

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)

Eine leistungsstarke **Offline-First Progressive Web App (PWA)**, die speziell zur Erfassung von Spielerstatistiken während eines Unihockey-Spiels entwickelt wurde. Die Anwendung ist auf den reibungslosen Einsatz auf Tablets direkt am Spielfeldrand optimiert.

> 🤖 **Hinweis:** Diese App wurde mit der Unterstützung von Künstlicher Intelligenz (KI) entwickelt.

---

## ✨ Funktionen der App

Der Unihockey Tracker bietet alles, was das Trainer- und Betreuerherz begehrt:

- **📡 Offline-Fähigkeit:** Komplette Erfassung von Spieldaten auch ohne aktive Internetverbindung. Perfekt für Sporthallen mit schlechtem Empfang!
- **☁️ Automatische Cloud-Synchronisation:** Sobald wieder eine Internetverbindung besteht, werden alle offline erfassten Daten automatisch in die Cloud übertragen und synchronisiert.
- **📱 Touch-optimierte Bedienung:** Großflächige und einfach zu bedienende Zähler für Tore, Schüsse, Pässe und Plus/Minus-Statistiken. Schnelle Eingabe im Eifer des Gefechts garantiert.
- **🤝 Flexibler Einsatz:** Problemlos team- und kaderübergreifend nutzbar. Mehrere Teams und Spieler können effizient verwaltet werden.
- **🌗 Light & Dark Mode:** Unterstützung für helle und dunkle Darstellungsmodi, um sich den Lichtverhältnissen in der Halle anzupassen.

---

## 🛠️ Tech Stack

Dieses Projekt basiert auf modernen Webtechnologien:

- **Frontend:** [React](https://react.dev/) mit [Vite](https://vitejs.dev/)
- **Datenbank:** [Firebase Firestore](https://firebase.google.com/products/firestore) (als zuverlässige Offline-Datenbank)
- **Hosting:** [Firebase Hosting](https://firebase.google.com/products/hosting)

---

## 🚀 Setup & Installation

Folge diesen Schritten, um das Projekt lokal auf deinem Rechner auszuführen:

1. **Repository klonen**
   ```bash
   git clone <REPOSITORY_URL>
   cd unihockey-tracker
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Lokalen Server starten**
   ```bash
   npm run dev
   ```
   *Die App wird standardmäßig unter `http://localhost:5173` erreichbar sein.*

---

## 🧪 Lokale Entwicklung & Testing

- Um die App lokal mit Playwright zu testen, muss die `teamId` im `localStorage` gesetzt sein (z. B. `localStorage.setItem('teamId', 'testteam')`), um den initialen Setup-Bildschirm zu überspringen.
- Stelle sicher, dass die entsprechenden Firebase-Credentials in einer `.env.local` Datei unter Verwendung des Präfixes `VITE_` konfiguriert sind (z. B. `VITE_FIREBASE_API_KEY`).