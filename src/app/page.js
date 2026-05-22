"use client";

import { Component, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Bell,
  CalendarDays,
  Loader2,
  Lock,
  LogOut,
  Trophy,
  UserCircle,
  Users,
} from "lucide-react";

const APP_VERSION = "2026-05-22-stable-apple-review-v3";
const INVITE_CODE_HELP = "PAPY2026";

function AppShell({ children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0513] text-white">
      <div className="fixed inset-0 -z-20">
        <img
          src="/stadium.jpg"
          alt="Stade"
          className="absolute inset-0 h-full w-full object-cover opacity-65"
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#22c55e77,transparent_34%),radial-gradient(circle_at_bottom_right,#7c3aed77,transparent_36%),linear-gradient(135deg,#020617dd,#1e0b38e6_45%,#064e3be0)]" />
      <div className="fixed inset-0 -z-10 bg-black/35 backdrop-blur-[1px]" />
      {children}
    </main>
  );
}

function AppLogo({ className = "", alt = "Les Pronos de Papy" }) {
  return (
    <img
      src="/logo-app.png"
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}

function LoadingCard({ message = "Chargement" }) {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-6">
        <div className="flex w-full max-w-xl flex-col items-center rounded-[2rem] border border-emerald-300/20 bg-[#12091f]/75 p-10 text-center shadow-2xl backdrop-blur-md">
          <AppLogo className="mb-6 h-28 w-28 rounded-3xl object-contain ring-4 ring-emerald-300/30" />
          <Loader2 className="h-10 w-10 animate-spin text-emerald-300" />
          <p className="mt-5 text-sm font-black uppercase tracking-[0.3em] text-emerald-300">
            {message}
          </p>
          <p className="mt-4 text-xs font-bold text-slate-400">
            Version {APP_VERSION}
          </p>
        </div>
      </div>
    </AppShell>
  );
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Erreur inattendue.",
    };
  }

  componentDidCatch(error, info) {
    console.error("Erreur interface principale:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AppShell>
          <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-6">
            <div className="w-full max-w-xl rounded-[2rem] border border-red-300/20 bg-[#12091f]/85 p-8 text-center shadow-2xl backdrop-blur-md">
              <AppLogo className="mx-auto mb-5 h-28 w-28 rounded-3xl object-contain ring-4 ring-emerald-300/30" />
              <h1 className="text-3xl font-black">Les Pronos de Papy</h1>
              <p className="mt-3 text-slate-200">
                Une erreur temporaire a été détectée pendant le chargement.
              </p>
              <p className="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm font-bold text-red-200">
                {this.state.message}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 rounded-2xl bg-violet-600 px-5 py-4 font-black text-white shadow-xl"
              >
                Recharger l'application
              </button>
              <div className="mt-5 flex justify-center gap-4 text-sm font-bold text-emerald-200">
                <a href="/contact">Support</a>
                <a href="/privacy">Confidentialité</a>
              </div>
            </div>
          </div>
        </AppShell>
      );
    }

    return this.props.children;
  }
}

function withTimeout(promise, milliseconds, fallbackValue = null) {
  let timer;

  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), milliseconds);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function safeQuery(label, query, fallbackValue) {
  try {
    const result = await withTimeout(query, 8000, {
      data: fallbackValue,
      error: new Error(`${label} trop long`),
    });

    if (result?.error) {
      console.warn(`Chargement ${label} ignoré:`, result.error);
      return fallbackValue;
    }

    return result?.data ?? fallbackValue;
  } catch (error) {
    console.warn(`Chargement ${label} impossible:`, error);
    return fallbackValue;
  }
}

function formatDate(date) {
  if (!date) return "Date à confirmer";
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDayKey(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-CA");
}

function isMatchLocked(matchDate) {
  if (!matchDate) return false;
  const lockTime = new Date(matchDate).getTime() - 30 * 60 * 1000;
  return Date.now() >= lockTime;
}

function isMatchFinished(match) {
  return match?.home_score !== null && match?.away_score !== null;
}

function calculatePredictionPoints(prediction, match) {
  if (
    match?.home_score === null ||
    match?.away_score === null ||
    match?.home_score === undefined ||
    match?.away_score === undefined
  ) {
    return 0;
  }

  const ph = Number(prediction.predicted_home);
  const pa = Number(prediction.predicted_away);
  const rh = Number(match.home_score);
  const ra = Number(match.away_score);

  if (ph === rh && pa === ra) return 3;

  const predictedDiff = ph - pa;
  const realDiff = rh - ra;
  const predictedResult =
    predictedDiff > 0 ? "home" : predictedDiff < 0 ? "away" : "draw";
  const realResult = realDiff > 0 ? "home" : realDiff < 0 ? "away" : "draw";

  let points = 0;
  if (predictedResult === realResult) points += 1;
  if (predictedDiff === realDiff) points += 1;

  return points;
}

function HomeContent() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [inviteAccessCode, setInviteAccessCode] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [profileName, setProfileName] = useState("");
  const [creatingProfile, setCreatingProfile] = useState(false);

  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [scores, setScores] = useState({});
  const [tab, setTab] = useState("pronos");
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [appNotice, setAppNotice] = useState("");

  const roundLabels = {
    R32: "16es de finale",
    R16: "8es de finale",
    QF: "Quarts de finale",
    SF: "Demi-finales",
    FINAL: "Finale",
  };

  const isAdmin = profile?.role === "admin";
  const currentPlayerId = profile?.player_id;

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [players]
  );

  const predictionByPlayerAndMatch = useMemo(() => {
    const map = new Map();
    predictions.forEach((prediction) => {
      map.set(`${prediction.player_id}-${prediction.match_id}`, prediction);
    });
    return map;
  }, [predictions]);

  const currentPredictionByMatch = useMemo(() => {
    const map = new Map();
    if (!currentPlayerId) return map;
    predictions.forEach((prediction) => {
      if (prediction.player_id === currentPlayerId) {
        map.set(prediction.match_id, prediction);
      }
    });
    return map;
  }, [currentPlayerId, predictions]);

  const playerTotals = useMemo(() => {
    const totals = new Map();
    players.forEach((player) => totals.set(player.id, 0));

    predictions.forEach((prediction) => {
      totals.set(
        prediction.player_id,
        (totals.get(prediction.player_id) || 0) + (prediction.points || 0)
      );
    });

    return totals;
  }, [players, predictions]);

  const rankingPlayers = useMemo(
    () =>
      [...players].sort(
        (a, b) => (playerTotals.get(b.id) || 0) - (playerTotals.get(a.id) || 0)
      ),
    [players, playerTotals]
  );

  const groupNames = useMemo(
    () => [...new Set(teams.map((team) => team.group_name).filter(Boolean))],
    [teams]
  );

  const groupStandingsByName = useMemo(() => {
    const map = new Map();

    groupNames.forEach((groupName) => {
      const groupTeams = teams
        .filter((team) => team.group_name === groupName)
        .map((team) => ({
          name: team.name,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        }));

      matches
        .filter(
          (match) =>
            match.stage === "GROUP" &&
            match.group_name === groupName &&
            match.home_score !== null &&
            match.away_score !== null
        )
        .forEach((match) => {
          const home = groupTeams.find((team) => team.name === match.home_team);
          const away = groupTeams.find((team) => team.name === match.away_team);

          if (!home || !away) return;

          const homeScore = Number(match.home_score);
          const awayScore = Number(match.away_score);

          home.played += 1;
          away.played += 1;
          home.goalsFor += homeScore;
          home.goalsAgainst += awayScore;
          away.goalsFor += awayScore;
          away.goalsAgainst += homeScore;

          if (homeScore > awayScore) {
            home.wins += 1;
            away.losses += 1;
            home.points += 3;
          } else if (awayScore > homeScore) {
            away.wins += 1;
            home.losses += 1;
            away.points += 3;
          } else {
            home.draws += 1;
            away.draws += 1;
            home.points += 1;
            away.points += 1;
          }
        });

      groupTeams.forEach((team) => {
        team.goalDifference = team.goalsFor - team.goalsAgainst;
      });

      map.set(
        groupName,
        groupTeams.sort(
          (a, b) =>
            b.points - a.points ||
            b.goalDifference - a.goalDifference ||
            b.goalsFor - a.goalsFor ||
            a.name.localeCompare(b.name)
        )
      );
    });

    return map;
  }, [groupNames, teams, matches]);

  const openMatches = useMemo(
    () =>
      matches
        .filter((match) => !isMatchFinished(match))
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date)),
    [matches]
  );

  const todaysMatches = useMemo(() => {
    const todayKey = formatDayKey(new Date());
    return matches
      .filter((match) => formatDayKey(match.match_date) === todayKey)
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  }, [matches]);

  const myCurrentBetMatches = useMemo(
    () =>
      matches
        .filter((match) => {
          const prediction = currentPredictionByMatch.get(match.id);
          if (!prediction) return false;
          return !isMatchFinished(match) || formatDayKey(match.match_date) === formatDayKey(new Date());
        })
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date)),
    [matches, currentPredictionByMatch]
  );

  const getPrediction = useCallback(
    (matchId) => currentPredictionByMatch.get(matchId),
    [currentPredictionByMatch]
  );

  const loadProfile = useCallback(async (userId) => {
    if (!userId) return { profileData: null, playerData: null };

    const profileData = await safeQuery(
      "profil",
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      null
    );

    setProfile(profileData || null);

    if (profileData?.player_id) {
      const playerData = await safeQuery(
        "joueur",
        supabase
          .from("players")
          .select("id, name, avatar_url, created_at")
          .eq("id", profileData.player_id)
          .maybeSingle(),
        null
      );

      setCurrentPlayer(playerData || null);
      return { profileData, playerData };
    }

    setCurrentPlayer(null);
    return { profileData, playerData: null };
  }, []);

  const loadData = useCallback(async () => {
    const [playersData, matchesData, predictionsData, teamsData] = await Promise.all([
      safeQuery(
        "joueurs",
        supabase
          .from("players")
          .select("id, name, avatar_url, created_at")
          .order("created_at", { ascending: true }),
        []
      ),
      safeQuery(
        "matchs",
        supabase
          .from("matches")
          .select(
            "id, home_team, away_team, match_date, stage, group_name, knockout_order, home_score, away_score"
          )
          .order("match_date", { ascending: true }),
        []
      ),
      safeQuery(
        "pronostics",
        supabase
          .from("predictions")
          .select("id, player_id, match_id, predicted_home, predicted_away, points, edit_count"),
        []
      ),
      safeQuery(
        "équipes",
        supabase
          .from("teams")
          .select("id, name, group_name")
          .order("group_name", { ascending: true }),
        []
      ),
    ]);

    setPlayers(playersData || []);
    setMatches(matchesData || []);
    setPredictions(predictionsData || []);
    setTeams(teamsData || []);
  }, []);

  const refreshEverything = useCallback(
    async (userId = session?.user?.id, options = {}) => {
      if (!userId) return;

      if (!options.silent) setRefreshing(true);

      try {
        await Promise.all([loadProfile(userId), loadData()]);
        setAppNotice("");
      } catch (error) {
        console.error("Erreur rafraîchissement:", error);
        setAppNotice("Certaines données n'ont pas pu être rafraîchies. Réessaie dans quelques secondes.");
      } finally {
        setRefreshing(false);
      }
    },
    [loadProfile, loadData, session?.user?.id]
  );

  useEffect(() => {
    let alive = true;

    async function boot() {
      setBooting(true);

      try {
        if (typeof window !== "undefined") {
          try {
            const currentVersion = window.localStorage.getItem("papy_app_version");
            if (currentVersion !== APP_VERSION) {
              if ("caches" in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
              }
              window.localStorage.setItem("papy_app_version", APP_VERSION);
            }
          } catch (cacheError) {
            console.warn("Nettoyage cache ignoré:", cacheError);
          }
        }

        const sessionResult = await withTimeout(
          supabase.auth.getSession(),
          7000,
          { data: { session: null }, error: null }
        );

        if (!alive) return;

        const currentSession = sessionResult?.data?.session || null;
        setSession(currentSession);

        if (currentSession?.user?.id) {
          await withTimeout(
            refreshEverything(currentSession.user.id, { silent: true }),
            9000,
            null
          );
        }
      } catch (error) {
        console.error("Erreur boot:", error);
        if (alive) setSession(null);
      } finally {
        if (alive) setBooting(false);
      }
    }

    boot();

    const safetyTimer = setTimeout(() => {
      if (alive) {
        console.warn("Déblocage sécurité accueil.");
        setBooting(false);
        setAuthLoading(false);
        setRefreshing(false);
      }
    }, 10000);

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!alive) return;

        setSession(nextSession || null);
        setAuthLoading(false);

        if (nextSession?.user?.id) {
          await withTimeout(
            refreshEverything(nextSession.user.id, { silent: true }),
            9000,
            null
          );
        } else {
          setProfile(null);
          setCurrentPlayer(null);
          setPlayers([]);
          setMatches([]);
          setPredictions([]);
          setTeams([]);
          setScores({});
        }
      }
    );

    return () => {
      alive = false;
      clearTimeout(safetyTimer);
      listener?.subscription?.unsubscribe?.();
    };
  }, [refreshEverything]);

  useEffect(() => {
    const nextScores = {};

    predictions.forEach((prediction) => {
      if (prediction.player_id === currentPlayerId) {
        nextScores[prediction.match_id] = {
          home: prediction.predicted_home,
          away: prediction.predicted_away,
        };
      }
    });

    matches.forEach((match) => {
      nextScores[match.id] = {
        ...nextScores[match.id],
        officialHome: match.home_score ?? "",
        officialAway: match.away_score ?? "",
      };
    });

    setScores(nextScores);
  }, [currentPlayerId, predictions, matches]);

  useEffect(() => {
    async function checkNotifications() {
      try {
        if (typeof window === "undefined" || !("Notification" in window)) {
          setNotificationsEnabled(false);
          return;
        }

        setNotificationsEnabled(Notification.permission === "granted");
      } catch {
        setNotificationsEnabled(false);
      }
    }

    checkNotifications();
  }, []);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        const inviteResponse = await fetch("/api/check-invite-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteAccessCode }),
        });

        const inviteResult = await inviteResponse.json().catch(() => null);

        if (!inviteResponse.ok || !inviteResult?.valid) {
          setAuthError(inviteResult?.error || `Code d’accès famille (${INVITE_CODE_HELP}) incorrect.`);
          setAuthLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });

        if (error) throw error;

        const userId = data?.user?.id;

        if (userId) {
          const { data: playerData, error: playerError } = await supabase
            .from("players")
            .insert({
              name: authName.trim() || authEmail.split("@")[0],
              avatar_url: null,
            })
            .select("id, name, avatar_url, created_at")
            .single();

          if (playerError) throw playerError;

          const { error: profileError } = await supabase.from("profiles").insert({
            id: userId,
            player_id: playerData.id,
            role: "player",
          });

          if (profileError) throw profileError;

          setProfile({ id: userId, player_id: playerData.id, role: "player" });
          setCurrentPlayer(playerData);
          await refreshEverything(userId, { silent: true });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Erreur auth:", error);
      setAuthError(error?.message || "Erreur de connexion.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function createMissingProfile(event) {
    event.preventDefault();
    if (!session?.user?.id) return;

    setCreatingProfile(true);
    setAuthError("");

    try {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({
          name: profileName.trim() || session.user.email?.split("@")[0] || "Joueur",
          avatar_url: null,
        })
        .select("id, name, avatar_url, created_at")
        .single();

      if (playerError) throw playerError;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: session.user.id,
        player_id: playerData.id,
        role: "player",
      });

      if (profileError) throw profileError;

      await refreshEverything(session.user.id, { silent: true });
    } catch (error) {
      console.error("Création profil impossible:", error);
      setAuthError(error?.message || "Erreur de création du profil.");
    } finally {
      setCreatingProfile(false);
    }
  }

  async function signOut() {
    setRefreshing(true);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Déconnexion Supabase incomplète:", error);
    } finally {
      setSession(null);
      setProfile(null);
      setCurrentPlayer(null);
      setPlayers([]);
      setMatches([]);
      setPredictions([]);
      setTeams([]);
      setScores({});
      setRefreshing(false);

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }

  async function requestNotifications() {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        alert("Notifications non disponibles sur ce navigateur.");
        setNotificationsEnabled(false);
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");

      alert(permission === "granted" ? "Notifications activées." : "Notifications refusées.");
    } catch (error) {
      console.error("Notifications impossibles:", error);
      setNotificationsEnabled(false);
      alert("Erreur activation notifications.");
    }
  }

  const handlePredictionScoreChange = useCallback((matchId, side, value) => {
    setScores((previousScores) => ({
      ...previousScores,
      [matchId]: {
        ...previousScores[matchId],
        [side]: value,
      },
    }));
  }, []);

  const savePrediction = useCallback(
    async (match) => {
      if (!currentPlayerId) {
        alert("Profil joueur introuvable.");
        return;
      }

      if (isMatchLocked(match.match_date)) {
        alert("Paris fermés définitivement 30 min avant le coup d'envoi.");
        return;
      }

      const existing = predictionByPlayerAndMatch.get(`${currentPlayerId}-${match.id}`);
      const home = scores[match.id]?.home;
      const away = scores[match.id]?.away;

      if (home === "" || away === "" || home === undefined || away === undefined) {
        alert("Entre les deux scores.");
        return;
      }

      if (existing && (existing.edit_count || 0) >= 1) {
        alert("Tu as déjà utilisé ta seule modification possible pour ce match.");
        return;
      }

      setRefreshing(true);

      try {
        if (existing) {
          const { error } = await supabase
            .from("predictions")
            .update({
              predicted_home: Number(home),
              predicted_away: Number(away),
              edit_count: (existing.edit_count || 0) + 1,
            })
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("predictions").insert({
            player_id: currentPlayerId,
            match_id: match.id,
            predicted_home: Number(home),
            predicted_away: Number(away),
            edit_count: 0,
          });

          if (error) throw error;
        }

        await loadData();
      } catch (error) {
        console.error("Sauvegarde prono impossible:", error);
        alert(error?.message || "Erreur sauvegarde du pronostic.");
      } finally {
        setRefreshing(false);
      }
    },
    [currentPlayerId, predictionByPlayerAndMatch, scores, loadData]
  );

  async function saveOfficialScore(matchId) {
    if (!isAdmin) {
      alert("Accès admin requis.");
      return;
    }

    const match = matches.find((item) => item.id === matchId);
    if (!match) return;

    const home = scores[matchId]?.officialHome;
    const away = scores[matchId]?.officialAway;

    if (home === "" || away === "" || home === undefined || away === undefined) {
      alert("Entre les deux scores officiels.");
      return;
    }

    setRefreshing(true);

    try {
      const { data: updatedMatch, error: matchError } = await supabase
        .from("matches")
        .update({
          home_score: Number(home),
          away_score: Number(away),
        })
        .eq("id", matchId)
        .select("id, home_team, away_team, match_date, stage, group_name, knockout_order, home_score, away_score")
        .single();

      if (matchError) throw matchError;

      const { data: freshPredictions, error: predictionsError } = await supabase
        .from("predictions")
        .select("id, player_id, match_id, predicted_home, predicted_away, points")
        .eq("match_id", matchId);

      if (predictionsError) throw predictionsError;

      for (const prediction of freshPredictions || []) {
        const points = calculatePredictionPoints(prediction, updatedMatch);
        const { error: updateError } = await supabase
          .from("predictions")
          .update({ points })
          .eq("id", prediction.id);

        if (updateError) throw updateError;
      }

      await loadData();
      alert("Score validé et points recalculés.");
    } catch (error) {
      console.error("Validation score impossible:", error);
      alert(error?.message || "Erreur validation score.");
    } finally {
      setRefreshing(false);
    }
  }

  if (booting) {
    return <LoadingCard />;
  }

  if (!session) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-[2rem] border border-emerald-300/20 bg-[#12091f]/80 p-8 shadow-2xl backdrop-blur-md">
            <div className="text-center">
              <AppLogo className="mx-auto mb-5 h-28 w-28 rounded-3xl object-contain ring-4 ring-emerald-300/30" />
              <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-300">
                Coupe du Monde 2026
              </p>
              <h1 className="mt-3 text-4xl font-black">Pronos Famille</h1>
              <p className="mt-2 text-slate-300">
                Connecte-toi pour accéder à ta feuille de pronostic.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-white/5 p-2">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`rounded-xl py-3 font-black ${
                  authMode === "login" ? "bg-violet-600" : "text-slate-300"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`rounded-xl py-3 font-black ${
                  authMode === "signup" ? "bg-violet-600" : "text-slate-300"
                }`}
              >
                Créer un compte
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              {authMode === "signup" && (
                <>
                  <input
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    placeholder="Ton prénom / pseudo"
                    className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
                  />

                  <p className="rounded-2xl bg-white/5 p-4 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                    Photo de profil désactivée temporairement pour garantir la stabilité iPad pendant la vérification Apple.
                  </p>

                  <input
                    value={inviteAccessCode}
                    onChange={(event) => setInviteAccessCode(event.target.value)}
                    type="text"
                    placeholder="Code d’accès famille"
                    required
                    className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
                  />
                </>
              )}

              <input
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                type="email"
                placeholder="Email"
                required
                className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
              />

              <input
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                type="password"
                placeholder="Mot de passe"
                required
                minLength={6}
                className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
              />

              {authError && (
                <p className="rounded-2xl bg-red-500/20 p-3 text-sm font-bold text-red-200">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-2xl bg-violet-600 px-5 py-4 font-black shadow-xl disabled:opacity-50"
              >
                {authLoading
                  ? "Chargement..."
                  : authMode === "login"
                  ? "Se connecter"
                  : "Créer mon compte"}
              </button>
            </form>

            <div className="mt-6 flex justify-center gap-4 text-sm font-bold text-emerald-200">
              <a href="/contact">Support</a>
              <a href="/privacy">Confidentialité</a>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!profile || !currentPlayer) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-[2rem] border border-emerald-300/20 bg-[#12091f]/80 p-8 shadow-2xl backdrop-blur-md">
            <div className="text-center">
              <UserCircle className="mx-auto h-20 w-20 text-emerald-300" />
              <h1 className="mt-4 text-3xl font-black">Créer ton profil joueur</h1>
              <p className="mt-2 text-slate-300">
                Ce profil sera lié à ton compte. Tu pourras ensuite accéder aux pronostics.
              </p>
            </div>

            <form onSubmit={createMissingProfile} className="mt-6 space-y-4">
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Ton prénom / pseudo"
                required
                className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
              />

              <p className="rounded-2xl bg-white/5 p-4 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                Photo de profil désactivée temporairement pour garantir la stabilité iPad pendant la vérification Apple.
              </p>

              {authError && (
                <p className="rounded-2xl bg-red-500/20 p-3 text-sm font-bold text-red-200">
                  {authError}
                </p>
              )}

              <button
                disabled={creatingProfile}
                className="w-full rounded-2xl bg-violet-600 px-5 py-4 font-black shadow-xl disabled:opacity-50"
              >
                {creatingProfile ? "Création..." : "Entrer dans l'app"}
              </button>

              <button
                type="button"
                onClick={signOut}
                className="w-full rounded-2xl bg-white/10 px-5 py-4 font-black"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        <header className="relative overflow-hidden rounded-[2rem] border border-emerald-300/25 bg-[#22123a]/70 p-6 shadow-2xl shadow-emerald-950/30 backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-white to-violet-500" />

          <div className="flex flex-col items-center text-center">
            <AppLogo className="mb-5 h-28 w-28 rounded-3xl object-contain shadow-2xl ring-4 ring-emerald-300/40 md:h-36 md:w-36" />

            <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-300">
              Coupe du Monde 2026
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-tight drop-shadow-2xl md:text-7xl">
              Pronos Famille
            </h1>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-black/25 px-4 py-3 ring-1 ring-white/10">
              {currentPlayer?.avatar_url ? (
                <img
                  src={currentPlayer.avatar_url}
                  alt={currentPlayer.name || "Joueur"}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-10 w-10 text-emerald-300" />
              )}

              <div className="text-left">
                <p className="text-xs text-slate-300">Connecté en tant que</p>
                <p className="font-black">{currentPlayer?.name || "Joueur"}</p>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-lg text-slate-200">
              Ton espace pronos sécurisé. Les pronos des autres apparaissent uniquement après fermeture des paris.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={requestNotifications}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white ring-1 ring-white/10"
              >
                <Bell className="h-5 w-5" />
                {notificationsEnabled ? "Notifications activées" : "Activer les notifications"}
              </button>

              <button
                type="button"
                onClick={() => refreshEverything(session?.user?.id)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 px-5 py-3 font-black text-white ring-1 ring-emerald-300/20 transition hover:bg-emerald-500/30 disabled:opacity-60"
              >
                <span className={refreshing ? "inline-block animate-spin" : ""}>🔄</span>
                {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
              </button>

              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white ring-1 ring-white/10"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        {appNotice && (
          <div className="rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-100">
            {appNotice}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-7 w-7 text-emerald-300" />} label="Joueurs" value={players.length} />
          <StatCard icon={<CalendarDays className="h-7 w-7 text-emerald-300" />} label="Matchs" value={matches.length} />
          <StatButton active={tab === "encours"} icon="🎯" label="Mes paris en cours" sub={`${myCurrentBetMatches.length} pari(s)`} onClick={() => setTab("encours")} />
          <StatButton active={tab === "jour"} icon="📅" label="Pronos du jour" sub={`${todaysMatches.length} match(s)`} onClick={() => setTab("jour")} />
        </section>

        <nav className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-3 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { key: "pronos", icon: "⚽", label: "Pronos" },
              { key: "encours", icon: "🎯", label: "En cours" },
              { key: "jour", icon: "📅", label: "Jour" },
              { key: "classement", icon: "🏆", label: "Classement" },
              { key: "groupes", icon: "👥", label: "Groupes" },
              ...(isAdmin ? [{ key: "admin", icon: "🔒", label: "Admin" }] : []),
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-3 font-black transition ${
                  tab === item.key
                    ? "bg-violet-600 shadow-lg shadow-violet-950/40"
                    : "bg-white/5 hover:bg-emerald-500/20"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {refreshing && (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-200 shadow-xl backdrop-blur-md">
            Mise à jour en cours...
          </div>
        )}

        {tab === "pronos" && (
          <MatchesSection
            title="Ta feuille de pronostic"
            description="Tu ne peux remplir que tes propres pronos. Une seule modification est possible, puis les paris se verrouillent 30 min avant le coup d’envoi."
            matches={openMatches}
            emptyText="Aucun match disponible pour le moment."
            scores={scores}
            getPrediction={getPrediction}
            onScoreChange={handlePredictionScoreChange}
            onSavePrediction={savePrediction}
            roundLabels={roundLabels}
          />
        )}

        {tab === "encours" && (
          <MatchesSection
            title="Mes paris en cours"
            description="Retrouve les matchs sur lesquels tu as déjà pronostiqué."
            matches={myCurrentBetMatches}
            emptyText="Aucun pari en cours pour le moment."
            scores={scores}
            getPrediction={getPrediction}
            onScoreChange={handlePredictionScoreChange}
            onSavePrediction={savePrediction}
            roundLabels={roundLabels}
          />
        )}

        {tab === "jour" && (
          <MatchesSection
            title="Mes pronos du jour"
            description="Les matchs prévus aujourd’hui."
            matches={todaysMatches}
            emptyText="Aucun match aujourd’hui."
            scores={scores}
            getPrediction={getPrediction}
            onScoreChange={handlePredictionScoreChange}
            onSavePrediction={savePrediction}
            roundLabels={roundLabels}
          />
        )}

        {tab === "classement" && (
          <section className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center gap-3">
              <Trophy className="h-7 w-7 text-yellow-300" />
              <div>
                <h2 className="text-3xl font-black">Classement</h2>
                <p className="text-sm text-slate-300">Total des points par joueur.</p>
              </div>
            </div>

            {rankingPlayers.length === 0 ? (
              <p className="rounded-2xl bg-white/5 p-4 text-slate-300">Aucun joueur pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {rankingPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 font-black">
                        {index + 1}
                      </span>
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.name || "Joueur"}
                          className="h-10 w-10 rounded-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <UserCircle className="h-10 w-10 text-emerald-300" />
                      )}
                      <strong>{player.name || "Joueur"}</strong>
                    </div>
                    <strong className="text-2xl text-yellow-300">{playerTotals.get(player.id) || 0} pts</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "groupes" && (
          <section className="grid gap-5 md:grid-cols-2">
            {groupNames.length === 0 ? (
              <div className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
                <p className="text-slate-300">Aucun groupe disponible pour le moment.</p>
              </div>
            ) : (
              groupNames.map((groupName) => (
                <div
                  key={groupName}
                  className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md"
                >
                  <h2 className="mb-4 text-2xl font-black">Groupe {groupName}</h2>
                  <div className="space-y-2">
                    {(groupStandingsByName.get(groupName) || []).map((team, index) => (
                      <div
                        key={team.name}
                        className="grid grid-cols-[2rem_1fr_3rem_3rem] items-center gap-2 rounded-xl bg-white/5 p-3 text-sm"
                      >
                        <span className="font-black text-slate-300">{index + 1}</span>
                        <strong>{team.name}</strong>
                        <span className="text-center text-slate-300">{team.goalDifference}</span>
                        <span className="text-center font-black text-emerald-300">{team.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {tab === "admin" && isAdmin && (
          <section className="space-y-5 rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Lock className="h-7 w-7 text-red-300" />
              <div>
                <h2 className="text-3xl font-black">Administration</h2>
                <p className="text-sm text-slate-300">Saisie des scores officiels.</p>
              </div>
            </div>

            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match.id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-black">
                        {match.home_team} - {match.away_team}
                      </h3>
                      <p className="text-sm text-slate-300">{formatDate(match.match_date)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={scores[match.id]?.officialHome ?? ""}
                        onChange={(event) =>
                          setScores((previous) => ({
                            ...previous,
                            [match.id]: {
                              ...previous[match.id],
                              officialHome: event.target.value,
                            },
                          }))
                        }
                        className="w-20 rounded-2xl bg-[#0b0513]/90 p-3 text-center text-xl font-black text-white outline-none ring-1 ring-white/10"
                      />
                      <span className="font-black">-</span>
                      <input
                        type="number"
                        min="0"
                        value={scores[match.id]?.officialAway ?? ""}
                        onChange={(event) =>
                          setScores((previous) => ({
                            ...previous,
                            [match.id]: {
                              ...previous[match.id],
                              officialAway: event.target.value,
                            },
                          }))
                        }
                        className="w-20 rounded-2xl bg-[#0b0513]/90 p-3 text-center text-xl font-black text-white outline-none ring-1 ring-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => saveOfficialScore(match.id)}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 font-black"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="pb-8 text-center text-xs font-bold text-slate-400">
          <p>Version stable Apple Review : {APP_VERSION}</p>
          <div className="mt-3 flex justify-center gap-4 text-emerald-200">
            <a href="/contact">Support</a>
            <a href="/privacy">Confidentialité</a>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-slate-300">{label}</p>
          <p className="text-4xl font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatButton({ active, icon, label, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[2rem] border p-6 text-left shadow-xl backdrop-blur-md transition ${
        active
          ? "border-emerald-300/40 bg-emerald-400/20"
          : "border-white/15 bg-[#22123a]/80 hover:bg-emerald-400/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-sm text-slate-300">{label}</p>
          <p className="mt-1 text-xs font-bold text-emerald-200">{sub}</p>
        </div>
      </div>
    </button>
  );
}

function MatchesSection({
  title,
  description,
  matches,
  emptyText,
  scores,
  getPrediction,
  onScoreChange,
  onSavePrediction,
  roundLabels,
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Lock className="h-6 w-6 text-emerald-300" />
          <div>
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="text-sm text-slate-300">{description}</p>
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 text-center text-slate-300 shadow-xl backdrop-blur-md">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-5">
          {matches.map((match) => {
            const prediction = getPrediction(match.id);
            const locked = isMatchLocked(match.match_date);
            const finished = isMatchFinished(match);
            const noModificationLeft = prediction && (prediction.edit_count || 0) >= 1;
            const predictionBlocked = locked || noModificationLeft;

            return (
              <div
                key={match.id}
                className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-xl backdrop-blur-md ${
                  finished
                    ? "border-slate-700 bg-slate-950/70 opacity-90"
                    : "border-white/15 bg-[#12091f]/75"
                }`}
              >
                <div className="mb-3 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-black text-emerald-200">
                  {match.stage === "GROUP"
                    ? `Groupe ${match.group_name || ""}`
                    : roundLabels[match.stage] || match.stage || "Match"}
                </div>

                {finished && (
                  <div className="mb-3 ml-2 inline-flex rounded-full bg-slate-700 px-3 py-1 text-sm font-black text-white">
                    TERMINÉ
                  </div>
                )}

                <h3 className="text-2xl font-black">
                  {match.home_team} - {match.away_team}
                </h3>

                <p className="mt-2 text-sm text-slate-300">{formatDate(match.match_date)}</p>

                <p className={`mt-2 font-black ${locked ? "text-red-400" : "text-emerald-400"}`}>
                  {locked ? "🔒 Paris fermé" : "🟢 Paris ouvert"}
                </p>

                {prediction && (
                  <div className="mt-3 rounded-2xl bg-emerald-500/20 p-3 ring-1 ring-emerald-300/20">
                    <p className="font-black text-emerald-300">
                      Ton pronostic : {prediction.predicted_home} - {prediction.predicted_away}
                    </p>

                    {finished && (
                      <div className="mt-3 rounded-2xl bg-yellow-400/20 p-4 text-center">
                        <p className="text-sm font-black text-yellow-200">Points gagnés</p>
                        <p className="text-4xl font-black text-yellow-300">
                          +{prediction.points || 0}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {prediction && !finished && (
                  <p className={`mt-2 text-xs font-bold ${predictionBlocked ? "text-red-300" : "text-orange-300"}`}>
                    {locked
                      ? "Paris fermé définitivement."
                      : noModificationLeft
                      ? "Tu as déjà utilisé ta seule modification possible."
                      : "Il te reste une seule modification possible jusqu’à 30 min avant le début du match."}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <input
                    disabled={predictionBlocked}
                    type="number"
                    min="0"
                    value={scores[match.id]?.home ?? ""}
                    onChange={(event) => onScoreChange(match.id, "home", event.target.value)}
                    className="w-20 rounded-2xl bg-[#12091f]/90 p-4 text-center text-xl font-black text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400 disabled:opacity-40"
                  />

                  <span className="text-2xl font-black">-</span>

                  <input
                    disabled={predictionBlocked}
                    type="number"
                    min="0"
                    value={scores[match.id]?.away ?? ""}
                    onChange={(event) => onScoreChange(match.id, "away", event.target.value)}
                    className="w-20 rounded-2xl bg-[#12091f]/90 p-4 text-center text-xl font-black text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400 disabled:opacity-40"
                  />

                  <button
                    type="button"
                    onClick={() => onSavePrediction(match)}
                    disabled={predictionBlocked}
                    className={`rounded-2xl px-5 py-4 font-black text-white shadow-lg disabled:opacity-50 ${
                      prediction
                        ? "bg-orange-500 shadow-orange-950/40"
                        : "bg-violet-600 shadow-violet-950/40"
                    }`}
                  >
                    {locked
                      ? "Paris fermé"
                      : noModificationLeft
                      ? "Modification utilisée"
                      : prediction
                      ? "Modifier"
                      : "Valider"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <AppErrorBoundary>
      <HomeContent />
    </AppErrorBoundary>
  );
}
