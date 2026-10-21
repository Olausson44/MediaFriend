import { Hono } from "hono";
import { ibisClient, IBISMatch } from "../ibis/client.js";

export const matchRoutes = new Hono();

// Hämta enskild match via matchId
matchRoutes.get("/:id", async (c) => {
  const idStr = c.req.param("id");
  const matchId = parseInt(idStr, 10);

  if (isNaN(matchId)) {
    return c.json({ error: "Ogiltigt matchId" }, 400);
  }

  try {
    const match = await ibisClient.getMatch(matchId);
    return c.json({ match });
  } catch (err: any) {
    return c.json({ error: err.message || "Kunde inte hämta match från iBIS" }, 500);
  }
});

// Hämta matcher från en hel serie/tävling
matchRoutes.get("/competition/:competitionId", async (c) => {
  const compIdStr = c.req.param("competitionId");
  const compId = parseInt(compIdStr, 10);
  const homeTeamFilter = c.req.query("homeTeam")?.toLowerCase();

  if (isNaN(compId)) {
    return c.json({ error: "Ogiltigt competitionId" }, 400);
  }

  try {
    let matches = await ibisClient.getCompetitionMatches(compId);

    // Filtrera på hemmamatcher om hemmalag angetts
    if (homeTeamFilter) {
      matches = matches.filter((m) =>
        m.HomeTeam?.toLowerCase().includes(homeTeamFilter)
      );
    }

    return c.json({ count: matches.length, matches });
  } catch (err: any) {
    return c.json({ error: err.message || "Kunde inte hämta seriematcher" }, 500);
  }
});

// Tolka URL från stats.innebandy.se
matchRoutes.post("/parse-url", async (c) => {
  const body = await c.req.json();
  const url = body.url;

  if (!url || typeof url !== "string") {
    return c.json({ error: "Ingen giltig URL angiven" }, 400);
  }

  const parsed = ibisClient.parseMatchUrl(url);

  if (parsed.matchId) {
    try {
      const match = await ibisClient.getMatch(parsed.matchId);
      return c.json({ parsed, match });
    } catch (err: any) {
      return c.json({ parsed, error: err.message }, 500);
    }
  }

  return c.json({ parsed });
});

// Demomatcher för att snabbt kunna testa appen och planschgenereringen
matchRoutes.get("/demo/sample", (c) => {
  const sampleMatches: IBISMatch[] = [
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
      VenueID: 55,
      Venue: "Wallenstam Arena",
      MainVenue: "A-hallen",
      RoundName: "Omgång 7",
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
      VenueID: 55,
      Venue: "Wallenstam Arena",
      MainVenue: "A-hallen",
      RoundName: "Omgång 7",
      TicketUrl: "https://pixbo.ebiljett.nu",
    },
    {
      MatchID: 1701779,
      MatchDateTime: "2026-10-25T18:00:00",
      HomeTeamID: 101,
      HomeTeam: "Pixbo IBF (HJ)",
      HomeTeamShortName: "PIX",
      HomeTeamLogotypeUrl: "https://stats.innebandy.se/content/logos/101.png",
      HomeTeamShirtColor: "Röd",
      AwayTeamID: 104,
      AwayTeam: "Lindome IBK",
      AwayTeamShortName: "LIN",
      AwayTeamLogotypeUrl: "https://stats.innebandy.se/content/logos/104.png",
      AwayTeamShirtColor: "Grön",
      CompetitionID: 44870,
      CompetitionName: "Juniorallsvenskan HJ",
      VenueID: 55,
      Venue: "Wallenstam Arena",
      MainVenue: "B-hallen",
      RoundName: "Omgång 4",
    },
  ];

  return c.json({ matches: sampleMatches });
});
