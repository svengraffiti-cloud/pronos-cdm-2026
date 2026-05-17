import { NextResponse } from "next/server";

const API_BASE_URL = "https://v3.football.api-sports.io";

function normalize(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function scoreMatch(fixture, home, away) {
  const apiHome = normalize(fixture?.teams?.home?.name);
  const apiAway = normalize(fixture?.teams?.away?.name);
  const appHome = normalize(home);
  const appAway = normalize(away);

  let score = 0;

  if (apiHome === appHome) score += 5;
  if (apiAway === appAway) score += 5;
  if (apiHome.includes(appHome) || appHome.includes(apiHome)) score += 3;
  if (apiAway.includes(appAway) || appAway.includes(apiAway)) score += 3;

  return score;
}

async function apiFetch(path) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("Clé API-Football absente.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Erreur API-Football.");
  }

  return data;
}

function getMatchWinnerBet(oddsItem) {
  for (const bookmaker of oddsItem?.bookmakers || []) {
    const bet = bookmaker.bets?.find((item) =>
      ["Match Winner", "Winner", "1x2"].includes(item.name)
    );

    if (bet?.values?.length) {
      return {
        bookmaker: bookmaker.name,
        values: bet.values,
      };
    }
  }

  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const home = searchParams.get("home") || "";
    const away = searchParams.get("away") || "";
    const rawDate = searchParams.get("date") || "";

    if (!home || !away || !rawDate) {
      return NextResponse.json(
        { ok: false, error: "Match incomplet." },
        { status: 400 }
      );
    }

    const date = new Date(rawDate).toISOString().slice(0, 10);

    const fixturesData = await apiFetch(`/fixtures?date=${date}`);
    const fixtures = fixturesData?.response || [];

    const best = fixtures
      .map((fixture) => ({
        fixture,
        score: scoreMatch(fixture, home, away),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (!best || best.score < 6) {
      return NextResponse.json(
        { ok: false, error: "Match non trouvé dans API-Football." },
        { status: 404 }
      );
    }

    const fixtureId = best.fixture.fixture.id;
    const oddsData = await apiFetch(`/odds?fixture=${fixtureId}`);
    const oddsItem = oddsData?.response?.[0];

    const bet = getMatchWinnerBet(oddsItem);

    if (!bet) {
      return NextResponse.json(
        { ok: false, error: "Cotes 1/N/2 indisponibles." },
        { status: 404 }
      );
    }

    const homeOdd =
      bet.values.find((item) => item.value === "Home")?.odd ||
      bet.values.find((item) => item.value === "1")?.odd ||
      null;

    const drawOdd =
      bet.values.find((item) => item.value === "Draw")?.odd ||
      bet.values.find((item) => item.value === "X")?.odd ||
      null;

    const awayOdd =
      bet.values.find((item) => item.value === "Away")?.odd ||
      bet.values.find((item) => item.value === "2")?.odd ||
      null;

    return NextResponse.json({
      ok: true,
      type: "odds",
      fixtureId,
      sourceFixture: `${best.fixture.teams.home.name} - ${best.fixture.teams.away.name}`,
      bookmaker: bet.bookmaker,
      odds: {
        home: homeOdd,
        draw: drawOdd,
        away: awayOdd,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Erreur serveur." },
      { status: 500 }
    );
  }
}
