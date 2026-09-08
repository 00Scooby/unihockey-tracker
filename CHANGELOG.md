# Changelog

## [0.1.4-beta] - 2026-09-08

### Added
- Erweiterte Ansicht in der Saisonstatistik für Feldspieler: Nun werden neben Toren und Assists auch Schüsse aufs Tor, Fehlschüsse, Blocks und Pässe vollständig angezeigt.
- Umschaltoption zwischen "Saison Total (kumuliert)" und "Saison Durchschnitt (pro Spiel)" im Statistik-Filter.

## [0.1.3-beta] - 2026-09-08

### Added
- Optionaler Passwortschutz für Teams implementiert (einrichtbar in der Kaderverwaltung, abfragbar beim Team-Login).
- Sicherheits-Guard bei aktivem Spiel eingebaut, der vor ungespeicherten Datenverlusten beim Verlassen schützt.
- Versionsnummer in der App-Oberfläche integriert.

### Changed
- Ultrakompaktes Layout für den Live-Tracker optimiert, damit mehr Spieler gleichzeitig ohne Scrollen sichtbar sind.
- Kader-Formular für Tablets optimiert (Speichern-Button bricht nun sauber im Raster um).
## [0.1.2-beta] - 2026-09-08

### Added
- Umschaltbarer Darkmode (inkl. Speicherung im LocalStorage) für angenehmes Tracking bei unterschiedlichen Lichtverhältnissen.

### Fixed
- Textdarstellung und Lesbarkeit bei Dropdown-Menüs (Drittelauswahl) in beiden Farbmodi behoben.
- Automatische Sortierung der Spieler in Saison- und Spiel-Statistiken nach Leistung (Feldspieler nach Scorerpunkten, Torhüter nach Fangquote).

## [0.1.1-beta] - 2026-09-08

### Added
- Generische Unihockey-Icons (`logo.svg`, `icons.svg`, `favicon.svg`) für PWA-Manifest und Browser-Tab implementiert.

## [0.1.0-beta] - 2026-09-08

### Added
- Initiale Progressive Web App (PWA) Struktur für Offline-Nutzung am Spielfeldrand.
- Multi-Team Support (Mandantenfähigkeit via Team-Code).
- Kaderverwaltung mit automatischer Firebase Firestore Synchronisation.
- Live-Tracker für Spiele mit drittelspezifischer Erfassung (Tore, Assists, Schüsse, Plus/Minus, Saves).
- Saisonstatistik-Dashboard mit Filter nach Spielabschnitten (Total, 1. Drittel, 2. Drittel, 3. Drittel, Verlängerung).
- Spielübersicht mit Akkordeon-Detailansicht für vergangene Matches und Löschfunktion.