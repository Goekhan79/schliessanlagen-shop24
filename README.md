# Schließanlagen Shop24 – Full-Stack-Prototyp

## Was enthalten ist
- Next.js + React + TypeScript
- SQLite-Datenbank via better-sqlite3
- Produktdatenbank mit Seed-Produkten
- echter 4-Schritt-Konfigurator
- dynamische Preislogik im Konfigurator
- Bestell-API und Speicherung von Kunden-/Konfigurationsdaten
- Order-Items
- Adminbereich unter `/admin`
- Produktanlage über Admin-API/UI
- Bestellstatus-Verwaltung
- responsive Oberfläche

## Lokal starten
Voraussetzung: Node.js 20+.

```bash
npm install
npm run dev
```

Danach:
- Shop: http://localhost:3000
- Admin: http://localhost:3000/admin

Die SQLite-Datei wird beim ersten Start unter `data/shop.db` angelegt.

## Wichtige Hinweise für den Livegang
Dieser Stand ist ein funktionsfähiger Entwicklungsprototyp, aber noch kein produktionsreifer Shop. Vor dem Livegang sollten mindestens ergänzt werden:
- Admin-Login/Authentifizierung und Rollen
- CSRF-/Rate-Limit-/Input-Schutz
- PostgreSQL oder MySQL statt SQLite bei größerem Betrieb
- echte Hersteller- und Produktdaten
- belastbare Preis-/Produktlogik für Schließanlagen
- PDF-Schließplan
- E-Mail-Bestellbestätigung
- Zahlungsanbieter (z.B. Stripe/PayPal) und sichere Checkout-Logik
- Versandkosten, Steuer-/Rechnungslogik
- Impressum, Datenschutz, AGB, Widerrufsbelehrung und rechtlich geprüfte Checkout-Texte
- Backups, Logging, Monitoring und Deployment-Konfiguration
