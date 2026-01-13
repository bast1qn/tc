# Town & Country Haus - Gewährleistungsanfrage

Eine Next.js 14+ Webanwendung zur Verwaltung von Gewährleistungsanfragen für Town & Country Haus.

## Funktionen

### Gewährleistungsformular (`/`)
- Vollständiges Anfrageformular mit allen erforderlichen Feldern
- Datei-Upload für Bilder und Dokumente (JPG, PNG, GIF, WebP, PDF)
- DSGVO-Einwilligung mit Verlinkung zur Datenschutzerklärung
- reCAPTCHA-Platzhalter (für Produktionsumgebung)
- Formularvalidierung und Fehlermeldungen
- Erfolgsmeldung nach Absenden
- FAQ-Bereich mit häufig gestellten Fragen

### Admin Dashboard (`/admin`)
- Übersicht aller Gewährleistungsanfragen
- Such- und Filterfunktionen
- Sortierbare Tabellenspalten
- Status-Verwaltung (Offen / In Bearbeitung / Erledigt)
- Detailansicht für jede Anfrage
- Excel-Export der gefilterten Daten
- Löschfunktion für Anfragen

### Technische Features
- Datenpersistenz über localStorage
- Responsive Design (Mobile-First)
- Town & Country Haus Branding (#E30613)
- shadcn/ui Komponenten
- TypeScript für Typsicherheit
- Barrierefreiheit (ARIA-Attribute)

## Technologie-Stack

- **Framework:** Next.js 14+ (App Router)
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI-Komponenten:** shadcn/ui
- **Icons:** Lucide React
- **Excel-Export:** xlsx
- **Toast-Benachrichtigungen:** Sonner
- **Schriftart:** Outfit (Google Fonts)

## Installation

```bash
# Repository klonen
git clone <repository-url>
cd tc-warranty-form

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Die Anwendung ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Verfügbare Skripte

```bash
# Entwicklungsserver
npm run dev

# Produktions-Build erstellen
npm run build

# Produktionsserver starten
npm run start

# Linting
npm run lint
```

## Deployment auf Vercel

### Option 1: Vercel Dashboard (Empfohlen)

1. Repository auf GitHub pushen
2. [Vercel](https://vercel.com) besuchen und mit GitHub anmelden
3. "New Project" klicken
4. Repository auswählen und importieren
5. "Deploy" klicken

### Option 2: Vercel CLI

```bash
# Vercel CLI installieren
npm i -g vercel

# Deployment starten
vercel

# Für Produktion deployen
vercel --prod
```

### Umgebungsvariablen (Optional)

Für die Produktionsumgebung können folgende Umgebungsvariablen in Vercel konfiguriert werden:

| Variable | Beschreibung |
|----------|--------------|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA Site Key |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA Secret Key |

## Projektstruktur

```
tc-warranty-form/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx          # Admin Dashboard
│   │   ├── globals.css           # Globale Styles
│   │   ├── layout.tsx            # Root Layout
│   │   └── page.tsx              # Gewährleistungsformular
│   ├── components/
│   │   ├── ui/                   # shadcn/ui Komponenten
│   │   ├── AdminDashboard.tsx    # Dashboard Komponente
│   │   ├── FAQ.tsx               # FAQ Accordion
│   │   ├── Footer.tsx            # Footer
│   │   ├── Header.tsx            # Header mit Navigation
│   │   └── WarrantyForm.tsx      # Formular Komponente
│   ├── lib/
│   │   ├── storage.ts            # localStorage Utilities
│   │   └── utils.ts              # Hilfsfunktionen
│   └── types/
│       └── warranty.ts           # TypeScript Typen
├── public/                       # Statische Dateien
├── next.config.ts                # Next.js Konfiguration
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Hinweise zur Datenspeicherung

Diese Demo-Anwendung verwendet `localStorage` zur Datenspeicherung. Für eine Produktionsumgebung sollte eine Backend-Datenbank (z.B. PostgreSQL, MongoDB) implementiert werden.

**Wichtig:** Die Daten werden nur lokal im Browser gespeichert und gehen verloren, wenn der Browser-Cache gelöscht wird.

## Anpassungen für Produktion

Für den Produktionseinsatz sollten folgende Anpassungen vorgenommen werden:

1. **Backend-Integration:** Ersetzen Sie localStorage durch eine echte Datenbank
2. **reCAPTCHA:** Implementieren Sie Google reCAPTCHA v3
3. **E-Mail-Benachrichtigungen:** Fügen Sie E-Mail-Versand für Bestätigungen hinzu
4. **Authentifizierung:** Schützen Sie den Admin-Bereich mit Login
5. **Datei-Upload:** Nutzen Sie einen Cloud-Speicher (z.B. AWS S3, Cloudinary)

## Lizenz

Dieses Projekt ist eine Demo-Anwendung für Town & Country Haus.
