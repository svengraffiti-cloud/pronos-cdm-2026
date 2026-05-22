"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Trophy,
  Users,
  CalendarDays,
  Settings,
  Loader2,
  Bell,
  LogOut,
  UserCircle,
  Lock,
} from "lucide-react";

function AppShell({ children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0513] text-white">
      <div className="fixed inset-0 -z-20">
        <img
          src="/stadium.jpg"
          alt="Stade"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
      </div>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#22c55e88,transparent_34%),radial-gradient(circle_at_bottom_right,#7c3aed88,transparent_36%),linear-gradient(135deg,#020617cc,#1e0b38d9_45%,#064e3bcc)]" />
      <div className="fixed inset-0 -z-10 bg-black/25 backdrop-blur-[1px]" />

      {children}
    </main>
  );
}


function AppLogo({ className = "", alt = "Logo Pronos Famille" }) {
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

const MatchCard = memo(function MatchCard({
  match,
  locked,
  finished,
  prediction,
  matchPredictionRows,
  localScore,
  currentPlayerId,
  roundLabels,
  formattedDate,
  onScoreChange,
  onSavePrediction,
}) {
  const editCount = prediction?.edit_count || 0;
  const hasPrediction = Boolean(prediction);
  const noModificationLeft = hasPrediction && editCount >= 1;
  const predictionBlocked = locked || noModificationLeft;

  const buttonLabel = locked
    ? "Paris fermé"
    : noModificationLeft
    ? "Modification utilisée"
    : hasPrediction
    ? "Modifier"
    : "Valider";

  const buttonClassName = locked
    ? "rounded-2xl bg-slate-600 px-5 py-4 font-black text-slate-300 opacity-60"
    : noModificationLeft
    ? "rounded-2xl bg-slate-600 px-5 py-4 font-black text-slate-300 opacity-60"
    : hasPrediction
    ? "rounded-2xl bg-orange-500 px-5 py-4 font-black text-white shadow-lg shadow-orange-950/40"
    : "rounded-2xl bg-violet-600 px-5 py-4 font-black text-white shadow-lg shadow-violet-950/40";

  const [trendLoading, setTrendLoading] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [trendError, setTrendError] = useState("");

  async function loadMatchTrend() {
    if (trendLoading || trendData) return;

    setTrendLoading(true);
    setTrendError("");

    try {
      const params = new URLSearchParams({
        home: match.home_team || "",
        away: match.away_team || "",
        date: match.match_date || "",
      });

      const response = await fetch(`/api/match-trend?${params.toString()}`);
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Tendance indisponible.");
      }

      setTrendData(result);
    } catch (error) {
      setTrendError(error.message || "Tendance indisponible.");
    } finally {
      setTrendLoading(false);
    }
  }

  return (
    <div
      className={`relative overflow-visible rounded-[2rem] border p-6 shadow-xl backdrop-blur-md ${
        finished
          ? "border-slate-700 bg-slate-950/70 opacity-90"
          : "border-white/15 bg-[#12091f]/75"
      }`}
    >
      <div className="mb-3 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-black text-emerald-200">
        {match.stage === "GROUP"
          ? `Groupe ${match.group_name}`
          : roundLabels[match.stage] || match.stage}
      </div>

      {finished && (
        <div className="mb-3 ml-2 inline-flex rounded-full bg-slate-700 px-3 py-1 text-sm font-black text-white">
          TERMINÉ
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-black">
            {match.home_team} - {match.away_team}
          </h3>

          <p className="mt-2 text-sm text-slate-300">{formattedDate}</p>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={loadMatchTrend}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-emerald-500/20 text-xl shadow-lg ring-1 ring-emerald-300/20 transition hover:bg-emerald-500/30"
          >
            🍀
          </button>

          {(trendLoading || trendError || trendData) && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
              <div className="relative max-h-[86vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-white/10 bg-[#12091f] p-6 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setTrendData(null);
                    setTrendError("");
                  }}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-slate-300 hover:bg-white/20 hover:text-white"
                >
                  ×
                </button>

                <h4 className="mb-6 pr-10 text-2xl font-black text-emerald-300">
                  🍀 Cotes du match
                </h4>

                {trendLoading && (
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 text-sm font-bold text-slate-300">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
                    Chargement des vraies cotes...
                  </div>
                )}

                {!trendLoading && trendError && (
                  <div className="rounded-2xl bg-red-500/10 p-4 text-sm font-bold text-red-200 ring-1 ring-red-300/10">
                    {trendError}
                  </div>
                )}

                {!trendLoading && trendData && (
                  <>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-4">
                        <span className="text-base font-black text-white">
                          1 — {match.home_team}
                        </span>
                        <strong className="shrink-0 text-xl text-emerald-300">
                          {trendData.odds?.home || "Indispo"}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-4">
                        <span className="text-base font-black text-white">
                          N — Match nul
                        </span>
                        <strong className="shrink-0 text-xl text-emerald-300">
                          {trendData.odds?.draw || "Indispo"}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-4">
                        <span className="text-base font-black text-white">
                          2 — {match.away_team}
                        </span>
                        <strong className="shrink-0 text-xl text-emerald-300">
                          {trendData.odds?.away || "Indispo"}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-300/10">
                      <p className="text-sm text-emerald-200">🏦 Bookmaker</p>
                      <p className="mt-1 text-lg font-black text-white">
                        {trendData.bookmaker || "Bookmaker indisponible"}
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-300">
                        Cotes 1/N/2 réelles récupérées via API-Football.
                      </p>
                    </div>

                    {trendData.sourceFixture && (
                      <p className="mt-4 text-xs font-bold text-slate-400">
                        Match API : {trendData.sourceFixture}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className={`mt-2 font-black ${locked ? "text-red-400" : "text-emerald-400"}`}>
        {locked ? "🔒 Paris fermé" : "🟢 Paris ouvert"}
      </p>

      {!locked && (
        <p className="mt-1 text-xs font-bold text-slate-400">
          Verrouillage définitif 30 min avant le match.
        </p>
      )}

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

      {hasPrediction && !finished && (
        <p
          className={`mt-2 text-xs font-bold ${
            predictionBlocked ? "text-red-300" : "text-orange-300"
          }`}
        >
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
          value={localScore.home ?? ""}
          onChange={(e) => onScoreChange(match.id, "home", e.target.value)}
          className="w-20 rounded-2xl bg-[#12091f]/90 p-4 text-center text-xl font-black text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400 disabled:opacity-40"
        />

        <span className="text-2xl font-black">-</span>

        <input
          disabled={predictionBlocked}
          type="number"
          min="0"
          value={localScore.away ?? ""}
          onChange={(e) => onScoreChange(match.id, "away", e.target.value)}
          className="w-20 rounded-2xl bg-[#12091f]/90 p-4 text-center text-xl font-black text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400 disabled:opacity-40"
        />

        <button
          onClick={() => onSavePrediction(match, localScore)}
          disabled={predictionBlocked}
          className={buttonClassName}
        >
          {buttonLabel}
        </button>
      </div>

      {locked && (
        <div className="mt-5 rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
          <h4 className="mb-3 font-black text-emerald-300">Pronos des participants</h4>

          {matchPredictionRows.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun joueur.</p>
          ) : (
            <div className="space-y-2">
              {matchPredictionRows.map(({ player, prediction: item }) => {
                const isMe = player.id === currentPlayerId;

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.name || "Joueur"}
                          loading="lazy"
                          decoding="async"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-8 w-8 text-slate-300" />
                      )}
                      <span className="font-bold">
                        {player.name || "Joueur"}
                        {isMe && (
                          <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                            toi
                          </span>
                        )}
                      </span>
                    </div>

                    <strong className={item ? "text-white" : "text-red-300"}>
                      {item ? `${item.predicted_home} - ${item.predicted_away}` : "❌"}
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function Home() {
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [inviteAccessCode, setInviteAccessCode] = useState("");
  const [authName, setAuthName] = useState("");
  const [authAvatarFile, setAuthAvatarFile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const [profile, setProfile] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [creatingProfile, setCreatingProfile] = useState(false);

  const [tab, setTab] = useState("pronos");
  const [selectedPastDate, setSelectedPastDate] = useState("");
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scores, setScores] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [savedMatches, setSavedMatches] = useState({});
  const [pointsAudit, setPointsAudit] = useState(null);
  const APP_VERSION = "2026-05-19-paris-en-cours-v1";

  const roundLabels = {
    R32: "16es de finale",
    R16: "8es de finale",
    QF: "Quarts de finale",
    SF: "Demi-finales",
    FINAL: "Finale",
  };

  const isAdmin = profile?.role === "admin";
  const currentPlayerId = profile?.player_id;

  const groupNames = useMemo(
    () => [...new Set(teams.map((team) => team.group_name))],
    [teams]
  );

  const knockoutMatches = useMemo(
    () =>
      matches
        .filter((match) => match.stage !== "GROUP")
        .sort(
          (a, b) =>
            new Date(a.match_date) - new Date(b.match_date) ||
            (a.knockout_order || 0) - (b.knockout_order || 0)
        ),
    [matches]
  );

  const predictionByPlayerAndMatch = useMemo(() => {
    const map = new Map();

    predictions.forEach((prediction) => {
      map.set(`${prediction.player_id}-${prediction.match_id}`, prediction);
    });

    return map;
  }, [predictions]);

  const playerTotals = useMemo(() => {
    const totals = new Map();

    players.forEach((player) => {
      totals.set(player.id, 0);
    });

    predictions.forEach((prediction) => {
      totals.set(
        prediction.player_id,
        (totals.get(prediction.player_id) || 0) + (prediction.points || 0)
      );
    });

    return totals;
  }, [players, predictions]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [players]
  );

  const rankingPlayers = useMemo(
    () =>
      [...players].sort(
        (a, b) => (playerTotals.get(b.id) || 0) - (playerTotals.get(a.id) || 0)
      ),
    [players, playerTotals]
  );


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

  const predictionRowsByMatch = useMemo(() => {
    const map = new Map();

    matches.forEach((match) => {
      map.set(
        match.id,
        sortedPlayers.map((player) => ({
          player,
          prediction: predictionByPlayerAndMatch.get(`${player.id}-${match.id}`),
        }))
      );
    });

    return map;
  }, [matches, sortedPlayers, predictionByPlayerAndMatch]);

  const todayKey = useMemo(() => formatDayKey(new Date()), []);

  const todaysMatches = useMemo(
    () =>
      matches
        .filter((match) => formatDayKey(match.match_date) === todayKey)
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date)),
    [matches, todayKey]
  );

  const pastPredictionDateOptions = useMemo(() => {
    const keys = new Map();

    matches
      .filter((match) => {
        const isPastDay = formatDayKey(match.match_date) < todayKey;
        return isPastDay && getPrediction(match.id);
      })
      .forEach((match) => {
        const key = formatDayKey(match.match_date);
        if (!keys.has(key)) {
          keys.set(key, formatDayLabel(match.match_date));
        }
      });

    return [...keys.entries()]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [matches, predictions, currentPlayerId, todayKey]);

  const selectedPastMatches = useMemo(
    () =>
      matches
        .filter(
          (match) =>
            selectedPastDate &&
            formatDayKey(match.match_date) === selectedPastDate &&
            getPrediction(match.id)
        )
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date)),
    [matches, selectedPastDate, predictions, currentPlayerId]
  );

  const myCurrentBetMatches = useMemo(
    () =>
      matches
        .filter((match) => {
          const prediction = getPrediction(match.id);

          if (!prediction) return false;

          const isToday = formatDayKey(match.match_date) === todayKey;
          const isUnfinished = !isMatchFinished(match);

          return isToday || isUnfinished;
        })
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date)),
    [matches, predictions, currentPlayerId, todayKey]
  );

  const openMatches = useMemo(
    () =>
      matches
        .filter((match) => !isMatchFinished(match))
        .sort((a, b) => new Date(a.match_date) - new Date(b.match_date)),
    [matches]
  );

  const lockedTodayCount = useMemo(
    () => todaysMatches.filter((match) => isMatchLocked(match.match_date)).length,
    [todaysMatches]
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

      const groupMatches = matches.filter(
        (match) =>
          match.stage === "GROUP" &&
          match.group_name === groupName &&
          match.home_score !== null &&
          match.away_score !== null
      );

      groupMatches.forEach((match) => {
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

  const qualifiedTeamsMemo = useMemo(() => {
    const qualified = [];

    groupNames.forEach((groupName) => {
      const standings = groupStandingsByName.get(groupName) || [];

      if (standings[0]) {
        qualified.push({
          label: `1er Groupe ${groupName}`,
          team: standings[0].name,
        });
      }

      if (standings[1]) {
        qualified.push({
          label: `2e Groupe ${groupName}`,
          team: standings[1].name,
        });
      }
    });

    return qualified;
  }, [groupNames, groupStandingsByName]);

  const isMatchLocked = (matchDate) => {
    const lockTime = new Date(matchDate).getTime() - 30 * 60 * 1000;
    return Date.now() >= lockTime;
  };

  const isMatchFinished = (match) => {
    return match.home_score !== null && match.away_score !== null;
  };



  async function requestNotifications() {
    try {
      if (typeof window === "undefined") return;

      const { Capacitor } = await import("@capacitor/core");
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        let permission = await PushNotifications.checkPermissions();

        if (permission.receive !== "granted") {
          permission = await PushNotifications.requestPermissions();
        }

        if (permission.receive !== "granted") {
          setNotificationsEnabled(false);
          alert("Permission notifications refusée.");
          return;
        }

        PushNotifications.removeAllListeners();

        PushNotifications.addListener("registration", async (token) => {
          try {
            console.log("TOKEN FCM :", token.value);

            if (typeof window !== "undefined") {
              window.localStorage.setItem("push_token", token.value);
            }

            setNotificationsEnabled(true);
            alert("Notifications activées 👴🏻");
          } catch (error) {
            console.error("Erreur sauvegarde token push:", error);
            setNotificationsEnabled(true);
            alert("Notifications activées 👴🏻");
          }
        });

        PushNotifications.addListener("registrationError", (error) => {
          console.error("Erreur inscription push:", error);
          setNotificationsEnabled(false);
          alert("Erreur notifications.");
        });

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Notification reçue:", notification);
        });

        PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
          console.log("Notification ouverte:", notification);
        });

        await PushNotifications.register();
        return;
      }

      if (!("Notification" in window)) {
        setNotificationsEnabled(false);
        alert("Notifications non disponibles sur ce navigateur.");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setNotificationsEnabled(false);
        alert("Notifications refusées.");
        return;
      }

      setNotificationsEnabled(true);
      alert("Notifications web activées.");
    } catch (error) {
      console.error(error);
      setNotificationsEnabled(false);
      alert("Erreur activation notifications.");
    }
  }

  async function uploadAvatar(file, userId) {
    if (!file) return null;

    const extension = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${extension}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function loadProfile(userId) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    setProfile(profileData || null);

    if (profileData?.player_id) {
      const { data: playerData } = await supabase
        .from("players")
        .select("*")
        .eq("id", profileData.player_id)
        .maybeSingle();

      setCurrentPlayer(playerData || null);
    } else {
      setCurrentPlayer(null);
    }
  }

  async function loadData(options = {}) {
    const silent = options.silent ?? hasLoadedOnce;
    const showFullLoader = !silent && !hasLoadedOnce;

    if (showFullLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [playersResult, matchesResult, predictionsResult, teamsResult] =
        await Promise.all([
          supabase
            .from("players")
            .select("id, name, avatar_url, created_at")
            .order("created_at", { ascending: true }),
          supabase
            .from("matches")
            .select(
              "id, home_team, away_team, match_date, stage, group_name, knockout_order, home_score, away_score"
            )
            .order("match_date", { ascending: true }),
          supabase
            .from("predictions")
            .select(
              "id, player_id, match_id, predicted_home, predicted_away, points, edit_count"
            ),
          supabase
            .from("teams")
            .select("id, name, group_name")
            .order("group_name", { ascending: true }),
        ]);

      if (playersResult.error) throw playersResult.error;
      if (matchesResult.error) throw matchesResult.error;
      if (predictionsResult.error) throw predictionsResult.error;
      if (teamsResult.error) throw teamsResult.error;

      setPlayers(playersResult.data || []);
      setMatches(matchesResult.data || []);
      setPredictions(predictionsResult.data || []);
      setTeams(teamsResult.data || []);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshEverything(userId = session?.user?.id, options = {}) {
    if (!userId) return;

    const refreshOptions = {
      ...options,
      silent: options.silent ?? hasLoadedOnce,
    };

    await Promise.all([
      loadProfile(userId),
      loadData(refreshOptions),
    ]);
  }

  useEffect(() => {
    if (!selectedPastDate && pastPredictionDateOptions.length > 0) {
      setSelectedPastDate(pastPredictionDateOptions[0].key);
    }
  }, [pastPredictionDateOptions, selectedPastDate]);

  useEffect(() => {
    let isMounted = true;

    const unlockApp = () => {
      if (!isMounted) return;
      setAuthLoading(false);
      setLoading(false);
      setRefreshing(false);
    };

    const safetyTimer = setTimeout(() => {
      console.warn("Déblocage sécurité : chargement initial trop long.");
      unlockApp();
    }, 8000);

    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Erreur récupération session:", error);
          if (isMounted) {
            setSession(null);
          }
          return;
        }

        if (!isMounted) return;

        const currentSession = data?.session || null;
        setSession(currentSession);

        if (currentSession?.user?.id) {
          await Promise.race([
            refreshEverything(currentSession.user.id),
            new Promise((resolve) => setTimeout(resolve, 7000)),
          ]);
        }
      } catch (error) {
        console.error("Erreur init auth:", error);
        if (isMounted) {
          setSession(null);
        }
      } finally {
        unlockApp();
      }
    }

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        try {
          if (!isMounted) return;

          setSession(nextSession || null);

          if (nextSession?.user?.id) {
            setAuthLoading(true);

            await Promise.race([
              refreshEverything(nextSession.user.id),
              new Promise((resolve) => setTimeout(resolve, 7000)),
            ]);
          } else {
            setProfile(null);
            setCurrentPlayer(null);
            setPlayers([]);
            setMatches([]);
            setPredictions([]);
            setTeams([]);
            setNotificationsEnabled(false);
            setHasLoadedOnce(false);
          }
        } catch (error) {
          console.error("Erreur changement session:", error);
        } finally {
          unlockApp();
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    async function checkNotifications() {
      try {
        if (typeof window === "undefined") return;

        let isNativeApp = false;

        try {
          const { Capacitor } = await import("@capacitor/core");
          isNativeApp = Capacitor.isNativePlatform();
        } catch (error) {
          isNativeApp = false;
        }

        if (isNativeApp) {
          try {
            const { PushNotifications } = await import("@capacitor/push-notifications");
            const permission = await PushNotifications.checkPermissions();

            setNotificationsEnabled(permission.receive === "granted");
            return;
          } catch (error) {
            console.error(error);
            setNotificationsEnabled(false);
            return;
          }
        }

        if (!("Notification" in window)) {
          setNotificationsEnabled(false);
          return;
        }

        if (Notification.permission !== "granted") {
          setNotificationsEnabled(false);
          return;
        }

        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          setNotificationsEnabled(false);
          return;
        }

        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        const subscription = await registration?.pushManager.getSubscription();

        setNotificationsEnabled(Boolean(subscription));
      } catch (error) {
        console.error(error);
        setNotificationsEnabled(false);
      }
    }

    checkNotifications();
  }, []);

  useEffect(() => {
    async function clearOldAndroidWebCache() {
      try {
        if (typeof window === "undefined") return;

        const currentVersion = window.localStorage.getItem("papy_app_version");

        if (currentVersion === APP_VERSION) return;

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }

        window.localStorage.setItem("papy_app_version", APP_VERSION);
      } catch (error) {
        console.error("Nettoyage cache app impossible:", error);
      }
    }

    clearOldAndroidWebCache();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    let refreshTimer = null;

    const scheduleRefresh = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      refreshTimer = setTimeout(() => {
        refreshEverything(session.user.id, { silent: true });
      }, 350);
    };

    const channel = supabase
      .channel("live-data-refresh")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "predictions",
        },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
        },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, hasLoadedOnce]);

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

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) throw error;
      } else {
        const inviteResponse = await fetch("/api/check-invite-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: inviteAccessCode,
          }),
        // Code famille : PAPY2026
        });

        const inviteResult = await inviteResponse.json().catch(() => null);

        if (!inviteResponse.ok || !inviteResult?.valid) {
          setAuthError(inviteResult?.error || "Code d’accès famille (PAPY2026) incorrect.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });

        if (error) throw error;

        if (data.user) {
          let avatarUrl = null;

          if (authAvatarFile) {
            avatarUrl = await uploadAvatar(authAvatarFile, data.user.id);
          }

          const { data: playerData, error: playerError } = await supabase
            .from("players")
            .insert({
              name: authName.trim() || authEmail.split("@")[0],
              avatar_url: avatarUrl,
            })
            .select("*")
            .single();

          if (playerError) throw playerError;

          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            player_id: playerData.id,
            role: "player",
          });

          if (profileError) throw profileError;

          setProfile({
            id: data.user.id,
            player_id: playerData.id,
            role: "player",
          });
          setCurrentPlayer(playerData);
          await refreshEverything(data.user.id);
        }
      }
    } catch (error) {
      setAuthError(error.message || "Erreur de connexion.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function createMissingProfile(e) {
    e.preventDefault();
    if (!session?.user?.id) return;

    setCreatingProfile(true);
    setAuthError("");

    try {
      let avatarUrl = null;

      if (profileAvatarFile) {
        avatarUrl = await uploadAvatar(profileAvatarFile, session.user.id);
      }

      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({
          name: profileName.trim() || session.user.email?.split("@")[0] || "Joueur",
          avatar_url: avatarUrl,
        })
        .select("*")
        .single();

      if (playerError) throw playerError;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: session.user.id,
        player_id: playerData.id,
        role: "player",
      });

      if (profileError) throw profileError;

      await refreshEverything(session.user.id);
    } catch (error) {
      setAuthError(error.message || "Erreur de création du profil.");
    } finally {
      setCreatingProfile(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);

      await supabase.auth.signOut();

      setSession(null);
      setProfile(null);
      setCurrentPlayer(null);
      setPlayers([]);
      setMatches([]);
      setPredictions([]);
      setTeams([]);
      setScores({});
      setNotificationsEnabled(false);
      setHasLoadedOnce(false);

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      alert("Erreur pendant la déconnexion.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatDayKey(date) {
    return new Date(date).toLocaleDateString("fr-CA");
  }

  function formatDayLabel(date) {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function getPrediction(matchId) {
    return currentPredictionByMatch.get(matchId);
  }

  function getMatchPredictionRows(matchId) {
    return predictionRowsByMatch.get(matchId) || [];
  }

  function calculatePredictionPoints(prediction, match) {
    if (
      match.home_score === null ||
      match.away_score === null ||
      match.home_score === undefined ||
      match.away_score === undefined
    ) {
      return 0;
    }

    const ph = Number(prediction.predicted_home);
    const pa = Number(prediction.predicted_away);
    const rh = Number(match.home_score);
    const ra = Number(match.away_score);

    // Score exact = 3 points
    if (ph === rh && pa === ra) {
      return 3;
    }

    const predictedDiff = ph - pa;
    const realDiff = rh - ra;

    const predictedResult =
      predictedDiff > 0 ? "home" : predictedDiff < 0 ? "away" : "draw";

    const realResult =
      realDiff > 0 ? "home" : realDiff < 0 ? "away" : "draw";

    let points = 0;

    // Bon résultat : victoire domicile / nul / victoire extérieur
    if (predictedResult === realResult) {
      points += 1;
    }

    // Bon écart de buts
    if (predictedDiff === realDiff) {
      points += 1;
    }

    return points;
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
    async (match, localScore) => {
      if (!currentPlayerId) {
        alert("Profil joueur introuvable.");
        return;
      }

      if (isMatchLocked(match.match_date)) {
        alert("Paris fermés définitivement 30 min avant le coup d'envoi.");
        return;
      }

      const existing = predictionByPlayerAndMatch.get(`${currentPlayerId}-${match.id}`);

      if (existing && (existing.edit_count || 0) >= 1) {
        alert("Tu as déjà utilisé ta seule modification possible pour ce match.");
        return;
      }

      const home = localScore?.home;
      const away = localScore?.away;

      if (home === "" || away === "" || home === undefined || away === undefined) {
        alert("Entre les scores.");
        return;
      }

      if (existing) {
        await supabase
          .from("predictions")
          .update({
            predicted_home: Number(home),
            predicted_away: Number(away),
            edit_count: (existing.edit_count || 0) + 1,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("predictions").insert({
          player_id: currentPlayerId,
          match_id: match.id,
          predicted_home: Number(home),
          predicted_away: Number(away),
          edit_count: 0,
        });
      }

      const { data: refreshedPrediction, error } = await supabase
        .from("predictions")
        .select(
          "id, player_id, match_id, predicted_home, predicted_away, points, edit_count"
        )
        .eq("player_id", currentPlayerId)
        .eq("match_id", match.id)
        .single();

      if (error) {
        console.error("Erreur récupération prono:", error);
        await loadData({ silent: true });
        return;
      }

      setPredictions((prev) => {
        const filtered = prev.filter(
          (p) => !(p.player_id === currentPlayerId && p.match_id === match.id)
        );

        return [...filtered, refreshedPrediction];
      });
    },
    [currentPlayerId, predictionByPlayerAndMatch]
  );

  async function verifyMatchPoints(matchId, officialMatch) {
    const { data: freshPredictions, error } = await supabase
      .from("predictions")
      .select("id, player_id, match_id, predicted_home, predicted_away, points")
      .eq("match_id", matchId);

    if (error) {
      throw error;
    }

    const mismatches = (freshPredictions || []).filter((prediction) => {
      const expectedPoints = calculatePredictionPoints(prediction, officialMatch);
      return Number(prediction.points || 0) !== expectedPoints;
    });

    return {
      checked: freshPredictions?.length || 0,
      mismatches,
    };
  }

  async function saveOfficialScore(matchId) {
    if (!isAdmin) {
      alert("Accès admin requis.");
      return;
    }

    const match = matches.find((m) => m.id === matchId);

    if (!match) {
      alert("Match introuvable.");
      return;
    }

    const home = scores[matchId]?.officialHome;
    const away = scores[matchId]?.officialAway;

    if (home === "" || away === "" || home === undefined || away === undefined) {
      alert("Entre les deux scores officiels avant de valider.");
      return;
    }

    const newHome = Number(home);
    const newAway = Number(away);

    if (
      Number.isNaN(newHome) ||
      Number.isNaN(newAway) ||
      newHome < 0 ||
      newAway < 0
    ) {
      alert("Scores invalides : uniquement des nombres positifs.");
      return;
    }

    const alreadyHadScore = match.home_score !== null && match.away_score !== null;
    const confirmation = window.confirm(
      alreadyHadScore
        ? `Ce match avait déjà un score. Confirmer le remplacement par ${newHome}-${newAway} et le recalcul sécurisé des points ?`
        : `Confirmer le score officiel ${newHome}-${newAway} et le recalcul sécurisé des points ?`
    );

    if (!confirmation) return;

    setRefreshing(true);
    setPointsAudit({
      status: "running",
      message: "Validation du score et double vérification des points en cours...",
    });

    try {
      const { data: updatedMatch, error: matchError } = await supabase
        .from("matches")
        .update({
          home_score: newHome,
          away_score: newAway,
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

      const audit = await verifyMatchPoints(matchId, updatedMatch);

      if (audit.mismatches.length > 0) {
        setPointsAudit({
          status: "error",
          message: `Alerte : ${audit.mismatches.length} erreur(s) détectée(s) après recalcul sur ${audit.checked} pronostic(s).`,
        });

        alert("⚠️ Erreur détectée : les points ne correspondent pas après recalcul. Ne publie pas ce résultat.");
        return;
      }

      await refreshEverything(session?.user?.id, { silent: true });

      setSavedMatches((prev) => ({
        ...prev,
        [matchId]: true,
      }));

      setPointsAudit({
        status: "success",
        message: `Score validé et points vérifiés : ${audit.checked} pronostic(s) contrôlé(s), 0 erreur.`,
      });
    } catch (error) {
      console.error("Erreur validation score sécurisé:", error);

      setPointsAudit({
        status: "error",
        message: error.message || "Erreur pendant la validation sécurisée du score.",
      });

      alert(`Erreur validation sécurisée : ${error?.message || JSON.stringify(error)}`);
    } finally {
      setRefreshing(false);
    }
  }

  async function recalculateAndVerifyAllPoints() {
    if (!isAdmin) {
      alert("Accès admin requis.");
      return;
    }

    const confirmation = window.confirm(
      "Lancer une double vérification complète de tous les points du concours ?"
    );

    if (!confirmation) return;

    setRefreshing(true);
    setPointsAudit({
      status: "running",
      message: "Recalcul complet et audit des points en cours...",
    });

    try {
      const [matchesResult, predictionsResult] = await Promise.all([
        supabase
          .from("matches")
          .select("id, home_team, away_team, match_date, stage, group_name, knockout_order, home_score, away_score"),
        supabase
          .from("predictions")
          .select("id, player_id, match_id, predicted_home, predicted_away, points"),
      ]);

      if (matchesResult.error) throw matchesResult.error;
      if (predictionsResult.error) throw predictionsResult.error;

      const freshMatches = matchesResult.data || [];
      const freshPredictions = predictionsResult.data || [];

      for (const prediction of freshPredictions) {
        const match = freshMatches.find((item) => item.id === prediction.match_id);

        if (!match) continue;

        const points = calculatePredictionPoints(prediction, match);

        const { error: updateError } = await supabase
          .from("predictions")
          .update({ points })
          .eq("id", prediction.id);

        if (updateError) throw updateError;
      }

      const { data: auditPredictions, error: auditError } = await supabase
        .from("predictions")
        .select("id, player_id, match_id, predicted_home, predicted_away, points");

      if (auditError) throw auditError;

      const orphanPredictions = (auditPredictions || []).filter((prediction) => {
        return !freshMatches.find((item) => item.id === prediction.match_id);
      });

      const mismatches = (auditPredictions || []).filter((prediction) => {
        const match = freshMatches.find((item) => item.id === prediction.match_id);

        if (!match) return false;

        const expectedPoints = calculatePredictionPoints(prediction, match);
        return Number(prediction.points || 0) !== expectedPoints;
      });

      await refreshEverything(session?.user?.id, { silent: true });

      if (orphanPredictions.length > 0) {
        setPointsAudit({
          status: "error",
          message: `Alerte : ${orphanPredictions.length} pronostic(s) orphelin(s) lié(s) à des matchs supprimés. Nettoyage Supabase nécessaire avant publication.`,
        });

        alert("⚠️ Audit terminé avec pronostics orphelins. Ne publie pas le classement.");
        return;
      }

      if (mismatches.length > 0) {
        setPointsAudit({
          status: "error",
          message: `Alerte : ${mismatches.length} erreur(s) détectée(s) après audit complet.`,
        });

        alert("⚠️ Audit terminé avec erreurs. Ne publie pas le classement.");
        return;
      }

      setPointsAudit({
        status: "success",
        message: `Audit complet validé : ${auditPredictions?.length || 0} pronostic(s) vérifié(s), 0 erreur.`,
      });

      alert("✅ Tous les points ont été recalculés et vérifiés.");
    } catch (error) {
      console.error("Erreur audit complet des points:", error);

      setPointsAudit({
        status: "error",
        message: error.message || "Erreur pendant l’audit complet des points.",
      });

      alert(`Erreur audit complet : ${error?.message || JSON.stringify(error)}`);
    } finally {
      setRefreshing(false);
    }
  }

  async function addPlayer() {
    if (!isAdmin) return;
    if (!newPlayer.trim()) return;

    await supabase.from("players").insert({
      name: newPlayer.trim(),
    });

    setNewPlayer("");
    await loadData({ silent: true });
  }

  function playerTotal(playerId) {
    return playerTotals.get(playerId) || 0;
  }

  function getGroupStandings(groupName) {
    return groupStandingsByName.get(groupName) || [];
  }

  function getQualifiedTeams() {
    return qualifiedTeamsMemo;
  }

  function getWinner(match) {
    if (
      match.home_score === null ||
      match.away_score === null ||
      match.home_score === undefined ||
      match.away_score === undefined
    ) {
      return null;
    }

    if (match.home_score > match.away_score) return match.home_team;
    if (match.away_score > match.home_score) return match.away_team;

    return "Vainqueur à définir";
  }

  if (authLoading) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-6">
          <div className="flex w-full max-w-xl flex-col items-center rounded-[2rem] border border-emerald-300/20 bg-[#12091f]/75 p-10 text-center shadow-2xl backdrop-blur-md">
            <AppLogo className="mb-6 h-28 w-28 rounded-3xl object-contain ring-4 ring-emerald-300/30" />
            <Loader2 className="h-10 w-10 animate-spin text-emerald-300" />
            <p className="mt-5 text-sm font-black uppercase tracking-[0.3em] text-emerald-300">
              Chargement
            </p>
          </div>
        </div>
      </AppShell>
    );
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
                Connecte-toi pour accéder uniquement à ta feuille de pronostic.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-white/5 p-2">
              <button
                onClick={() => setAuthMode("login")}
                className={`rounded-xl py-3 font-black ${
                  authMode === "login" ? "bg-violet-600" : "text-slate-300"
                }`}
              >
                Connexion
              </button>
              <button
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
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Ton prénom / pseudo"
                    className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
                  />

                  <p className="rounded-2xl bg-white/5 p-4 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                    Photo de profil désactivée temporairement pour garantir la stabilité iPad pendant la vérification Apple.
                  </p>

                  <input
                    value={inviteAccessCode}
                    onChange={(e) => setInviteAccessCode(e.target.value)}
                    type="text"
                    placeholder="Code d’accès famille"
                    required
                    className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
                  />

                  <p className="rounded-2xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/10">
                    Ce code est demandé uniquement à la création du compte. Les comptes déjà créés se connectent normalement.
                  </p>
                </>
              )}

              <input
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                type="email"
                placeholder="Email"
                required
                className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
              />

              <input
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
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
                Ce profil sera lié à ton compte. Tu n’auras accès qu’à tes pronos.
              </p>
            </div>

            <form onSubmit={createMissingProfile} className="mt-6 space-y-4">
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
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
          <div className="absolute inset-0 -z-10">
            <img
              src="/stadium.jpg"
              alt="Stade"
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-[#22123a]/75 to-violet-900/85" />
          </div>

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
                  alt={currentPlayer.name}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-10 w-10 text-emerald-300" />
              )}

              <div className="text-left">
                <p className="text-xs text-slate-300">Connecté en tant que</p>
                <p className="font-black">{currentPlayer?.name}</p>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-lg text-slate-200">
              Ton espace pronos sécurisé. Les pronos des autres apparaissent uniquement après fermeture des paris.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={requestNotifications}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white ring-1 ring-white/10"
              >
                <Bell className="h-5 w-5" />
                {notificationsEnabled
                  ? "Notifications activées 👴🏻"
                  : "Activer les notifications 👴🏻"}
              </button>

              <button
                onClick={() => refreshEverything(session?.user?.id, { silent: true })}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 px-5 py-3 font-black text-white ring-1 ring-emerald-300/20 transition hover:bg-emerald-500/30 disabled:opacity-60"
              >
                <span className={refreshing ? "inline-block animate-spin" : ""}>
                  🔄
                </span>
                {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
              </button>

              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white ring-1 ring-white/10"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7 text-emerald-300" />
              <div>
                <p className="text-sm text-slate-300">Joueurs</p>
                <p className="text-4xl font-black">{players.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-7 w-7 text-emerald-300" />
              <div>
                <p className="text-sm text-slate-300">Matchs</p>
                <p className="text-4xl font-black">{matches.length}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTab("encours")}
            className={`rounded-[2rem] border p-6 text-left shadow-xl backdrop-blur-md transition ${
              tab === "encours"
                ? "border-emerald-300/40 bg-emerald-400/20"
                : "border-white/15 bg-[#22123a]/80 hover:bg-emerald-400/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <p className="text-sm text-slate-300">Suivi</p>
                <p className="text-2xl font-black">Mes paris en cours</p>
                <p className="mt-1 text-xs font-bold text-emerald-200">
                  {myCurrentBetMatches.length} pari(s) actif(s)
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTab("jour")}
            className={`rounded-[2rem] border p-6 text-left shadow-xl backdrop-blur-md transition ${
              tab === "jour"
                ? "border-yellow-300/40 bg-yellow-400/20"
                : "border-white/15 bg-[#22123a]/80 hover:bg-yellow-400/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">📅</span>
              <div>
                <p className="text-sm text-slate-300">Aujourd’hui</p>
                <p className="text-2xl font-black">Mes pronos du jour</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTab("historique")}
            className={`rounded-[2rem] border p-6 text-left shadow-xl backdrop-blur-md transition ${
              tab === "historique"
                ? "border-violet-300/40 bg-violet-500/20"
                : "border-white/15 bg-[#22123a]/80 hover:bg-violet-500/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🗂️</span>
              <div>
                <p className="text-sm text-slate-300">Archives</p>
                <p className="text-2xl font-black">Mes paris passés</p>
              </div>
            </div>
          </button>
        </section>

        <nav className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            {[
              {
                key: "pronos",
                icon: "⚽",
              },
              {
                key: "encours",
                icon: "🎯",
              },
              {
                key: "jour",
                icon: "📅",
              },
              {
                key: "historique",
                icon: "🗂️",
              },
              {
                key: "classement",
                icon: "🏆",
              },
              {
                key: "groupes",
                icon: "👥",
              },
              {
                key: "tableau",
                icon: "📋",
              },
              ...(isAdmin
                ? [
                    {
                      key: "admin",
                      icon: "🔒",
                    },
                  ]
                : []),
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition ${
                  tab === item.key
                    ? "bg-violet-600 shadow-lg shadow-violet-950/40"
                    : "bg-white/5 hover:bg-emerald-500/20"
                }`}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </nav>

        {refreshing && !loading && (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-200 shadow-xl backdrop-blur-md">
            Mise à jour en cours...
          </div>
        )}

        {loading && !hasLoadedOnce ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-[2rem] border border-emerald-300/20 bg-[#12091f]/75 p-10 text-center shadow-2xl backdrop-blur-md">
            <AppLogo className="mb-6 h-24 w-24 rounded-3xl object-contain ring-4 ring-emerald-300/30" />
            <Loader2 className="h-10 w-10 animate-spin text-emerald-300" />
            <p className="mt-5 text-sm font-black uppercase tracking-[0.3em] text-emerald-300">
              Chargement
            </p>
            <p className="mt-2 text-slate-300">
              Chargement initial des données...
            </p>
          </div>
        ) : (
          <>
            {tab === "pronos" && (
              <section className="space-y-6">
                <div className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <Lock className="h-6 w-6 text-emerald-300" />
                    <div>
                      <h2 className="text-2xl font-black">Ta feuille de pronostic</h2>
                      <p className="text-sm text-slate-300">
                        Tu ne peux remplir que tes propres pronos. Tu as une seule modification possible, puis les paris se verrouillent définitivement 30 min avant le coup d’envoi.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">

                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <span className="text-3xl">🔥</span>

                      <div>
                        <h2 className="text-2xl font-black">
                          Paris ouverts
                        </h2>

                        <p className="text-sm text-slate-300">
                          Pronostique les prochains matchs avant verrouillage.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {openMatches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            locked={isMatchLocked(match.match_date)}
                            finished={isMatchFinished(match)}
                            prediction={getPrediction(match.id)}
                            matchPredictionRows={getMatchPredictionRows(match.id)}
                            localScore={scores[match.id] || {}}
                            currentPlayerId={currentPlayerId}
                            roundLabels={roundLabels}
                            formattedDate={formatDate(match.match_date)}
                            onScoreChange={handlePredictionScoreChange}
                            onSavePrediction={savePrediction}
                          />
                        ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <span className="text-3xl">✅</span>

                      <div>
                        <h2 className="text-2xl font-black">
                          Matchs terminés
                        </h2>

                        <p className="text-sm text-slate-300">
                          Historique des matchs déjà joués et points gagnés.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 opacity-90 md:grid-cols-2">
                      {matches
                        .filter(
                          (match) =>
                            match.home_score !== null &&
                            match.home_score !== undefined &&
                            match.away_score !== null &&
                            match.away_score !== undefined
                        )
                        .map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            locked={isMatchLocked(match.match_date)}
                            finished={isMatchFinished(match)}
                            prediction={getPrediction(match.id)}
                            matchPredictionRows={getMatchPredictionRows(match.id)}
                            localScore={scores[match.id] || {}}
                            currentPlayerId={currentPlayerId}
                            roundLabels={roundLabels}
                            formattedDate={formatDate(match.match_date)}
                            onScoreChange={handlePredictionScoreChange}
                            onSavePrediction={savePrediction}
                          />
                        ))}
                    </div>
                  </div>

                </div>
              </section>
            )}

            {tab === "encours" && (
              <section className="space-y-6">
                <div className="rounded-[2rem] border border-emerald-300/25 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🎯</span>
                    <div>
                      <h2 className="text-2xl font-black">Mes paris en cours</h2>
                      <p className="text-sm text-slate-300">
                        Retrouve ici tes pronos validés, les matchs verrouillés, les scores officiels dès validation admin et tes points. Cette page reste utile toute la journée pour suivre l’évolution.
                      </p>
                    </div>
                  </div>
                </div>

                {myCurrentBetMatches.length === 0 ? (
                  <div className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-6 text-center shadow-xl backdrop-blur-md">
                    <p className="text-4xl">🎯</p>
                    <h3 className="mt-3 text-2xl font-black">Aucun pari en cours</h3>
                    <p className="mt-2 text-slate-300">
                      Va dans Paris ouverts ou Mes pronos du jour pour valider tes prochains scores.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab("jour")}
                      className="mt-5 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white shadow-xl"
                    >
                      Voir les pronos du jour
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {myCurrentBetMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        locked={isMatchLocked(match.match_date)}
                        finished={isMatchFinished(match)}
                        prediction={getPrediction(match.id)}
                        matchPredictionRows={getMatchPredictionRows(match.id)}
                        localScore={scores[match.id] || {}}
                        currentPlayerId={currentPlayerId}
                        roundLabels={roundLabels}
                        formattedDate={formatDate(match.match_date)}
                        onScoreChange={handlePredictionScoreChange}
                        onSavePrediction={savePrediction}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === "jour" && (
              <section className="space-y-6">
                <div className="rounded-[2rem] border border-yellow-300/25 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">📅</span>
                    <div>
                      <h2 className="text-2xl font-black">Mes pronos du jour</h2>
                      <p className="text-sm text-slate-300">
                        Tes matchs du jour restent ici avec tes pronos, les scores officiels et tes points. Verrouillés aujourd’hui : {lockedTodayCount}/{todaysMatches.length}.
                      </p>
                    </div>
                  </div>
                </div>

                {todaysMatches.length === 0 ? (
                  <div className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-6 text-center shadow-xl backdrop-blur-md">
                    <p className="text-4xl">😴</p>
                    <h3 className="mt-3 text-2xl font-black">Aucun match aujourd’hui</h3>
                    <p className="mt-2 text-slate-300">
                      Reviens demain ou consulte tes paris passés.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {todaysMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        locked={isMatchLocked(match.match_date)}
                        finished={isMatchFinished(match)}
                        prediction={getPrediction(match.id)}
                        matchPredictionRows={getMatchPredictionRows(match.id)}
                        localScore={scores[match.id] || {}}
                        currentPlayerId={currentPlayerId}
                        roundLabels={roundLabels}
                        formattedDate={formatDate(match.match_date)}
                        onScoreChange={handlePredictionScoreChange}
                        onSavePrediction={savePrediction}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === "historique" && (
              <section className="space-y-6">
                <div className="rounded-[2rem] border border-violet-300/25 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">🗂️</span>
                      <div>
                        <h2 className="text-2xl font-black">Mes paris passés</h2>
                        <p className="text-sm text-slate-300">
                          Choisis une date pour revoir tes pronos, les résultats et les points gagnés.
                        </p>
                      </div>
                    </div>

                    <select
                      value={selectedPastDate}
                      onChange={(e) => setSelectedPastDate(e.target.value)}
                      className="rounded-2xl bg-[#0b0513]/90 p-4 font-black text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
                    >
                      {pastPredictionDateOptions.length === 0 ? (
                        <option value="">Aucun pari passé</option>
                      ) : (
                        pastPredictionDateOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {selectedPastMatches.length === 0 ? (
                  <div className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-6 text-center shadow-xl backdrop-blur-md">
                    <p className="text-4xl">📭</p>
                    <h3 className="mt-3 text-2xl font-black">Aucun pari pour cette date</h3>
                    <p className="mt-2 text-slate-300">
                      Les paris passés apparaîtront ici après les premières journées.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {selectedPastMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        locked={isMatchLocked(match.match_date)}
                        finished={isMatchFinished(match)}
                        prediction={getPrediction(match.id)}
                        matchPredictionRows={getMatchPredictionRows(match.id)}
                        localScore={scores[match.id] || {}}
                        currentPlayerId={currentPlayerId}
                        roundLabels={roundLabels}
                        formattedDate={formatDate(match.match_date)}
                        onScoreChange={handlePredictionScoreChange}
                        onSavePrediction={savePrediction}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === "classement" && (
              <section className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-6 shadow-xl backdrop-blur-md">
                <h2 className="mb-5 flex items-center gap-2 text-2xl font-black">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  Classement joueurs
                </h2>

                {rankingPlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className="mb-3 flex items-center justify-between rounded-2xl bg-[#12091f]/70 p-4 ring-1 ring-white/10"
                    >
                      <div className="flex items-center gap-3">
                        {player.avatar_url ? (
                          <img
                            src={player.avatar_url}
                            alt={player.name}
                            loading="lazy"
                            decoding="async"
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-9 w-9 text-slate-300" />
                        )}
                        <span>
                          {index + 1}. {player.name}
                        </span>
                      </div>

                      <strong>{playerTotal(player.id)} pts</strong>
                    </div>
                  ))}
              </section>
            )}

            {tab === "groupes" && (
              <section className="grid gap-5 md:grid-cols-2">
                {groupNames.map((groupName) => {
                  const standings = getGroupStandings(groupName);

                  return (
                    <div
                      key={groupName}
                      className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md"
                    >
                      <h2 className="mb-4 text-2xl font-black">Groupe {groupName}</h2>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-slate-300">
                            <tr>
                              <th className="p-2 text-left">#</th>
                              <th className="p-2 text-left">Équipe</th>
                              <th className="p-2">MJ</th>
                              <th className="p-2">G</th>
                              <th className="p-2">N</th>
                              <th className="p-2">P</th>
                              <th className="p-2">BP</th>
                              <th className="p-2">BC</th>
                              <th className="p-2">Diff</th>
                              <th className="p-2">Pts</th>
                            </tr>
                          </thead>

                          <tbody>
                            {standings.map((team, index) => (
                              <tr key={team.name} className="border-t border-white/10">
                                <td className="p-2 font-bold">{index + 1}</td>
                                <td className="p-2 font-bold">
                                  {team.name}
                                  {index < 2 && (
                                    <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                                      qualifié
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-center">{team.played}</td>
                                <td className="p-2 text-center">{team.wins}</td>
                                <td className="p-2 text-center">{team.draws}</td>
                                <td className="p-2 text-center">{team.losses}</td>
                                <td className="p-2 text-center">{team.goalsFor}</td>
                                <td className="p-2 text-center">{team.goalsAgainst}</td>
                                <td className="p-2 text-center">{team.goalDifference}</td>
                                <td className="p-2 text-center font-black">{team.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {tab === "tableau" && (
              <section className="space-y-6">
                <div className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
                  <h2 className="text-2xl font-black">Équipes qualifiées provisoires</h2>

                  <p className="mt-2 text-sm text-slate-300">
                    Pour l’instant, les deux premiers de chaque groupe sont listés automatiquement.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {getQualifiedTeams().map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl bg-[#12091f]/70 p-4 ring-1 ring-white/10"
                      >
                        <p className="text-sm text-emerald-300">{item.label}</p>
                        <p className="text-xl font-black">{item.team}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
                  <h2 className="mb-5 text-2xl font-black">Tableau final</h2>

                  <div className="grid gap-5 md:grid-cols-2">
                    {knockoutMatches.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-2xl bg-[#12091f]/70 p-4 ring-1 ring-white/10"
                      >
                        <div className="mb-2 inline-flex rounded-full bg-violet-500/20 px-3 py-1 text-sm font-black text-violet-200">
                          {roundLabels[match.stage] || match.stage}
                        </div>

                        <h3 className="text-xl font-black">
                          {match.home_team} - {match.away_team}
                        </h3>

                        <p className="mt-2 text-sm text-slate-300">
                          {formatDate(match.match_date)}
                        </p>

                        <p className="mt-3">
                          Score :{" "}
                          <strong>
                            {match.home_score ?? "-"} - {match.away_score ?? "-"}
                          </strong>
                        </p>

                        <p className="mt-2 text-sm text-emerald-300">
                          Qualifié : {getWinner(match) || "à déterminer"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {tab === "admin" && isAdmin && (
              <section className="space-y-6">
                <div className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
                  <h2 className="mb-5 flex items-center gap-2 text-2xl font-black">
                    <Settings className="h-6 w-6" />
                    Ajouter un joueur manuel
                  </h2>

                  <div className="flex gap-3">
                    <input
                      value={newPlayer}
                      onChange={(e) => setNewPlayer(e.target.value)}
                      placeholder="Nom du joueur"
                      className="flex-1 rounded-2xl bg-[#12091f]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
                    />

                    <button
                      onClick={addPlayer}
                      className="rounded-2xl bg-violet-600 px-5 py-4 font-black"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/15 bg-[#12091f]/75 p-6 shadow-xl backdrop-blur-md">
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Résultats officiels</h2>
                      <p className="mt-1 text-sm text-slate-300">
                        Chaque score validé déclenche un recalcul puis une double vérification en base.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={recalculateAndVerifyAllPoints}
                      disabled={refreshing}
                      className="rounded-2xl bg-yellow-400 px-5 py-4 font-black text-black shadow-xl disabled:opacity-60"
                    >
                      🔐 Audit complet des points
                    </button>
                  </div>

                  {pointsAudit && (
                    <div
                      className={`mb-5 rounded-2xl p-4 text-sm font-black ring-1 ${
                        pointsAudit.status === "success"
                          ? "bg-emerald-500/15 text-emerald-200 ring-emerald-300/20"
                          : pointsAudit.status === "error"
                          ? "bg-red-500/15 text-red-200 ring-red-300/20"
                          : "bg-yellow-400/15 text-yellow-100 ring-yellow-300/20"
                      }`}
                    >
                      {pointsAudit.message}
                    </div>
                  )}

                  <div className="space-y-4">
                    {matches.map((match) => {
                      const matchPredictions = predictions.filter(
                        (prediction) => prediction.match_id === match.id
                      );

                      const playersWhoPredicted = players.filter((player) =>
                        matchPredictions.some(
                          (prediction) => prediction.player_id === player.id
                        )
                      );

                      const playersMissing = players.filter(
                        (player) =>
                          !matchPredictions.some(
                            (prediction) => prediction.player_id === player.id
                          )
                      );

                      return (
                        <div
                          key={match.id}
                          className="rounded-2xl bg-[#12091f]/70 p-4 ring-1 ring-white/10"
                        >
                          <div className="mb-2 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-black text-emerald-200">
                            {match.stage === "GROUP"
                              ? `Groupe ${match.group_name}`
                              : roundLabels[match.stage] || match.stage}
                          </div>

                          <h3 className="font-black">
                            {match.home_team} - {match.away_team}
                          </h3>

                          <p className="mt-1 text-sm text-slate-300">
                            {formatDate(match.match_date)}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              value={scores[match.id]?.officialHome ?? ""}
                              onChange={(e) =>
                                setScores({
                                  ...scores,
                                  [match.id]: {
                                    ...scores[match.id],
                                    officialHome: e.target.value,
                                  },
                                })
                              }
                              className="w-20 rounded-2xl bg-slate-950 p-3 text-center outline-none ring-1 ring-white/10 focus:ring-emerald-400"
                            />

                            <span>-</span>

                            <input
                              type="number"
                              min="0"
                              value={scores[match.id]?.officialAway ?? ""}
                              onChange={(e) =>
                                setScores({
                                  ...scores,
                                  [match.id]: {
                                    ...scores[match.id],
                                    officialAway: e.target.value,
                                  },
                                })
                              }
                              className="w-20 rounded-2xl bg-slate-950 p-3 text-center outline-none ring-1 ring-white/10 focus:ring-emerald-400"
                            />

                            <button
                              onClick={() => saveOfficialScore(match.id)}
                              className={`rounded-2xl px-4 py-3 font-black transition ${
                                savedMatches[match.id]
                                  ? "bg-yellow-400 text-black"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              {savedMatches[match.id]
                                ? "✅ Vérifié"
                                : "Valider + vérifier"}
                            </button>
                          </div>

                          <details className="mt-4 rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
                            <summary className="cursor-pointer list-none font-black text-emerald-300">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <span>Voir le suivi des pronos</span>
                                <span className="text-sm text-slate-300">
                                  ✅ {playersWhoPredicted.length}/{players.length} ont joué · ❌ {playersMissing.length} manquant(s)
                                </span>
                              </div>
                            </summary>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <div className="rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-300/10">
                                <p className="mb-3 font-black text-emerald-300">
                                  ✅ Ont pronostiqué ({playersWhoPredicted.length})
                                </p>

                                {playersWhoPredicted.length === 0 ? (
                                  <p className="text-sm text-slate-400">
                                    Aucun joueur.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {playersWhoPredicted.map((player) => {
                                      const prediction = matchPredictions.find(
                                        (item) => item.player_id === player.id
                                      );

                                      return (
                                        <div
                                          key={player.id}
                                          className="flex items-center justify-between rounded-xl bg-white/5 p-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            {player.avatar_url ? (
                                              <img
                                                src={player.avatar_url}
                                                alt={player.name}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-8 w-8 rounded-full object-cover"
                                              />
                                            ) : (
                                              <UserCircle className="h-8 w-8 text-slate-300" />
                                            )}

                                            <span className="font-bold">
                                              {player.name}
                                            </span>
                                          </div>

                                          <strong>
                                            {prediction?.predicted_home} - {prediction?.predicted_away}
                                          </strong>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div className="rounded-2xl bg-red-500/10 p-4 ring-1 ring-red-300/10">
                                <p className="mb-3 font-black text-red-300">
                                  ❌ Pas encore pronostiqué ({playersMissing.length})
                                </p>

                                {playersMissing.length === 0 ? (
                                  <p className="text-sm text-emerald-300">
                                    Tout le monde a joué 👌
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {playersMissing.map((player) => (
                                      <div
                                        key={player.id}
                                        className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
                                      >
                                        {player.avatar_url ? (
                                          <img
                                            src={player.avatar_url}
                                            alt={player.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-8 w-8 rounded-full object-cover"
                                          />
                                        ) : (
                                          <UserCircle className="h-8 w-8 text-slate-300" />
                                        )}

                                        <span className="font-bold">
                                          {player.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </details>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
