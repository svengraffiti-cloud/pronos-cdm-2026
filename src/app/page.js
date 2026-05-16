"use client";

import Image from "next/image";
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
  Camera,
  UserCircle,
  Lock,
} from "lucide-react";

function AppShell({ children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0513] text-white">
      <div className="fixed inset-0 -z-20">
        <Image
          src="/stadium.jpg"
          alt="Stade"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
      </div>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#22c55e88,transparent_34%),radial-gradient(circle_at_bottom_right,#7c3aed88,transparent_36%),linear-gradient(135deg,#020617cc,#1e0b38d9_45%,#064e3bcc)]" />
      <div className="fixed inset-0 -z-10 bg-black/25 backdrop-blur-[1px]" />

      {children}
    </main>
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
  return (
    <div
      className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-md ${
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

      <h3 className="text-2xl font-black">
        {match.home_team} - {match.away_team}
      </h3>

      <p className="mt-2 text-sm text-slate-300">{formattedDate}</p>

      <p className={`mt-2 font-black ${locked ? "text-red-400" : "text-emerald-400"}`}>
        {locked ? "🔒 Paris verrouillés" : "🟢 Paris ouverts"}
      </p>

      {!locked && (
        <p className="mt-1 text-xs font-bold text-slate-400">
          Verrouillage 1h30 avant le match.
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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          disabled={locked}
          type="number"
          min="0"
          value={localScore.home ?? ""}
          onChange={(e) => onScoreChange(match.id, "home", e.target.value)}
          className="w-20 rounded-2xl bg-[#12091f]/90 p-4 text-center text-xl font-black text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400 disabled:opacity-40"
        />

        <span className="text-2xl font-black">-</span>

        <input
          disabled={locked}
          type="number"
          min="0"
          value={localScore.away ?? ""}
          onChange={(e) => onScoreChange(match.id, "away", e.target.value)}
          className="w-20 rounded-2xl bg-[#12091f]/90 p-4 text-center text-xl font-black text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400 disabled:opacity-40"
        />

        <button
          onClick={() => onSavePrediction(match, localScore)}
          disabled={locked}
          className="rounded-2xl bg-violet-600 px-5 py-4 font-black disabled:opacity-40"
        >
          Valider
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
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scores, setScores] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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
    const lockTime = new Date(matchDate).getTime() - 90 * 60 * 1000;
    return Date.now() >= lockTime;
  };

  const isMatchFinished = (match) => {
    return match.home_score !== null && match.away_score !== null;
  };

  function sendLocalNotification(title, body) {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/logo.png",
      });
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  async function requestNotifications() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        alert("Notifications non supportées.");
        return;
      }

      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        alert("Clé VAPID publique manquante.");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setNotificationsEnabled(false);
        alert("Notifications refusées.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          ),
        });
      }

      const response = await fetch("/api/save-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          user_id: session?.user?.id || null,
          player_id: currentPlayerId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible d'enregistrer l'abonnement push.");
      }

      setNotificationsEnabled(true);

      sendLocalNotification(
        "Les Pronos de Papy 👴🏻",
        "Notifications activées."
      );

      alert("Notifications activées 👴🏻");
    } catch (error) {
      console.error(error);
      setNotificationsEnabled(false);
      alert("Erreur notifications.");
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
    const silent = options.silent || false;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
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
              "id, player_id, match_id, predicted_home, predicted_away, points, players:player_id(id, name, avatar_url)"
            ),
          supabase
            .from("teams")
            .select("id, name, group_name")
            .order("group_name", { ascending: true }),
        ]);

      setPlayers(playersResult.data || []);
      setMatches(matchesResult.data || []);
      setPredictions(predictionsResult.data || []);
      setTeams(teamsResult.data || []);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function refreshEverything(userId = session?.user?.id, options = {}) {
    if (!userId) return;

    await loadProfile(userId);
    await loadData(options);
  }

  useEffect(() => {
    async function initAuth() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);

      if (data.session?.user?.id) {
        await refreshEverything(data.session.user.id);
      }

      setAuthLoading(false);
    }

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession || null);

        if (nextSession?.user?.id) {
          await refreshEverything(nextSession.user.id);
        } else {
          setProfile(null);
          setCurrentPlayer(null);
          setPlayers([]);
          setMatches([]);
          setPredictions([]);
          setTeams([]);
          setNotificationsEnabled(false);
        }

        setAuthLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function checkNotifications() {
      try {
        if (typeof window === "undefined") return;

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
    if (!session?.user?.id) return;

    const channel = supabase
      .channel("prediction-refresh")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "predictions",
        },
        async () => {
          await loadData({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

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
        });

        const inviteResult = await inviteResponse.json().catch(() => null);

        if (!inviteResponse.ok || !inviteResult?.valid) {
          setAuthError(inviteResult?.error || "Code d’accès famille incorrect.");
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

    if (ph === rh && pa === ra) return 3;

    const predictedDiff = ph - pa;
    const realDiff = rh - ra;

    if (predictedDiff === realDiff) return 2;

    const predictedWinner =
      predictedDiff > 0 ? "home" : predictedDiff < 0 ? "away" : "draw";

    const realWinner = realDiff > 0 ? "home" : realDiff < 0 ? "away" : "draw";

    if (predictedWinner === realWinner) return 1;

    return 0;
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
        alert("Paris verrouillés 1h30 avant le coup d'envoi.");
        return;
      }

      const home = localScore?.home;
      const away = localScore?.away;

      if (home === "" || away === "" || home === undefined || away === undefined) {
        alert("Entre les scores.");
        return;
      }

      const existing = predictionByPlayerAndMatch.get(`${currentPlayerId}-${match.id}`);

      if (existing) {
        await supabase
          .from("predictions")
          .update({
            predicted_home: Number(home),
            predicted_away: Number(away),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("predictions").insert({
          player_id: currentPlayerId,
          match_id: match.id,
          predicted_home: Number(home),
          predicted_away: Number(away),
        });
      }

      const { data: refreshedPrediction, error } = await supabase
        .from("predictions")
        .select(
          "id, player_id, match_id, predicted_home, predicted_away, points, players:player_id(id, name, avatar_url)"
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

  async function saveOfficialScore(matchId) {
    if (!isAdmin) {
      alert("Accès admin requis.");
      return;
    }

    const match = matches.find((m) => m.id === matchId);
    const home = scores[matchId]?.officialHome;
    const away = scores[matchId]?.officialAway;

    const newHome = home === "" || home === undefined ? null : Number(home);
    const newAway = away === "" || away === undefined ? null : Number(away);

    await supabase
      .from("matches")
      .update({
        home_score: newHome,
        away_score: newAway,
      })
      .eq("id", matchId);

    const updatedMatch = {
      ...match,
      home_score: newHome,
      away_score: newAway,
    };

    const relatedPredictions = predictions.filter((p) => p.match_id === matchId);

    for (const prediction of relatedPredictions) {
      const points = calculatePredictionPoints(prediction, updatedMatch);

      await supabase.from("predictions").update({ points }).eq("id", prediction.id);
    }

    await loadData({ silent: true });
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
            <Image
              src="/logo.png"
              alt="Logo"
              width={112}
              height={112}
              priority
              className="mb-6 rounded-3xl object-contain ring-4 ring-emerald-300/30"
            />
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
              <Image
                src="/logo.png"
                alt="Logo"
                width={112}
                height={112}
                priority
                className="mx-auto mb-5 rounded-3xl object-contain ring-4 ring-emerald-300/30"
              />
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

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <Camera className="h-5 w-5 text-emerald-300" />
                    <span className="flex-1 text-sm text-slate-200">
                      {authAvatarFile ? authAvatarFile.name : "Ajouter une photo de profil"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setAuthAvatarFile(e.target.files?.[0] || null)}
                    />
                  </label>

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

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <Camera className="h-5 w-5 text-emerald-300" />
                <span className="flex-1 text-sm text-slate-200">
                  {profileAvatarFile ? profileAvatarFile.name : "Ajouter une photo de profil"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setProfileAvatarFile(e.target.files?.[0] || null)}
                />
              </label>

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
        <header className="relative overflow-hidden rounded-[2rem] border border-emerald-300/25 bg-[#22123a]/70 p-8 shadow-2xl shadow-emerald-950/30 backdrop-blur-md">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/stadium.jpg"
              alt="Stade"
              fill
              sizes="(max-width: 768px) 100vw, 1280px"
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-[#22123a]/75 to-violet-900/85" />
          </div>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-white to-violet-500" />

          <div className="flex flex-col items-center text-center">
            <Image
              src="/logo.png"
              alt="Logo Pronos Famille"
              width={144}
              height={144}
              priority
              className="mb-5 h-28 w-28 rounded-3xl object-contain shadow-2xl ring-4 ring-emerald-300/40 md:h-36 md:w-36"
            />

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
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white ring-1 ring-white/10"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
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
        </section>

        <nav className="rounded-[2rem] border border-white/15 bg-[#22123a]/80 p-3 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
            {[
              { key: "pronos", label: "Pronos" },
              { key: "classement", label: "Classement" },
              { key: "groupes", label: "Groupes" },
              { key: "tableau", label: "Tableau" },
              ...(isAdmin ? [{ key: "admin", label: "Admin" }] : []),
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`min-h-11 rounded-2xl px-2 py-3 text-center text-[12px] font-black leading-none transition sm:px-5 sm:text-base ${
                  tab === item.key
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40"
                    : "bg-white/5 text-slate-100 hover:bg-emerald-500/20"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {refreshing && !loading && (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-200 shadow-xl backdrop-blur-md">
            Mise à jour en cours...
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-[2rem] border border-emerald-300/20 bg-[#12091f]/75 p-10 text-center shadow-2xl backdrop-blur-md">
            <Image
              src="/logo.png"
              alt="Logo"
              width={96}
              height={96}
              className="mb-6 rounded-3xl object-contain ring-4 ring-emerald-300/30"
            />
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
                        Tu ne peux remplir que tes propres pronos. Les paris se verrouillent 1h30 avant le coup d’envoi.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {matches.map((match) => (
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
                  <h2 className="mb-5 text-2xl font-black">Résultats officiels</h2>

                  <div className="space-y-4">
                    {matches.map((match) => (
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

                        <div className="mt-3 flex items-center gap-3">
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
                            className="rounded-2xl bg-emerald-600 px-4 py-3 font-black"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    ))}
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
