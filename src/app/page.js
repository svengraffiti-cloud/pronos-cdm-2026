"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Trophy,
  Users,
  CalendarDays,
  Settings,
  Loader2,
} from "lucide-react";


export default function Home() {
  const [tab, setTab] = useState("pronos");

  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [teams, setTeams] = useState([]);
const isMatchLocked = (matchDate) => {
  return new Date(matchDate).getTime() <= Date.now();
};
  const isMatchFinished = (match) => {
  return match.home_score !== null && match.away_score !== null;
};
  const [selectedPlayer, setSelectedPlayer] =
    useState("");

  const [newPlayer, setNewPlayer] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [scores, setScores] = useState({});

  async function loadData() {
    setLoading(true);

    const { data: playersData } =
      await supabase
        .from("players")
        .select("*")
        .order("created_at", {
          ascending: true,
        });

    const { data: matchesData } =
      await supabase
        .from("matches")
        .select("*")
        .order("match_date", {
          ascending: true,
        });

    const { data: predictionsData } =
      await supabase
        .from("predictions")
        .select("*");

    const { data: teamsData } =
      await supabase
        .from("teams")
        .select("*")
        .order("group_name", {
          ascending: true,
        });

    setPlayers(playersData || []);
    setMatches(matchesData || []);
    setPredictions(predictionsData || []);
    setTeams(teamsData || []);

    if (
      !selectedPlayer &&
      playersData?.length > 0
    ) {
      setSelectedPlayer(playersData[0].id);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function isLocked(matchDate) {
    return (
      Date.now() >=
      new Date(matchDate).getTime() -
        4 * 60 * 60 * 1000
    );
  }

  function formatDate(date) {
    return new Date(date).toLocaleString(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  function getPrediction(matchId) {
    return predictions.find(
      (p) =>
        p.player_id === selectedPlayer &&
        p.match_id === matchId
    );
  }

  function calculatePredictionPoints(
    prediction,
    match
  ) {
    if (
      match.home_score === null ||
      match.away_score === null ||
      match.home_score === undefined ||
      match.away_score === undefined
    ) {
      return 0;
    }

    const ph = Number(
      prediction.predicted_home
    );

    const pa = Number(
      prediction.predicted_away
    );

    const rh = Number(match.home_score);

    const ra = Number(match.away_score);

    if (ph === rh && pa === ra) {
      return 3;
    }

    const predictedDiff = ph - pa;

    const realDiff = rh - ra;

    if (predictedDiff === realDiff) {
      return 2;
    }

    const predictedWinner =
      predictedDiff > 0
        ? "home"
        : predictedDiff < 0
        ? "away"
        : "draw";

    const realWinner =
      realDiff > 0
        ? "home"
        : realDiff < 0
        ? "away"
        : "draw";

    if (predictedWinner === realWinner) {
      return 1;
    }

    return 0;
  }

  async function savePrediction(match) {
    if (!selectedPlayer) return;

    if (isLocked(match.match_date)) {
      alert("Paris verrouillés.");
      return;
    }

    const home =
      scores[match.id]?.home;

    const away =
      scores[match.id]?.away;

    if (
      home === "" ||
      away === "" ||
      home === undefined ||
      away === undefined
    ) {
      alert("Entre les scores.");
      return;
    }

    const existing =
      getPrediction(match.id);

    if (existing) {
      await supabase
        .from("predictions")
        .update({
          predicted_home:
            Number(home),
          predicted_away:
            Number(away),
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("predictions")
        .insert({
          player_id:
            selectedPlayer,
          match_id: match.id,
          predicted_home:
            Number(home),
          predicted_away:
            Number(away),
        });
    }

    await loadData();
  }

  async function saveOfficialScore(
    matchId
  ) {
    const match = matches.find(
      (m) => m.id === matchId
    );

    const home =
      scores[matchId]?.officialHome;

    const away =
      scores[matchId]?.officialAway;

    const newHome =
      home === "" ||
      home === undefined
        ? null
        : Number(home);

    const newAway =
      away === "" ||
      away === undefined
        ? null
        : Number(away);

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

    const relatedPredictions =
      predictions.filter(
        (p) =>
          p.match_id === matchId
      );

    for (const prediction of relatedPredictions) {
      const points =
        calculatePredictionPoints(
          prediction,
          updatedMatch
        );

      await supabase
        .from("predictions")
        .update({ points })
        .eq("id", prediction.id);
    }

    await loadData();
  }

  async function addPlayer() {
    if (!newPlayer.trim()) return;

    await supabase
      .from("players")
      .insert({
        name: newPlayer.trim(),
      });

    setNewPlayer("");

    await loadData();
  }  function playerTotal(playerId) {
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

    return groupTeams.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name)
    );
  }

  function getQualifiedTeams() {
    const groupNames = [...new Set(teams.map((team) => team.group_name))];

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

  useEffect(() => {
    const nextScores = {};

    predictions.forEach((prediction) => {
      if (prediction.player_id === selectedPlayer) {
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
  }, [selectedPlayer, predictions, matches]);

  const groupNames = [...new Set(teams.map((team) => team.group_name))];

  const knockoutMatches = matches
    .filter((match) => match.stage !== "GROUP")
    .sort(
      (a, b) =>
        new Date(a.match_date) - new Date(b.match_date) ||
        (a.knockout_order || 0) - (b.knockout_order || 0)
    );

  const roundLabels = {
    R32: "16es de finale",
    R16: "8es de finale",
    QF: "Quarts de finale",
    SF: "Demi-finales",
    FINAL: "Finale",
  };

  return (
<main
  className="min-h-screen text-white"
  style={{
    backgroundImage:
'linear-gradient(rgba(2,6,23,0.75), rgba(2,6,23,0.95)), url("/stadium.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  }}
>
    <div className="mx-auto max-w-7xl px-5 py-8">
        <header className="mb-8 rounded-3xl border border-white/10  p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-200">
                Coupe du Monde 2026
              </div>
             <div className="flex items-center gap-4">
  <img
    src="/logo.png"
    alt="Logo"
    className="h-16 w-16 rounded-2xl"
  />

  <h1 className="text-4xl font-black tracking-tight md:text-6xl">
    Pronos Famille
  </h1>
</div>
              <p className="mt-3 text-slate-300">
                Pronostics, scores, groupes et tableau final.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
                <Users className="mb-2 h-8 w-8 text-blue-600" />
                <p className="text-sm font-semibold text-slate-500">Joueurs</p>
                <p className="text-3xl font-black">{players.length}</p>
              </div>

              <div className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
                <CalendarDays className="mb-2 h-8 w-8 text-emerald-600" />
                <p className="text-sm font-semibold text-slate-500">Matchs</p>
                <p className="text-3xl font-black">{matches.length}</p>
              </div>
            </div>
          </div>
        </header>

        <nav className="mb-6 grid grid-cols-5 gap-3">
          {["pronos", "classement", "groupes", "tableau", "admin"].map((item) => (
            <button
              key={item}
              onClick={() => {
  if (item === "admin") {
    const password = prompt("Mot de passe admin");

    if (password !== "SVEN2026") {
      alert("Accès refusé");
      return;
    }
  }

  setTab(item);
}}
              className={`rounded-2xl px-4 py-3 font-bold capitalize ${
                tab === item ? "bg-[#7c3aed]" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="rounded-3xl  p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {tab === "pronos" && (
              <section className="space-y-6">
                <div className="rounded-3xl border border-white/10  p-6">
                  <h2 className="text-2xl font-bold">Choisir le joueur</h2>

                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="mt-4 w-full rounded-2xl bg-[#12091f]/70 p-4 text-white"
                  >
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {matches.map((match) => {
const locked = isMatchLocked(match.match_date);
                    const finished = isMatchFinished(match);
                    const prediction = getPrediction(match.id);
                    const localScore = scores[match.id] || {};
                    return (
                      <div
                        key={match.id}
className={`rounded-3xl border p-6 ${
  finished
    ? "border-slate-700 bg-slate-900/60 opacity-70"
    : "border-white/10"
}`}                      >
                        <div className="mb-3 inline-flex rounded-full bg-bluebg-[#8b5cf6]500/20 px-3 py-1 text-sm font-semibold text-blue-200">
                          {match.stage === "GROUP"
                            ? `Groupe ${match.group_name}`
                            : roundLabels[match.stage] || match.stage}
                        </div>
{finished && (
  <div className="mb-3 inline-flex rounded-full bg-slate-700 px-3 py-1 text-sm font-bold text-white">
    TERMINÉ
  </div>
)}
                        <h3 className="text-2xl font-black">
                          {match.home_team} - {match.away_team}
                        </h3>

                        <p className="mt-2 text-sm text-slate-300">
                          {formatDate(match.match_date)}
                        </p>

                        <p
                          className={`mt-2 font-bold ${
                            locked ? "text-red-400" : "text-emerald-400"
                          }`}
                        >
                          {locked ? "🔒 Paris verrouillés" : "🟢 Paris ouverts"}
                        </p>

                        {prediction && (
                          <div className="mt-3 rounded-2xl bg-emerald-500/20 p-3">
                            <p className="font-bold text-emerald-300">
                              Pronostic : {prediction.predicted_home} -{" "}
                              {prediction.predicted_away}
                            </p>
                            {finished && (
  <div className="mt-3 rounded-2xl bg-yellow-400/20 p-4 text-center">
    <p className="text-sm font-bold text-yellow-200">
      Points gagnés
    </p>

    <p className="text-4xl font-black text-yellow-300">
      +{prediction.points || 0}
    </p>
  </div>
)}
                          
                        
                        

                        <div className="mt-5 flex items-center gap-3">
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
                            className="w-20 rounded-2xl bg-[#12091f]/70 p-4 text-center text-xl font-black text-white"
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
                            className="w-20 rounded-2xl bg-[#12091f]/70 p-4 text-center text-xl font-black text-white"
                          />

                          <button
                            onClick={() => savePrediction(match)}
                            disabled={locked}
                            className="rounded-2xl bg-blue-600 px-5 py-4 font-bold disabled:opacity-40"
                          >
                            Valider
                          </button>
                        </div>
                      </div>
                   )}
                  
</section>
            )}            {tab === "classement" && (
              <section className="rounded-3xl border border-[#3b2458] bg-[#211433]/90 p-6">
                <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  Classement joueurs
                </h2>

                {[...players]
                  .sort((a, b) => playerTotal(b.id) - playerTotal(a.id))
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className="mb-3 flex items-center justify-between rounded-2xl bg-[#12091f]/60 p-4"
                    >
                      <span>
                        {index + 1}. {player.name}
                      </span>
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
                      className="rounded-3xl border border-white/10  p-6"
                    >
                      <h2 className="mb-4 text-2xl font-black">
                        Groupe {groupName}
                      </h2>

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
                              <tr
                                key={team.name}
                                className="border-t border-white/10"
                              >
                                <td className="p-2 font-bold">{index + 1}</td>
                                <td className="p-2 font-bold">
                                  {team.name}
                                  {index < 2 && (
                                    <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                                      qualifié
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  {team.played}
                                </td>
                                <td className="p-2 text-center">{team.wins}</td>
                                <td className="p-2 text-center">
                                  {team.draws}
                                </td>
                                <td className="p-2 text-center">
                                  {team.losses}
                                </td>
                                <td className="p-2 text-center">
                                  {team.goalsFor}
                                </td>
                                <td className="p-2 text-center">
                                  {team.goalsAgainst}
                                </td>
                                <td className="p-2 text-center">
                                  {team.goalDifference}
                                </td>
                                <td className="p-2 text-center font-black">
                                  {team.points}
                                </td>
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
                <div className="rounded-3xl border border-white/10  p-6">
                  <h2 className="text-2xl font-black">
                    Équipes qualifiées provisoires
                  </h2>

                  <p className="mt-2 text-sm text-slate-300">
                    Pour l’instant, les deux premiers de chaque groupe sont
                    listés automatiquement. On ajoutera ensuite les meilleurs
                    troisièmes et l’ordre officiel des 16es.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {getQualifiedTeams().map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl bg-[#12091f]/60 p-4"
                      >
                        <p className="text-sm text-blue-300">{item.label}</p>
                        <p className="text-xl font-black">{item.team}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10  p-6">
                  <h2 className="mb-5 text-2xl font-black">Tableau final</h2>

                  <div className="grid gap-5 md:grid-cols-2">
                    {knockoutMatches.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-2xl bg-[#12091f]/60 p-4"
                      >
                        <div className="mb-2 inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-sm font-semibold text-orange-300">
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

            {tab === "admin" && (
              <section className="space-y-6">
                <div className="rounded-3xl border border-white/10  p-6">
                  <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
                    <Settings className="h-6 w-6" />
                    Ajouter un joueur
                  </h2>

                  <div className="flex gap-3">
                    <input
                      value={newPlayer}
                      onChange={(e) => setNewPlayer(e.target.value)}
                      placeholder="Nom du joueur"
                      className="flex-1 rounded-2xl bg-[#12091f]/70 p-4 text-white"
                    />

                    <button
                      onClick={addPlayer}
                      className="rounded-2xl bg-blue-600 px-5 py-4 font-bold"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10  p-6">
                  <h2 className="mb-5 text-2xl font-bold">
                    Résultats officiels
                  </h2>

                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-2xl bg-[#12091f]/60 p-4"
                      >
                        <div className="mb-2 inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-200">
                          {match.stage === "GROUP"
                            ? `Groupe ${match.group_name}`
                            : roundLabels[match.stage] || match.stage}
                        </div>

                        <h3 className="font-bold">
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
                            className="w-20 rounded-2xl bg-slate-900 p-3 text-center"
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
                            className="w-20 rounded-2xl bg-slate-900 p-3 text-center"
                          />

                          <button
                            onClick={() => saveOfficialScore(match.id)}
                            className="rounded-2xl bg-emerald-600 px-4 py-3 font-bold"
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
    </main>
  );
}
