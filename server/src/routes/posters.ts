import { Hono } from "hono";
import { dbInstance } from "../auth.js";
import { randomUUID } from "node:crypto";

export const posterRoutes = new Hono();

// Färdiga teman för matchplanscher
export const POSTER_THEMES = [
  {
    id: "epic-smoke",
    name: "Episk Rök & Klubbglöd",
    description: "Dramatisk rök, spotlight på spelaren och pulserande klubbfärger",
    promptPrefix: "dramatic sports arena background, volumetric red and blue smoke, dynamic floorball stadium lights, cinematic atmosphere, 8k, sharp focus, professional sports poster",
    primaryGradient: ["#1a0808", "#3d0c0c", "#7a1515"],
    accentColor: "#ff4d4d",
  },
  {
    id: "neon-cyber",
    name: "Mörk Arena & Neon",
    description: "Mörkt golv med elektriska neonlinjer och speglingar",
    promptPrefix: "dark floorball arena at night, electric cyan and magenta neon light beams, polished reflective court floor, high energy sports photography, volumetric rim light",
    primaryGradient: ["#050814", "#0a1329", "#11224d"],
    accentColor: "#00e5ff",
  },
  {
    id: "clean-pro",
    name: "Klassisk & Ren Sportgrafik",
    description: "Skarp, modern proffsgrafik med rena vinklar och klubbfärger",
    promptPrefix: "modern sports broadcast studio backdrop, clean geometrical angled light panels, sleek athletic design, high contrast arena lighting",
    primaryGradient: ["#0f172a", "#1e293b", "#334155"],
    accentColor: "#38bdf8",
  },
  {
    id: "gold-champions",
    name: "Guld & Seger",
    description: "Exklusiv guld- och kolfiberlook för stormatcher och slutspel",
    promptPrefix: "luxurious sports champion celebration backdrop, gold dust particles floating in spotlight, deep carbon fiber texture, dramatic golden rim light",
    primaryGradient: ["#141108", "#2b2310", "#473b18"],
    accentColor: "#eab308",
  },
];

// Hämta tillgängliga teman
posterRoutes.get("/themes", (c) => {
  return c.json({ themes: POSTER_THEMES });
});

// Generera färdig Instagram-caption med hashtags baserat på matchdata
posterRoutes.post("/generate-caption", async (c) => {
  const body = await c.req.json();
  const { homeTeam, awayTeam, matchDateTime, venue, customText, ticketUrl } = body;

  const dateObj = matchDateTime ? new Date(matchDateTime) : new Date();
  const dayNames = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
  const dayName = dayNames[dateObj.getDay()];
  const timeStr = dateObj.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  const dateStr = dateObj.toLocaleDateString("sv-SE", { day: "numeric", month: "long" });

  const cleanHome = (homeTeam || "Hemmalaget").replace(/\s*IBK|\s*IBF|\s*IK/gi, "");
  const cleanAway = (awayTeam || "Bortalaget").replace(/\s*IBK|\s*IBF|\s*IK/gi, "");

  let caption = `🔥 MATCHDAG! 🔥\n\n`;
  caption += `På ${dayName.toLowerCase()} (${dateStr}) smäller det när ${homeTeam} tar emot ${awayTeam} hemma i ${venue || "hallen"} kl. ${timeStr}!\n\n`;

  if (customText && customText.trim().length > 0) {
    caption += `📢 ${customText.trim()}\n\n`;
  }

  caption += `Kom och lyft laget till 3 poäng – vi ses på läktaren! 🏑💥\n\n`;

  if (ticketUrl) {
    caption += `🎟️ Säkra din plats: ${ticketUrl}\n\n`;
  }

  caption += `.\n.\n.\n`;
  caption += `#${cleanHome.replace(/\s+/g, "")} #${cleanAway.replace(/\s+/g, "")} #Innebandy #Matchdag #SvenskInnebandy #SSL #Innebandyfest #Hemmahall #MediaFriend`;

  return c.json({ caption });
});

// Spara eller hämta föreningsprofil (med logotyp och färger)
posterRoutes.get("/club-profile", (c) => {
  const profile = dbInstance.prepare("SELECT * FROM club_profiles ORDER BY updatedAt DESC LIMIT 1").get();
  return c.json({ profile: profile || null });
});

posterRoutes.post("/club-profile", async (c) => {
  const body = await c.req.json();
  const { clubName, defaultVenue, primaryColor, secondaryColor, logoUrl, userId } = body;

  const id = randomUUID();
  const now = new Date().toISOString();

  dbInstance.prepare(`
    INSERT INTO club_profiles (id, userId, clubName, defaultVenue, primaryColor, secondaryColor, logoUrl, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId || "default_user", clubName, defaultVenue || "", primaryColor || "#0f3875", secondaryColor || "#ffd700", logoUrl || "", now);

  return c.json({ success: true, id });
});

// Spara skapad plansch till historik
posterRoutes.post("/save", async (c) => {
  const body = await c.req.json();
  const { matchId, title, format, theme, customText, playerImageUrl, finalImageUrl, caption, userId } = body;

  const id = randomUUID();
  const now = new Date().toISOString();

  dbInstance.prepare(`
    INSERT INTO saved_posters (id, userId, matchId, title, format, theme, customText, playerImageUrl, finalImageUrl, caption, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId || "default_user", matchId || null, title || "Matchplansch", format || "feed", theme || "epic-smoke", customText || "", playerImageUrl || "", finalImageUrl || "", caption || "", now);

  return c.json({ success: true, id });
});

// Hämta sparade planscher
posterRoutes.get("/history", (c) => {
  const posters = dbInstance.prepare("SELECT * FROM saved_posters ORDER BY createdAt DESC LIMIT 20").all();
  return c.json({ posters });
});
