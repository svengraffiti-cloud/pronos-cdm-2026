"use client";

import { useEffect, useMemo, useState } from "react";
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
        <img
          src="/stadium.jpg"
          alt="Stade"
          className="h-full w-full object-cover opacity-70"
        />
      </div>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#22c55e88,transparent_34%),radial-gradient(circle_at_bottom_right,#7c3aed88,transparent_36%),linear-gradient(135deg,#020617cc,#1e0b38d9_45%,#064e3bcc)]" />
      <div className="fixed inset-0 -z-10 bg-black/25 backdrop-blur-[1px]" />

      {children}
    </main>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
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

  // 🔒 verrouillage 1h30 avant match
  const isMatchLocked = (matchDate) => {
    const lockTime =
      new Date(matchDate).getTime() - 90 * 60 * 1000;

    return Date.now() >= lockTime;
  };

  const isMatchFinished = (match) => {
    return (
      match.home_score !== null &&
      match.away_score !== null
    );
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
    const padding = "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);

    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  async function requestNotifications() {
    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        alert("Notifications non supportées.");
        return;
      }

      const permission =
        await Notification.requestPermission();

      if (permission !== "granted") {
        alert("Notifications refusées.");
        return;
      }

      const registration =
        await navigator.serviceWorker.register("/sw.js");

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
              ),
          });
      }

      await fetch("/api/save-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      setNotificationsEnabled(true);

      sendLocalNotification(
        "Les Pronos de Papy 👴🏻",
        "Notifications activées."
      );

      alert("Notifications activées 👴🏻");
    } catch (error) {
      console.error(error);
      alert("Erreur notifications.");
    }
  }

  async function uploadAvatar(file, userId) {
    if (!file) return null;

    const extension =
      file.name.split(".").pop() || "jpg";

    const path = `${userId}/${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

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

  async function loadData() {
    setLoading(true);

    try {
      const [playersResult, matchesResult, predictionsResult, teamsResult] =
        await Promise.all([
          supabase
            .from("players")
            .select("*")
            .order("created_at", { ascending: true }),
          supabase
            .from("matches")
            .select("*")
            .order("match_date", { ascending: true }),
          supabase
            .from("predictions")
            .select("*, players:player_id(id, name, avatar_url)"),
          supabase
            .from("teams")
            .select("*")
            .order("group_name", { ascending: true }),
        ]);

      setPlayers(playersResult.data || []);
      setMatches(matchesResult.data || []);
      setPredictions(predictionsResult.data || []);
      setTeams(teamsResult.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function refreshEverything(userId = session?.user?.id) {
    if (!userId) return;

    await Promise.all([loadProfile(userId), loadData()]);
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
      if (typeof window === "undefined") return;

      if (!("Notification" in window)) {
        setNotificationsEnabled(false);
        return;
      }

      if (Notification.permission !== "granted") {
        setNotificationsEnabled(false);
        return;
      }

      if (!("serviceWorker" in navigator)) {
        setNotificationsEnabled(false);
        return;
      }

      const registration =
        await navigator.serviceWorker.getRegistration("/sw.js");

      const subscription =
        await registration?.pushManager.getSubscription();

      setNotificationsEnabled(Boolean(subscription));
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
          await loadData();
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

          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
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
          name:
            profileName.trim() ||
            session.user.email?.split("@")[0] ||
            "Joueur",
          avatar_url: avatarUrl,
        })
        .select("*")
        .single();

      if (playerError) throw playerError;

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
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
    await supabase.auth.signOut();
  }

  function formatDate(date) {
    return new Date(date).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getPrediction(matchId) {
    return predictions.find(
      (p) => p.player_id === currentPlayerId && p.match_id === matchId
    );
  }

  function getMatchPredictionRows(matchId) {
    return [...players]
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .map((player) => {
        const prediction = predictions.find(
          (item) => item.match_id === matchId && item.player_id === player.id
        );

        return {
          player,
          prediction,
        };
      });
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

    const realWinner =
      realDiff > 0 ? "home" : realDiff < 0 ? "away" : "draw";

    if (predictedWinner === realWinner) return 1;

    return 0;
  }

  async function savePrediction(match) {
    if (!currentPlayerId) {
      alert("Profil joueur introuvable.");
      return;
    }

    if (isMatchLocked(match.match_date)) {
      alert("Paris verrouillés 1h30 avant le coup d'envoi.");
      return;
    }

    const home = scores[match.id]?.home;
    const away = scores[match.id]?.away;

    if (
      home === "" ||
      away === "" ||
      home === undefined ||
      away === undefined
    ) {
      alert("Entre les scores.");
      return;
    }

    const existing = getPrediction(match.id);

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

    await loadData();
  }

  async function saveOfficialScore(matchId) {
    if (!isAdmin) {
      alert("Accès admin requis.");
      return;
    }

    const match = matches.find((m) => m.id === matchId);
    const home = scores[matchId]?.officialHome;
    const away = scores[matchId]?.officialAway;

    const newHome =
      home === "" || home === undefined ? null : Number(home);

    const newAway =
      away === "" || away === undefined ? null : Number(away);

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

    const relatedPredictions = predictions.filter(
      (p) => p.match_id === matchId
    );

    for (const prediction of relatedPredictions) {
      const points = calculatePredictionPoints(prediction, updatedMatch);

      await supabase
        .from("predictions")
        .update({ points })
        .eq("id", prediction.id);
    }

    await loadData();
  }

  async function addPlayer() {
    if (!isAdmin) return;
    if (!newPlayer.trim()) return;

    await supabase.from("players").insert({
      name: newPlayer.trim(),
    });

    setNewPlayer("");
    await loadData();
  }

  function playerTotal(playerId) {
    return predictions
      .filter((p) => p.player_id === playerId)
      .reduce((total, p) => total + (p.points || 0), 0);
  }

  function getGroupStandings(groupName) {
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
      const home = groupTeams.find(
        (team) => team.name === match.home_team
      );

      const away = groupTeams.find(
        (team) => team.name === match.away_team
      );

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

    return groupTeams.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name)
    );
  }

  function getQualifiedTeams() {
    const qualified = [];

    groupNames.forEach((groupName) => {
      const standings = getGroupStandings(groupName);

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
            <img
              src="/logo.png"
              alt="Logo"
              className="mb-6 h-28 w-28 rounded-3xl object-contain ring-4 ring-emerald-300/30"
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
              <img
                src="/logo.png"
                alt="Logo"
                className="mx-auto mb-5 h-28 w-28 rounded-3xl object-contain ring-4 ring-emerald-300/30"
              />

              <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-300">
                Coupe du Monde 2026
              </p>

              <h1 className="mt-3 text-4xl font-black">
                Pronos Famille
              </h1>

              <p className="mt-2 text-slate-300">
                Connecte-toi pour accéder uniquement à ta feuille de pronostic.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-white/5 p-2">
              <button
                onClick={() => setAuthMode("login")}
                className={`rounded-xl py-3 font-black ${
                  authMode === "login"
                    ? "bg-violet-600"
                    : "text-slate-300"
                }`}
              >
                Connexion
              </button>

              <button
                onClick={() => setAuthMode("signup")}
                className={`rounded-xl py-3 font-black ${
                  authMode === "signup"
                    ? "bg-violet-600"
                    : "text-slate-300"
                }`}
              >
                Créer un compte
              </button>
            </div>

            <form
              onSubmit={handleAuthSubmit}
              className="mt-6 space-y-4"
            >
              {authMode === "signup" && (
                <>
                  <input
                    value={authName}
                    onChange={(e) =>
                      setAuthName(e.target.value)
                    }
                    placeholder="Ton prénom / pseudo"
                    className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
                  />

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <Camera className="h-5 w-5 text-emerald-300" />

                    <span className="flex-1 text-sm text-slate-200">
                      {authAvatarFile
                        ? authAvatarFile.name
                        : "Ajouter une photo de profil"}
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setAuthAvatarFile(
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </label>
                </>
              )}

              <input
                value={authEmail}
                onChange={(e) =>
                  setAuthEmail(e.target.value)
                }
                type="email"
                placeholder="Email"
                required
                className="w-full rounded-2xl bg-[#0b0513]/90 p-4 text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
              />

              <input
                value={authPassword}
                onChange={(e) =>
                  setAuthPassword(e.target.value)
                }
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
