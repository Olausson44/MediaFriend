/**
 * Svenska Innebandyförbundets officiella iBIS API-klient (TypeScript).
 * Använder startkit för att förnya JWT Bearer tokens automatiskt.
 */

export interface IBISMatch {
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
  GoalsHomeTeam?: number;
  GoalsAwayTeam?: number;
  RoundName?: string;
  Spectators?: number;
  TicketUrl?: string;
}

export class InnebandyClient {
  private static STARTKIT_URL = "https://api.innebandy.se/StatsAppApi/api/startkit";
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private apiRoot: string = "https://api.innebandy.se/v2/api/public/";

  private async ensureToken(): Promise<void> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt - 60_000) {
      return;
    }

    const res = await fetch(InnebandyClient.STARTKIT_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
        Origin: "https://stats.innebandy.se",
        Referer: "https://stats.innebandy.se/",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch iBIS startkit: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { accessToken: string; apiRoot?: string };
    this.accessToken = data.accessToken;
    if (data.apiRoot) {
      this.apiRoot = data.apiRoot;
    }
    // Token lasts ~30 mins; renew at 25 mins
    this.tokenExpiresAt = now + 25 * 60 * 1000;
  }

  public async get<T>(endpoint: string): Promise<T> {
    await this.ensureToken();
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    const url = `${this.apiRoot}${cleanEndpoint}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        Origin: "https://stats.innebandy.se",
        Referer: "https://stats.innebandy.se/",
      },
    });

    if (!res.ok) {
      throw new Error(`iBIS API Error (${res.status}) on ${endpoint}`);
    }

    return (await res.json()) as T;
  }

  public async getMatch(matchId: number): Promise<IBISMatch> {
    return this.get<IBISMatch>(`matches/${matchId}`);
  }

  public async getCompetitionMatches(competitionId: number): Promise<IBISMatch[]> {
    return this.get<IBISMatch[]>(`competitions/${competitionId}/matches`);
  }

  public async getTeam(teamId: number): Promise<any> {
    return this.get<any>(`teams/${teamId}`);
  }

  public async getVenue(venueId: number): Promise<any> {
    return this.get<any>(`venues/${venueId}`);
  }

  /**
   * Extraherar IDs från en stats.innebandy.se matchlänk.
   * Exempel: https://stats.innebandy.se/sasong/44/serie/44868/match/1701777
   */
  public parseMatchUrl(url: string): {
    seasonId?: number;
    competitionId?: number;
    matchId?: number;
  } {
    const seasonMatch = url.match(/\/sasong\/(\d+)/);
    const serieMatch = url.match(/\/serie\/(\d+)/);
    const matchMatch = url.match(/\/match\/(\d+)/);

    return {
      seasonId: seasonMatch ? parseInt(seasonMatch[1], 10) : undefined,
      competitionId: serieMatch ? parseInt(serieMatch[1], 10) : undefined,
      matchId: matchMatch ? parseInt(matchMatch[1], 10) : undefined,
    };
  }
}

export const ibisClient = new InnebandyClient();
