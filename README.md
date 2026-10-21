# MediaFriend 🏑📸

**MediaFriend** är en modern mobil- och webbtjänst för innebandyföreningar som automatiserar skapandet av matchplanscher och inlägg för Instagram (både 4:5 Feed och 9:16 Story) för att locka mer publik till matcherna.

---

## 🚀 Teknikstack

- **Mobilapp (`mobile/`):**
  - **React Native & Expo (SDK 57)**
  - **TypeScript**
  - **TanStack React Query** (caching & matchsynk)
  - **Better Auth Client** (autentisering & sessioner)
  - **Expo Sharing & Clipboard** (dela direkt till Instagram + 1-klick för caption & hashtags)
  - **Expo Image Picker** (välj spelarbild & ladda upp högupplöst klubbmärke)

- **Backend (`server/`):**
  - **Hono (TypeScript)**
  - **Better Auth** (med SQLite-databas)
  - **iBIS Innebandy API-klient** (hämtar hemmamatcher, officiella laglogotyper och tröjfärger)
  - **Image Generation / ComfyUI Integration** (Pinokio-koppling för AI-bakgrunder, med lokal fallback)
  - **Zod & CORS**

---

## 📁 Projektstruktur

```
MediaFriend/
├── mobile/               # Expo React Native mobilapp
│   ├── app/              # Expo Router skärmar (hem, matcher, skapa plansch, inställningar)
│   ├── components/       # Återanvändbara UI-komponenter & plansch-canvas
│   ├── lib/              # API-klient, React Query setup, Better Auth client
│   └── package.json
│
├── server/               # Hono TypeScript backend
│   ├── src/
│   │   ├── ibis/         # Svensk Innebandy iBIS API-klient (TypeScript)
│   │   ├── routes/       # Hono rutter (matcher, föreningar, planscher, AI)
│   │   ├── auth.ts       # Better Auth konfiguration
│   │   └── index.ts      # Server entrypoint
│   └── package.json
│
└── README.md
```

---

## 🏃 Kom igång

### 1. Starta Hono-servern
```bash
cd server
npm install
npm run dev
```
Servern körs på: `http://localhost:3000`

### 2. Starta mobilappen
```bash
cd mobile
npm install
npx expo start
```
Skanna QR-koden med **Expo Go** på din iPhone eller Android-telefon!
