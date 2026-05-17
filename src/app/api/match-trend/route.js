import { NextResponse } from "next/server";

const API_BASE_URL = "https://v3.football.api-sports.io";

function normalizeName(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchScore(apiHome, apiAway, appHome, appAway) {
  const ah = normalizeName(apiHome);
  const aa = normalizeName(apiAway);
  const ph = normalizeName(appHome);
  const pa = normalizeName(appAway);

  let score = 0;

  if (ah === ph) score += 5;
  if (aa === pa) score += 5;
  if (ah.includes(ph) || ph.includes(ah)) score += 3;
  if (aa.includes(pa) || pa.includes(aa)) score += 3;

  return score;
}

async function apiFootballFetch(path) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("Clé API-Football absente dans Vercel.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    next: {
      revalidate: 1800,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Erreur API-Football.");
  }

  return data;
}

function findMatchWinnerBet(oddsItem) {
  const bookmakers = oddsItem?.bookmakers || [];

  for (const bookmaker of bookmakers) {
    const bet = bookmaker.bets?.find(
      (item) =>
        item.name === "Match Winner" ||
        item.name === "Winner" ||
        item.name === "1x2"
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

    const date = new Date(rawDate).toISOString().slice(0, 10);

    const fixturesResult = await apiFootballFetch(`/fixtures?date=${date}`);
    const fixtures = fixturesResult?.response || [];

    const bestFixture = fixtures
      .map((fixture) => ({
        fixture,
        score: matchScore(
          fixture?.teams?.home?.name,
          fixture?.teams?.away?.name,
          home,
          away
        ),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (!bestFixture || bestFixture.score < 6) {
      return NextResponse.json(
        {
          ok: false,
          error: "Impossible d'associer ce match aux données API-Football.",
        },
        { status: 404 }
      );
    }

    const fixtureId = bestFixture.fixture.fixture.id;

    const oddsResult = await apiFootballFetch(`/odds?fixture=${fixtureId}`);
    const oddsItem = oddsResult?.response?.[0];

    const matchWinnerBet = findMatchWinnerBet(oddsItem);

    if (!matchWinnerBet) {
      return NextResponse.json(
        {
          ok: false,
          error: "Cotes 1/N/2 indisponibles pour ce match.",
        },
        { status: 404 }
      );
    }

    const homeOdd =
      matchWinnerBet.values.find((item) => item.value === "Home")?.odd ||
      matchWinnerBet.values.find((item) => item.value === "1")?.odd ||
      null;

    const drawOdd =
      matchWinnerBet.values.find((item) => item.value === "Draw")?.odd ||
      matchWinnerBet.values.find((item) => item.value === "X")?.odd ||
      null;

    const awayOdd =
      matchWinnerBet.values.find((item) => item.value === "Away")?.odd ||
      matchWinnerBet.values.find((item) => item.value === "2")?.odd ||
      null;

    return NextResponse.json({
      ok: true,
      type: "odds",
      fixtureId,
      sourceFixture: `${bestFixture.fixture.teams.home.name} - ${bestFixture.fixture.teams.away.name}`,
      bookmaker: matchWinnerBet.bookmaker,
      odds: {
        home: homeOdd,
        draw: drawOdd,
        away: awayOdd,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Erreur serveur.",
      },
      { status: 500 }
    );
  }
}
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "x-apisports-key": apiKey,
    },
    next: {
      revalidate: 1800,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Erreur API-Football.");
  }

  return data;
}

function findMatchWinnerBet(oddsResponse) {
  const bookmakers = oddsResponse?.bookmakers || [];

  for (const bookmaker of bookmakers) {
    const bet = bookmaker.bets?.find(
      (item) =>
        item.name === "Match Winner" ||
        item.name === "Winner" ||
        item.name === "1x2"
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

    const fixturesResult = await apiFootballFetch(`/fixtures?date=${date}`);
    const fixtures = fixturesResult?.response || [];

    if (!fixtures.length) {
      return NextResponse.json(
        { ok: false, error: "Aucun match trouvé dans l'API pour cette date." },
        { status: 404 }
      );
    }

    const bestFixture = fixtures
      .map((fixture) => ({
        fixture,
        score: matchScore(
          fixture?.teams?.home?.name,
          fixture?.teams?.away?.name,
          home,
          away
        ),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (!bestFixture || bestFixture.score < 6) {
      return NextResponse.json(
        {
          ok: false,
          error: "Impossible d'associer ce match aux données API-Football.",
        },
        { status: 404 }
      );
    }

    const fixtureId = bestFixture.fixture.fixture.id;

    const oddsResult = await apiFootballFetch(`/odds?fixture=${fixtureId}`);
    const oddsItem = oddsResult?.response?.[0];

    if (!oddsItem) {
      return NextResponse.json(
        {
          ok: false,
          error: "Cotes indisponibles pour ce match.",
        },
        { status: 404 }
      );
    }

    const matchWinnerBet = findMatchWinnerBet(oddsItem);

    if (!matchWinnerBet) {
      return NextResponse.json(
        {
          ok: false,
          error: "Cotes 1/N/2 indisponibles pour ce match.",
        },
        { status: 404 }
      );
    }

    const homeOdd =
      matchWinnerBet.values.find((item) => item.value === "Home")?.odd ||
      matchWinnerBet.values.find((item) => item.value === "1")?.odd ||
      null;

    const drawOdd =
      matchWinnerBet.values.find((item) => item.value === "Draw")?.odd ||
      matchWinnerBet.values.find((item) => item.value === "X")?.odd ||
      null;

    const awayOdd =
      matchWinnerBet.values.find((item) => item.value === "Away")?.odd ||
      matchWinnerBet.values.find((item) => item.value === "2")?.odd ||
      null;

    if (!homeOdd && !drawOdd && !awayOdd) {
      return NextResponse.json(
        {
          ok: false,
          error: "Cotes 1/N/2 introuvables.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      type: "odds",
      fixtureId,
      sourceFixture: `${bestFixture.fixture.teams.home.name} - ${bestFixture.fixture.teams.away.name}`,
      bookmaker: matchWinnerBet.bookmaker,
      odds: {
        home: homeOdd,
        draw: drawOdd,
        away: awayOdd,
      },
      percent: null,
      favorite: null,
      advice: null,
    });
  } catch (error) {
    console.error("Erreur match-trend:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Erreur serveur.",
      },
      { status: 500 }
    );
  }
}
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "x-apisports-key": apiKey,
    },
    next: {
      revalidate: 1800,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Erreur API-Football.");
  }

  return data;
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

    const fixturesResult = await apiFootballFetch(`/fixtures?date=${date}`);
    const fixtures = fixturesResult?.response || [];

    if (!fixtures.length) {
      return NextResponse.json(
        { ok: false, error: "Aucun match trouvé dans l'API pour cette date." },
        { status: 404 }
      );
    }

    const bestFixture = fixtures
      .map((fixture) => ({
        fixture,
        score: matchScore(
          fixture?.teams?.home?.name,
          fixture?.teams?.away?.name,
          home,
          away
        ),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (!bestFixture || bestFixture.score < 6) {
      return NextResponse.json(
        {
          ok: false,
          error: "Impossible d'associer ce match aux données API-Football.",
        },
        { status: 404 }
      );
    }

    const fixtureId = bestFixture.fixture.fixture.id;

    const predictionsResult = await apiFootballFetch(
      `/predictions?fixture=${fixtureId}`
    );

    const prediction = predictionsResult?.response?.[0];

    if (!prediction?.predictions) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tendance indisponible pour ce match.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      fixtureId,
      sourceFixture: `${bestFixture.fixture.teams.home.name} - ${bestFixture.fixture.teams.away.name}`,
      percent: {
        home: prediction.predictions.percent?.home || null,
        draw: prediction.predictions.percent?.draw || null,
        away: prediction.predictions.percent?.away || null,
      },
      favorite: prediction.predictions.winner?.name || null,
      advice: prediction.predictions.advice || null,
    });
  } catch (error) {
    console.error("Erreur match-trend:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Erreur serveur.",
      },
      { status: 500 }
    );
  }
}
