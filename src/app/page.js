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

  const isMatchLocked = (matchDate) => {
    const lockTime = new Date(matchDate).getTime() - 90 * 60 * 1000;
    return Date.now() >= lockTime;
  };

  const isMatchFinished = (match) => {
    return match.home_score !== null && match.away_score !== null;
  };

  async function subscribeToPush() {
    if (!("serviceWorker" in navigator)) {
      alert("Service Worker non supporté");
      return;
    }

    if (!("PushManager" in window)) {
      alert("Notifications push non supportées");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Notifications refusées");
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      ),
    });

    const token = JSON.stringify(subscription);

    await supabase.from("push_tokens").upsert({
      user_id: session.user.id,
      player_id: currentPlayerId,
      token,
      platform: navigator.userAgent,
    });

    setNotificationsEnabled(true);

    alert("Notifications activées 👴🏻⚽");
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);

    return Uint8Array.from(
      [...rawData].map((char) => char.charCodeAt(0))
    );
  }
            <div className="mt-6 flex flex-wrap justify-center gap-3">

              <button
                onClick={subscribeToPush}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black text-white ring-1 ring-white/10"
              >
                <Bell className="h-5 w-5" />
                Activer les notifications 👴🏻
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

        <section className="grid gap-5 md:grid-cols-2">

          {matches.map((match) => {

            const locked = isMatchLocked(match.match_date);
            const finished = isMatchFinished(match);
            const prediction = getPrediction(match.id);
            const matchPredictions = getMatchPredictions(match.id);
            const localScore = scores[match.id] || {};

            return (
              <div
                key={match.id}
                className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-md ${
                  finished
                    ? "border-slate-700 bg-slate-950/70 opacity-90"
                    : "border-white/15 bg-[#12091f]/75"
                }`}
              >

                <h3 className="text-2xl font-black">
                  {match.home_team} - {match.away_team}
                </h3>

                <p className="mt-2 text-sm text-slate-300">
                  {formatDate(match.match_date)}
                </p>

                <p
                  className={`mt-2 font-black ${
                    locked ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {locked
                    ? "🔒 Paris verrouillés (1h30 avant le coup d'envoi)"
                    : "🟢 Paris ouverts jusqu'à 1h30 avant le match"}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">

                  <input
                    disabled={locked}
                    type="number"
                    min="0"
                    value={localScore.home ?? ""}
                    onChange={(e) =>
                      setScores({
                        ...scores,
                        [match.id]: {
                          ...scores[match.id],
                          home: e.target.value,
                        },
                      })
                    }
                    className="w-20 rounded-2xl bg-[#12091f]/90 p-4 text-center text-xl font-black text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400 disabled:opacity-40"
                  />

                  <span className="text-2xl font-black">-</span>

                  <input
                    disabled={locked}
                    type="number"
                    min="0"
                    value={localScore.away ?? ""}
                    onChange={(e) =>
                      setScores({
                        ...scores,
                        [match.id]: {
                          ...scores[match.id],
                          away: e.target.value,
                        },
                      })
                    }
                    className="w-20 rounded-2xl bg-[#12091f]/90 p-4 text-center text-xl font-black text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400 disabled:opacity-40"
                  />

                  <button
                    onClick={() => savePrediction(match)}
                    disabled={locked}
                    className="rounded-2xl bg-violet-600 px-5 py-4 font-black disabled:opacity-40"
                  >
                    Valider
                  </button>
                </div>

                {locked && (
                  <div className="mt-5 rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">

                    <h4 className="mb-3 font-black text-emerald-300">
                      Pronos des participants
                    </h4>

                    <div className="space-y-2">

                      {players.map((player) => {

                        const prediction = matchPredictions.find(
                          (p) => p.player_id === player.id
                        );

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
                                  alt={player.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <UserCircle className="h-8 w-8 text-slate-300" />
                              )}

                              <span className="font-bold">
                                {player.name}

                                {isMe && (
                                  <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                                    toi
                                  </span>
                                )}
                              </span>
                            </div>

                            <strong>
                              {prediction
                                ? `${prediction.predicted_home} - ${prediction.predicted_away}`
                                : "❌"}
                            </strong>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
