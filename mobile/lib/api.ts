import Constants from "expo-constants";
import { Platform } from "react-native";

// Automatisk detektering av backend-URL:
// - På webb / iOS Simulator: localhost:3000
// - På fysisk telefon via Expo Go: använd samma IP som Expo bundler
const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
};

export const API_BASE_URL = getBaseUrl();

export interface Match {
  MatchID: number;
  MatchDateTime: string;
  HomeTeamID: number;
  HomeTeam: string;
  HomeTeamShortName?: string;
  HomeTeamLogotypeUrl?: string;
  HomeTeamShirtColor?: string;
  AwayTeamID: number;
  AwayTeam: string;
  AwayTeamShortName?: string;
  AwayTeamLogotypeUrl?: string;
  AwayTeamShirtColor?: string;
  CompetitionID: number;
  CompetitionName: string;
  VenueID?: number;
  Venue?: string;
  MainVenue?: string;
  RoundName?: string;
  TicketUrl?: string;
}

export interface PosterTheme {
  id: string;
  name: string;
  description: string;
  promptPrefix: string;
  primaryGradient: string[];
  accentColor: string;
}

export interface ClubProfile {
  id?: string;
  clubName: string;
  defaultVenue?: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
}

export const api = {
  // Hämta matcher (demomatcher eller via serie)
  async getMatches(competitionId?: number, homeTeam?: string): Promise<Match[]> {
    try {
      if (competitionId) {
        const query = homeTeam ? `?homeTeam=${encodeURIComponent(homeTeam)}` : "";
        const res = await fetch(`${API_BASE_URL}/api/matches/competition/${competitionId}${query}`);
        if (res.ok) {
          const data = await res.json();
          return data.matches || [];
        }
      }
      // Fallback till sample-matcher
      const res = await fetch(`${API_BASE_URL}/api/matches/demo/sample`);
      const data = await res.json();
      return data.matches || [];
    } catch {
      // Offline fallback om backend inte startats än
      return [
        {
          MatchID: 1701777,
          MatchDateTime: "2026-10-24T16:00:00",
          HomeTeamID: 101,
          HomeTeam: "Pixbo IBK",
          HomeTeamShortName: "PIX",
          HomeTeamLogotypeUrl: "https://stats.innebandy.se/content/logos/101.png",
          HomeTeamShirtColor: "Röd",
          AwayTeamID: 102,
          AwayTeam: "IBF Falun",
          AwayTeamShortName: "FAL",
          AwayTeamLogotypeUrl: "https://stats.innebandy.se/content/logos/102.png",
          AwayTeamShirtColor: "Rosa",
          CompetitionID: 44868,
          CompetitionName: "Svenska Superligan Herr",
          Venue: "Wallenstam Arena",
          MainVenue: "A-hallen",
          TicketUrl: "https://pixbo.ebiljett.nu",
        },
        {
          MatchID: 1701778,
          MatchDateTime: "2026-10-25T14:30:00",
          HomeTeamID: 101,
          HomeTeam: "Pixbo IBK Dam",
          HomeTeamShortName: "PIX",
          HomeTeamLogotypeUrl: "https://stats.innebandy.se/content/logos/101.png",
          HomeTeamShirtColor: "Röd",
          AwayTeamID: 103,
          AwayTeam: "Thorengruppen IBK",
          AwayTeamShortName: "THO",
          AwayTeamLogotypeUrl: "https://stats.innebandy.se/content/logos/103.png",
          AwayTeamShirtColor: "Svart",
          CompetitionID: 44869,
          CompetitionName: "Svenska Superligan Dam",
          Venue: "Wallenstam Arena",
          MainVenue: "A-hallen",
          TicketUrl: "https://pixbo.ebiljett.nu",
        },
      ];
    }
  },

  // Hämta färdiga designteman
  async getThemes(): Promise<PosterTheme[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posters/themes`);
      if (res.ok) {
        const data = await res.json();
        return data.themes;
      }
    } catch {
      // Fallback teman
    }
    return [
      {
        id: "epic-smoke",
        name: "Episk Rök & Klubbglöd",
        description: "Dramatisk rök och pulserande klubbfärger",
        promptPrefix: "dramatic floorball arena smoke",
        primaryGradient: ["#1a0808", "#3d0c0c", "#7a1515"],
        accentColor: "#ff4d4d",
      },
      {
        id: "neon-cyber",
        name: "Mörk Arena & Neon",
        description: "Elektriska neonlinjer och speglingar",
        promptPrefix: "electric cyan neon light beams",
        primaryGradient: ["#050814", "#0a1329", "#11224d"],
        accentColor: "#00e5ff",
      },
      {
        id: "clean-pro",
        name: "Klassisk & Ren Sportgrafik",
        description: "Skarp modern grafik och rena vinklar",
        promptPrefix: "clean geometric athletic lighting",
        primaryGradient: ["#0f172a", "#1e293b", "#334155"],
        accentColor: "#38bdf8",
      },
    ];
  },

  // Generera Instagram-caption med hashtags
  async generateCaption(params: {
    homeTeam: string;
    awayTeam: string;
    matchDateTime: string;
    venue?: string;
    customText?: string;
    ticketUrl?: string;
  }): Promise<string> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posters/generate-caption`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        return data.caption;
      }
    } catch {}

    return `🔥 MATCHDAG! 🔥\n${params.homeTeam} möter ${params.awayTeam} i ${params.venue || "hallen"}!\n${params.customText || ""}\n\nKom och stötta laget! 🏑💥\n#Innebandy #Matchdag #MediaFriend`;
  },

  // Hämta föreningsprofil
  async getClubProfile(): Promise<ClubProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posters/club-profile`);
      if (res.ok) {
        const data = await res.json();
        return data.profile;
      }
    } catch {}
    return null;
  },

  // Spara föreningsprofil
  async saveClubProfile(profile: ClubProfile): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posters/club-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Kontrollera AI-status
  async getAiStatus(): Promise<{ online: boolean; provider: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {
      online: false,
      provider: "Lokal grafikmotor",
      message: "Använder lokal HD-grafikmotor",
    };
  },
};
