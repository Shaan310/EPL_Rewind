import { useEffect, useState } from "react"
import Papa from "papaparse"
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  History,
  Trophy,
} from "lucide-react"

const ATTACKERS = [
  "Centre-Forward",
  "Striker",
  "Left Winger",
  "Right Winger",
  "Second Striker",
]

const MIDFIELDERS = [
  "Central Midfield",
  "Defensive Midfield",
  "Attacking Midfield",
  "Left Midfield",
  "Right Midfield",
  "Midfielder",
]

const DEFENDERS = [
  "Centre-Back",
  "Left-Back",
  "Right-Back",
  "Defender",
]

const GOALKEEPERS = [
  "Goalkeeper",
]

function App() {
  const [screen, setScreen] = useState<
    "home" | "setup" | "lineup" | "preview" | "result"
  >("home")

  const [teams, setTeams] = useState<string[]>([])
  
  const [homePlayers, setHomePlayers] = useState<any[]>([])
  const [awayPlayers, setAwayPlayers] = useState<any[]>([])
  const [matchResult, setMatchResult] = useState<any>(null)
  const [homeXI, setHomeXI] = useState<any[]>([])
  const [awayXI, setAwayXI] = useState<any[]>([])
  const [teamSeasons, setTeamSeasons] = useState<Record<string, string[]>>({})

  const [homeTeam, setHomeTeam] = useState("")
  const [homeSeason, setHomeSeason] = useState("")

  const [awayTeam, setAwayTeam] = useState("")
  const [awaySeason, setAwaySeason] = useState("")

  useEffect(() => {
    fetch("/data/team_season_features.csv")
      .then((response) => response.text())
      .then((csv) => {
        const result = Papa.parse<Record<string, string>>(csv, {
          header: true,
          skipEmptyLines: true,
        })

        const rows = result.data

        const uniqueTeams = [
          ...new Set(
            rows
              .map((row) => row.Team)
              .filter(Boolean)
          ),
        ].sort()

        const seasonMap: Record<string, string[]> = {}

        rows.forEach((row) => {
          const team = row.Team
          const season = row.Season

          if (!team || !season) return

          if (!seasonMap[team]) {
              seasonMap[team] = []
          }

          if (!seasonMap[team].includes(season)) {
              seasonMap[team].push(season)
          }
        })

        Object.keys(seasonMap).forEach((team) => {
          seasonMap[team].sort()
        })

        setTeams(uniqueTeams)
        setTeamSeasons(seasonMap)
      })
      .catch((error) => {
        console.error("Failed to load team data:", error)
      })
  }, [])

  useEffect(() => {
    fetch("/data/players.csv")
      .then((response) => response.text())
      .then((csv) => {
        const result = Papa.parse<Record<string, string>>(csv, {
          header: true,
          skipEmptyLines: true,
        })

        const rows = result.data

        const home = rows.filter(
          (player) =>
            player.Team === homeTeam &&
            player.Season === homeSeason
        )

        const away = rows.filter(
          (player) =>
            player.Team === awayTeam &&
            player.Season === awaySeason
        )

        setHomePlayers(home)
        setAwayPlayers(away)
      })
      .catch((error) => {
        console.error("Failed to load player data:", error)
      })
  }, [
    homeTeam,
    homeSeason,
    awayTeam,
    awaySeason,
  ])
  const getPlayersByPosition = (
    players: any[],
    positions: string[]
  ) => {
    return players.filter((player) =>
      positions.includes(player.Position)
    )
  }

  const isValidXI = (xi: any[]) => {
    if (xi.length !== 11) {
      return false
    }

    const goalkeepers = xi.filter((player) =>
      GOALKEEPERS.includes(player.Position)
    ).length

    const defenders = xi.filter((player) =>
      DEFENDERS.includes(player.Position)
    ).length

    const midfielders = xi.filter((player) =>
      MIDFIELDERS.includes(player.Position)
    ).length

    const attackers = xi.filter((player) =>
      ATTACKERS.includes(player.Position)
    ).length

    return (
      goalkeepers === 1 &&
      defenders >= 3 &&
      midfielders >= 2 &&
      attackers >= 1
    )
  }

  const getXIStatus = (xi: any[]) => {
    const goalkeepers = xi.filter((player) =>
      GOALKEEPERS.includes(player.Position)
    ).length

    const defenders = xi.filter((player) =>
      DEFENDERS.includes(player.Position)
    ).length

    const midfielders = xi.filter((player) =>
      MIDFIELDERS.includes(player.Position)
    ).length

    const attackers = xi.filter((player) =>
      ATTACKERS.includes(player.Position)
    ).length

    return {
      goalkeepers,
      defenders,
      midfielders,
      attackers,
      valid:
        xi.length === 11 &&
        goalkeepers === 1 &&
        defenders >= 3 &&
        midfielders >= 2 &&
        attackers >= 1,
    }
  }

  if (screen === "preview") {
    return (
      <main className="min-h-screen bg-[#061426] text-white">

        <nav className="flex h-20 items-center justify-between border-b border-white/10 px-8 lg:px-14">

          <button
            onClick={() => setScreen("lineup")}
            className="text-sm font-bold text-white/50 transition hover:text-white"
          >
            ← Edit Lineups
          </button>

          <div className="text-xl font-black tracking-tight">
            EPL <span className="text-[#00ff87]">REWIND</span>
          </div>

          <div className="text-xs font-bold uppercase tracking-widest text-white/30">
            Match Preview
          </div>

        </nav>

        <section className="mx-auto max-w-5xl px-8 py-20">

          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00ff87]">
              Match Preview
            </p>

            <h1 className="mt-4 text-5xl font-black">
              READY TO <span className="text-[#00ff87]">REWIND?</span>
            </h1>

          </div>

          <div className="mt-16 grid grid-cols-3 items-center gap-8">

            <div className="text-center">
              <p className="text-3xl font-black">
                {homeTeam}
              </p>

              <p className="mt-2 text-sm text-white/40">
                {homeSeason}
              </p>

              <p className="mt-6 text-xs font-bold uppercase tracking-widest text-white/30">
                {homeXI.length} Players Selected
              </p>
            </div>

            <div className="text-center text-5xl font-black text-white/20">
              VS
            </div>

            <div className="text-center">
              <p className="text-3xl font-black">
                {awayTeam}
              </p>

              <p className="mt-2 text-sm text-white/40">
                {awaySeason}
              </p>

              <p className="mt-6 text-xs font-bold uppercase tracking-widest text-white/30">
                {awayXI.length} Players Selected
              </p>
            </div>

          </div>

          <div className="mt-16 flex justify-center">

            <button
              onClick={async () => {
                try {
                  const response = await fetch(
                    "http://127.0.0.1:5000/api/simulate",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        home_team: homeTeam,
                        home_season: homeSeason,
                        away_team: awayTeam,
                        away_season: awaySeason,
                        home_xi: homeXI,
                        away_xi: awayXI,
                      }),
                    }
                  )

                  const data = await response.json()

                  console.log("MATCH RESULT:", data)

                  setMatchResult(data)
                  setScreen("result")
                } catch (error) {
                  console.error("Simulation failed:", error)
                }
              }}
              className="rounded-xl bg-[#00ff87] px-12 py-4 text-sm font-black uppercase tracking-widest text-[#061426] transition hover:scale-105"
            >
              Simulate Match
            </button>

          </div>

        </section>

      </main>
    )
  }


  if (screen === "result") {
    return (
      <main className="min-h-screen bg-[#061426] text-white">

        <nav className="flex h-20 items-center justify-between border-b border-white/10 px-8 lg:px-14">

          <button
            onClick={() => setScreen("preview")}
            className="text-sm font-bold text-white/50 transition hover:text-white"
          >
            ← Match Preview
          </button>

          <div className="text-xl font-black tracking-tight">
            EPL <span className="text-[#00ff87]">REWIND</span>
          </div>

          <div className="text-xs font-bold uppercase tracking-widest text-white/30">
            Full Time
          </div>

        </nav>

        <section className="mx-auto max-w-6xl px-8 py-16">

          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00ff87]">
              Full Time
            </p>

            <h1 className="mt-3 text-5xl font-black">
              MATCH RESULT
            </h1>

          </div>

          <div className="mt-14 grid grid-cols-3 items-center">

            <div className="text-center">

              <p className="text-3xl font-black">
                {homeTeam}
              </p>

              <p className="mt-2 text-sm text-white/40">
                {homeSeason}
              </p>

            </div>

            <div className="text-center">

              <div className="text-7xl font-black">
                <span>{matchResult?.home_goals ?? 0}</span>
                <span className="mx-4 text-white/20">-</span>
                <span>{matchResult?.away_goals ?? 0}</span>
              </div>

            </div>

            <div className="text-center">

              <p className="text-3xl font-black">
                {awayTeam}
              </p>

              <p className="mt-2 text-sm text-white/40">
                {awaySeason}
              </p>

            </div>

          </div>

          <div className="mx-auto mt-14 max-w-4xl border-t border-white/10 pt-10">

            <div className="grid grid-cols-2 gap-10">

              <div>

                <h2 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-white/40">
                  {homeTeam}
                </h2>

                <div className="space-y-3">

                  {Object.entries(matchResult?.home_scorers || {}).map(
                    ([player, goals]) =>
                      Array.from({ length: goals as number }).map((_, index) => (
                        <div
                          key={`${player}-${index}`}
                          className="flex justify-between rounded-xl bg-[#0a1b31] p-4"
                        >
                          <span>{player}</span>

                          <span className="text-white/40">
                            {matchResult?.home_minutes?.[
                              Object.keys(matchResult.home_scorers)
                                .slice(0, Object.keys(matchResult.home_scorers).indexOf(player))
                                .reduce(
                                  (total, key) =>
                                    total +
                                    (matchResult.home_scorers[key] as number),
                                  0
                                ) + index
                            ]}'
                          </span>
                        </div>
                      ))
                  )}

                </div>

              </div>

              <div>

                <h2 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-white/40">
                  {awayTeam}
                </h2>

                <div className="space-y-3">

                  {Object.entries(matchResult?.away_scorers || {}).map(
                    ([player, goals]) =>
                      Array.from({ length: goals as number }).map((_, index) => (
                        <div
                          key={`${player}-${index}`}
                          className="flex justify-between rounded-xl bg-[#0a1b31] p-4"
                        >
                          <span>{player}</span>

                          <span className="text-white/40">
                            {matchResult?.away_minutes?.[
                              Object.keys(matchResult.away_scorers)
                                .slice(0, Object.keys(matchResult.away_scorers).indexOf(player))
                                .reduce(
                                  (total, key) =>
                                    total +
                                    (matchResult.away_scorers[key] as number),
                                  0
                                ) + index
                            ]}'
                          </span>
                        </div>
                      ))
                  )}

                </div>

              </div>

            </div>

          </div>

          <div className="mt-10 grid grid-cols-2 gap-6">

            <div className="rounded-2xl border border-white/10 bg-[#0a1b31] p-7">

              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                Expected Goals
              </p>

              <div className="mt-5 flex justify-between text-2xl font-black">
                <span>{matchResult?.home_xg?.toFixed(2) ?? "0.00"}</span>
                <span className="text-white/20">-</span>
                <span>{matchResult?.away_xg?.toFixed(2) ?? "0.00"}</span>
              </div>

            </div>

            <div className="rounded-2xl border border-[#00ff87]/20 bg-[#0a1b31] p-7">

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00ff87]">
                Man of the Match
              </p>

              <p className="mt-5 text-2xl font-black">
                <span>{matchResult?.man_of_match || "—"}</span>
              </p>

            </div>

          </div>

          <div className="mt-10 flex justify-center">

            <button
              onClick={() => setScreen("setup")}
              className="rounded-xl bg-[#00ff87] px-10 py-4 text-sm font-black uppercase tracking-widest text-[#061426] transition hover:scale-105"
            >
              Play Again
            </button>

          </div>

        </section>

      </main>
    )
  }

  if (screen === "lineup") {
    return (
      <main className="min-h-screen bg-[#061426] text-white">

        <nav className="flex h-20 items-center justify-between border-b border-white/10 px-8 lg:px-14">

          <button
            onClick={() => setScreen("setup")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00ff87] font-black text-[#061426]">
              ER
            </div>

            <span className="text-xl font-black tracking-tight">
              EPL REWIND
            </span>
          </button>

          <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40">
            Starting XI
          </div>

        </nav>

        <section className="mx-auto max-w-6xl px-8 py-16">

          <div className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-10 bg-[#00ff87]" />

              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#00ff87]">
                Match Setup
              </span>
            </div>

            <h1 className="text-5xl font-black tracking-[-0.04em]">
              BUILD YOUR
              <span className="text-[#00ff87]"> XI.</span>
            </h1>

            <p className="mt-4 text-white/45">
              Select your starting eleven for each team.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            <div className="rounded-3xl border border-white/10 bg-[#0a1b31] p-7">

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#00ff87]">
                Home
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {homeTeam}
              </h2>

              <p className="mt-1 text-sm text-white/40">
                {homeSeason}
              </p>

              <div className="mt-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/35">
                  Select Players
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <div className="space-y-8">

                    {[
                      ["GOALKEEPERS", GOALKEEPERS],
                      ["DEFENDERS", DEFENDERS],
                      ["MIDFIELDERS", MIDFIELDERS],
                      ["ATTACKERS", ATTACKERS],
                    ].map(([label, positions]) => {

                      const positionPlayers = getPlayersByPosition(
                        homePlayers,
                        positions as string[]
                      )

                      if (positionPlayers.length === 0) {
                        return null
                      }

                      return (
                        <div key={label as string}>

                          <h3 className="mb-3 text-xs font-black tracking-[0.2em] text-white/40">
                            {label as string}
                          </h3>

                          <div className="grid grid-cols-2 gap-3">

                            {positionPlayers.map((player, index) => {

                              const selected = homeXI.some(
                                (p) => p.Player === player.Player
                              )

                              return (
                                <button
                                  key={`${player.Player}-${index}`}
                                  onClick={() => {

                                    if (selected) {
                                      setHomeXI(
                                        homeXI.filter(
                                          (p) => p.Player !== player.Player
                                        )
                                      )
                                      return
                                    }

                                    if (homeXI.length >= 11) {
                                      return
                                    }

                                    if (
                                      GOALKEEPERS.includes(player.Position) &&
                                      homeXI.some((p) =>
                                        GOALKEEPERS.includes(p.Position)
                                      )
                                    ) {
                                      return
                                    }

                                    setHomeXI([
                                      ...homeXI,
                                      player,
                                    ])
                                  }}
                                  className={`rounded-xl border p-4 text-left transition ${
                                    selected
                                      ? "border-[#00ff87] bg-[#00ff87]/10"
                                      : "border-white/10 bg-[#061426] hover:border-white/30"
                                  }`}
                                >

                                  <p className="font-bold">
                                    {player.Player}
                                  </p>

                                  <p className="mt-1 text-xs text-white/35">
                                    {player.Position}
                                  </p>

                                </button>
                              )
                            })}

                          </div>

                        </div>
                      )
                    })}

                  </div>
                  
                  {(() => {
                    const status = getXIStatus(homeXI)

                    return (
                      <div className="mt-6 rounded-xl border border-white/10 bg-[#061426] p-4">

                        <div className="flex items-center justify-between">

                          <span className="text-sm text-white/50">
                            {homeXI.length} / 11 selected
                          </span>

                          <span
                            className={
                              status.valid
                                ? "text-sm font-bold text-[#00ff87]"
                                : "text-sm font-bold text-white/40"
                            }
                          >
                            {status.valid ? "XI READY" : "XI INCOMPLETE"}
                          </span>

                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">

                          <span className={status.goalkeepers === 1 ? "text-[#00ff87]" : "text-red-400"}>
                            {status.goalkeepers === 1 ? "✓" : "✕"} 1 Goalkeeper
                          </span>

                          <span className={status.defenders >= 3 ? "text-[#00ff87]" : "text-red-400"}>
                            {status.defenders >= 3 ? "✓" : "✕"} 3+ Defenders
                          </span>

                          <span className={status.midfielders >= 2 ? "text-[#00ff87]" : "text-red-400"}>
                            {status.midfielders >= 2 ? "✓" : "✕"} 2+ Midfielders
                          </span>

                          <span className={status.attackers >= 1 ? "text-[#00ff87]" : "text-red-400"}>
                            {status.attackers >= 1 ? "✓" : "✕"} 1+ Attacker
                          </span>

                        </div>

                      </div>
                    )
                  })()}

                </div>
                
                <div className="mt-6 flex items-center justify-between">

                  <span className="text-sm text-white/40">
                    {homeXI.length} / 11 selected
                  </span>

                  <span
                    className={
                      isValidXI(homeXI)
                        ? "text-sm font-bold text-[#00ff87]"
                        : "text-sm font-bold text-white/30"
                    }
                  >
                    {isValidXI(homeXI)
                      ? "XI READY"
                      : "XI INCOMPLETE"}
                  </span>

                </div>

              </div>

            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0a1b31] p-7">

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#00ff87]">
                Away
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {awayTeam}
              </h2>

              <p className="mt-1 text-sm text-white/40">
                {awaySeason}
              </p>

              <div className="mt-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/35">
                  Select Players
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <div className="space-y-8">

                    {[
                      ["GOALKEEPERS", GOALKEEPERS],
                      ["DEFENDERS", DEFENDERS],
                      ["MIDFIELDERS", MIDFIELDERS],
                      ["ATTACKERS", ATTACKERS],
                    ].map(([label, positions]) => {

                      const positionPlayers = getPlayersByPosition(
                        awayPlayers,
                        positions as string[]
                      )

                      if (positionPlayers.length === 0) {
                        return null
                      }

                      return (
                        <div key={label as string}>

                          <h3 className="mb-3 text-xs font-black tracking-[0.2em] text-white/40">
                            {label as string}
                          </h3>

                          <div className="grid grid-cols-2 gap-3">

                            {positionPlayers.map((player, index) => {

                              const selected = awayXI.some(
                                (p) => p.Player === player.Player
                              )

                              return (
                                <button
                                  key={`${player.Player}-${index}`}
                                  onClick={() => {

                                    if (selected) {
                                      setAwayXI(
                                        awayXI.filter(
                                          (p) => p.Player !== player.Player
                                        )
                                      )
                                      return
                                    }

                                    if (awayXI.length >= 11) {
                                      return
                                    }

                                    if (
                                      GOALKEEPERS.includes(player.Position) &&
                                      awayXI.some((p) =>
                                        GOALKEEPERS.includes(p.Position)
                                      )
                                    ) {
                                      return
                                    }

                                    setAwayXI([
                                      ...awayXI,
                                      player,
                                    ])
                                  }}
                                  className={`rounded-xl border p-4 text-left transition ${
                                    selected
                                      ? "border-[#00ff87] bg-[#00ff87]/10"
                                      : "border-white/10 bg-[#061426] hover:border-white/30"
                                  }`}
                                >

                                  <p className="font-bold">
                                    {player.Player}
                                  </p>

                                  <p className="mt-1 text-xs text-white/35">
                                    {player.Position}
                                  </p>

                                </button>
                              )
                            })}

                          </div>

                        </div>
                      )
                    })}

                  </div>

                  {(() => {
                    const status = getXIStatus(awayXI)

                    return (
                      <div className="mt-6 rounded-xl border border-white/10 bg-[#061426] p-4">

                        <div className="flex items-center justify-between">

                          <span className="text-sm text-white/50">
                            {awayXI.length} / 11 selected
                          </span>

                          <span
                            className={
                              status.valid
                                ? "text-sm font-bold text-[#00ff87]"
                                : "text-sm font-bold text-white/40"
                            }
                          >
                            {status.valid ? "XI READY" : "XI INCOMPLETE"}
                          </span>

                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">

                          <span className={status.goalkeepers === 1 ? "text-[#00ff87]" : "text-red-400"}>
                            {status.goalkeepers === 1 ? "✓" : "✕"} 1 Goalkeeper
                          </span>

                          <span className={status.defenders >= 3 ? "text-[#00ff87]" : "text-red-400"}>
                            {status.defenders >= 3 ? "✓" : "✕"} 3+ Defenders
                          </span>

                          <span className={status.midfielders >= 2 ? "text-[#00ff87]" : "text-red-400"}>
                            {status.midfielders >= 2 ? "✓" : "✕"} 2+ Midfielders
                          </span>

                          <span className={status.attackers >= 1 ? "text-[#00ff87]" : "text-red-400"}>
                            {status.attackers >= 1 ? "✓" : "✕"} 1+ Attacker
                          </span>

                        </div>

                      </div>
                    )
                  })()}

                </div>

                <div className="mt-8">

                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/35">
                    Select Players
                  </p>

                  <div className="space-y-8">
                    {/* all your goalkeeper/defender/midfielder/attacker player cards */}
                  </div>

                  {/* PUT IT HERE */}
                  <div className="mt-6 flex items-center justify-between">

                    <span className="text-sm text-white/40">
                      {awayXI.length} / 11 selected
                    </span>

                    <span
                      className={
                        isValidXI(awayXI)
                          ? "text-sm font-bold text-[#00ff87]"
                          : "text-sm font-bold text-white/30"
                      }
                    >
                      {isValidXI(awayXI)
                        ? "XI READY"
                        : "XI INCOMPLETE"}
                    </span>

                  </div>

                </div>  
                  
                <div className="mt-5 text-right text-sm font-bold">
                  <span className="text-[#00ff87]">
                    {awayXI.length}
                  </span>
                  <span className="text-white/30">
                    {" "} / 11 selected
                  </span>
                </div>

              </div>

            </div>

          </div>
        
        <div className="mt-10 flex justify-center">

            <button
              disabled={
                !isValidXI(homeXI) ||
                !isValidXI(awayXI)
              }
              onClick={() => {
                if (
                  isValidXI(homeXI) &&
                  isValidXI(awayXI)
                ) {
                  setScreen("preview")
                }
              }}
              className={`rounded-xl px-10 py-4 text-sm font-black uppercase tracking-wider transition ${
                isValidXI(homeXI) &&
                isValidXI(awayXI)
                  ? "bg-[#00ff87] text-[#061426] hover:scale-105"
                  : "cursor-not-allowed bg-white/10 text-white/30"
              }`}
            >
              Continue
            </button>

          </div>
        </section>

      </main>
    )
  }


  if (screen === "setup") {
    return (
      <main className="min-h-screen bg-[#061426] text-white">

        {/* Navigation */}
        <nav className="flex h-20 items-center justify-between border-b border-white/10 px-8 lg:px-14">

          <button
            onClick={() => setScreen("home")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00ff87] font-black text-[#061426]">
              ER
            </div>

            <span className="text-xl font-black tracking-tight">
              EPL REWIND
            </span>
          </button>

          <div className="hidden items-center gap-8 text-sm font-semibold text-white/40 md:flex">
            <span className="text-white">
              MATCH SIMULATOR
            </span>

            <span>
              HISTORY
            </span>

            <span>
              ABOUT
            </span>
          </div>

          <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40">
            Match Setup
          </div>

        </nav>

        {/* Setup */}
        <section className="relative min-h-[calc(100vh-80px)] overflow-hidden px-8 py-16 lg:px-14">

          {/* Pitch background */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]">
            <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
          </div>

          <div className="relative mx-auto max-w-6xl">

            {/* Heading */}
            <div className="mb-12">

              <button
                onClick={() => setScreen("home")}
                className="mb-8 flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-white"
              >
                <ArrowLeft size={17} />
                Back
              </button>

              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-10 bg-[#00ff87]" />

                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#00ff87]">
                  Match Simulator
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.04em] sm:text-6xl">
                CHOOSE YOUR
                <span className="text-[#00ff87]"> MATCH.</span>
              </h1>

              <p className="mt-4 max-w-xl text-white/45">
                Pick two Premier League teams and the seasons you want
                to bring head-to-head.
              </p>

            </div>

            {/* Team selection */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* HOME */}
              <div className="rounded-3xl border border-white/10 bg-[#0a1b31]/80 p-7 backdrop-blur">

                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#00ff87]">
                      Home
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      HOME TEAM
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-white/30">
                    H
                  </div>
                </div>

                {/* Team */}
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/35">
                  Team
                </label>

                <div className="relative mb-6">

                  <select
                    value={homeTeam}
                    onChange={(e) => {
                      setHomeTeam(e.target.value)
                      setHomeSeason("")
                    }}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#061426] px-5 py-4 text-white outline-none transition focus:border-[#00ff87]/50"
                  >
                    <option value="" disabled>
                      Select home team
                    </option>

                    {teams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-white/30"
                  />

                </div>

                {/* Season */}
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/35">
                  Season
                </label>

                <div className="relative">
                  <select
                    value={homeSeason}
                    onChange={(e) => setHomeSeason(e.target.value)}
                    disabled={!homeTeam}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#061426] px-5 py-4 text-white outline-none transition focus:border-[#00ff87]/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <option value="" disabled>
                      Select season
                    </option>

                    {(teamSeasons[homeTeam] || []).map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-white/30"
                  />

                </div>
              </div>

              {/* AWAY */}
              <div className="rounded-3xl border border-white/10 bg-[#0a1b31]/80 p-7 backdrop-blur">

                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#00ff87]">
                      Away
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      AWAY TEAM
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-white/30">
                    A
                  </div>
                </div>

                {/* Team */}
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/35">
                  Team
                </label>

                <div className="relative mb-6">
                  <select
                    value={awayTeam}
                    onChange={(e) => {
                      setAwayTeam(e.target.value)
                      setAwaySeason("")
                    }}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#061426] px-5 py-4 text-white outline-none transition focus:border-[#00ff87]/50"
                  >
                    <option value="" disabled>
                      Select away team
                    </option>

                    {teams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-white/30"
                  />

                </div>
                {/* Season */}
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/35">
                  Season
                </label>

                <div className="relative">

                  <select
                    value={awaySeason}
                    onChange={(e) => setAwaySeason(e.target.value)}
                    disabled={!awayTeam}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#061426] px-5 py-4 text-white outline-none transition focus:border-[#00ff87]/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <option value="" disabled>
                      Select season
                    </option>

                    {(teamSeasons[awayTeam] || []).map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-white/30"
                  />

                </div>

              </div>

            </div>

            {/* Continue */}
            <div className="mt-8 flex justify-end">

              <button
                disabled={
                  !homeTeam ||
                  !homeSeason ||
                  !awayTeam ||
                  !awaySeason
                }
                onClick={() => {
                  if (
                    homeTeam &&
                    homeSeason &&
                    awayTeam &&
                    awaySeason
                  ) {
                    setScreen("lineup")
                  }
                }}
                className="group flex items-center gap-4 rounded-xl bg-[#00ff87] px-7 py-4 font-black text-[#061426] transition hover:scale-[1.02] hover:bg-[#39ffa8] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
              >

                CONTINUE

                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />

              </button>

            </div>

            {/* Bottom info */}
            <div className="mt-16 flex gap-8 text-sm text-white/35">

              <div className="flex items-center gap-2">
                <History size={17} />
                Historical seasons
              </div>

              <div className="flex items-center gap-2">
                <Trophy size={17} />
                Custom starting XI
              </div>

            </div>

          </div>

        </section>

      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#061426] text-white">

      <nav className="flex h-20 items-center justify-between border-b border-white/10 px-8 lg:px-14">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00ff87] font-black text-[#061426]">
            ER
          </div>

          <span className="text-xl font-black tracking-tight">
            EPL REWIND
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-semibold text-white/60 md:flex">
          <span className="text-white">
            MATCH SIMULATOR
          </span>

          <span>
            HISTORY
          </span>

          <span>
            ABOUT
          </span>
        </div>

        <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/50">
          Historical Football
        </div>

      </nav>

      <section className="relative flex min-h-[calc(100vh-80px)] items-center px-8 lg:px-14">

        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]">
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        </div>

        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-[#00ff87]/10 blur-[120px]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-2">

          <div>

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-10 bg-[#00ff87]" />

              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#00ff87]">
                Premier League Time Machine
              </span>
            </div>

            <h1 className="max-w-3xl text-6xl font-black leading-[0.9] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              REWRITE
              <br />
              <span className="text-[#00ff87]">HISTORY.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-white/55">
              Put legendary Premier League teams from different eras
              head-to-head and see what happens when history gets
              rewritten.
            </p>

            <button
              onClick={() => setScreen("setup")}
              className="group mt-10 flex items-center gap-4 rounded-xl bg-[#00ff87] px-7 py-4 font-black text-[#061426] transition hover:scale-[1.02] hover:bg-[#39ffa8]"
            >
              START MATCH

              <ArrowRight
                size={20}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            <div className="mt-10 flex gap-8 text-sm text-white/40">

              <div className="flex items-center gap-2">
                <History size={17} />
                Historical teams
              </div>

              <div className="flex items-center gap-2">
                <Trophy size={17} />
                Custom XI
              </div>

            </div>

          </div>

          <div className="relative">

            <div className="absolute -inset-5 rounded-3xl bg-[#00ff87]/5 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a1b31]/90 p-6 shadow-2xl backdrop-blur">

              <div className="mb-8 flex items-center justify-between">

                <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
                  Historical Match
                </span>

                <span className="rounded-full bg-[#00ff87]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00ff87]">
                  Simulation
                </span>

              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5">

                <div className="text-center">

                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-600 text-2xl font-black">
                    M
                  </div>

                  <h2 className="font-black">
                    MAN UNITED
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    2007/08
                  </p>

                </div>

                <div className="text-center">
                  <span className="text-xs font-black tracking-widest text-white/30">
                    VS
                  </span>
                </div>

                <div className="text-center">

                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black">
                    C
                  </div>

                  <h2 className="font-black">
                    CHELSEA
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    2007/08
                  </p>

                </div>

              </div>

              <div className="my-8 h-px bg-white/10" />

              <div className="grid grid-cols-3 gap-3">

                <div className="rounded-xl bg-white/[0.04] p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/30">
                    xG
                  </p>

                  <p className="mt-2 text-xl font-black">
                    2.60
                  </p>
                </div>

                <div className="rounded-xl bg-white/[0.04] p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/30">
                    MODE
                  </p>

                  <p className="mt-2 text-xl font-black">
                    HISTORIC
                  </p>
                </div>

                <div className="rounded-xl bg-white/[0.04] p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/30">
                    XI
                  </p>

                  <p className="mt-2 text-xl font-black">
                    CUSTOM
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default App