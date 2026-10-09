import { useEffect, useRef, useState } from "react"
import Papa from "papaparse"
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  History,
  Trophy,
  Search,
  X,
  Check,
  Shield,
  RotateCcw,
  AlertCircle,
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

interface RatedPlayer {
  id: string
  Season: string
  season_year: string
  Team: string
  teams: string[]
  Player: string
  Position: string
  position_group: "GK" | "DEF" | "MID" | "FWD"
  age: number
  Rating: number
  Price: number
}

type FormationKey = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "4-5-1"

const FORMATIONS: Record<
  FormationKey,
  {
    GK: number
    DEF: number
    MID: number
    FWD: number
    desc: string
    pitchRows: number[]
  }
> = {
  "4-3-3": {
    GK: 1,
    DEF: 4,
    MID: 3,
    FWD: 3,
    desc: "Attacking 4-3-3 with wide forwards",
    pitchRows: [3, 3, 4, 1],
  },
  "4-4-2": {
    GK: 1,
    DEF: 4,
    MID: 4,
    FWD: 2,
    desc: "Classic English 4-4-2 balance",
    pitchRows: [2, 4, 4, 1],
  },
  "4-2-3-1": {
    GK: 1,
    DEF: 4,
    MID: 5,
    FWD: 1,
    desc: "Modern 4-2-3-1 midfield control",
    pitchRows: [1, 5, 4, 1],
  },
  "3-5-2": {
    GK: 1,
    DEF: 3,
    MID: 5,
    FWD: 2,
    desc: "Tactical 3-5-2 with wing-backs",
    pitchRows: [2, 5, 3, 1],
  },
  "4-5-1": {
    GK: 1,
    DEF: 4,
    MID: 5,
    FWD: 1,
    desc: "Compact defensive 4-5-1 structure",
    pitchRows: [1, 5, 4, 1],
  },
}

const STARTING_BUDGETS: Record<"easy" | "medium" | "hard", number> = {
  easy: 100,
  medium: 85,
  hard: 70,
}

interface CustomSelectProps {
  id: string
  value: string
  options: string[]
  placeholder: string
  disabled?: boolean
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onChange: (value: string) => void
}

function CustomSelect({
  id,
  value,
  options,
  placeholder,
  disabled = false,
  isOpen,
  onToggle,
  onClose,
  onChange,
}: CustomSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [openUpwards, setOpenUpwards] = useState(false)

  // Sync highlightedIndex with current value or 0 when opened
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt === value)
      setHighlightedIndex(idx >= 0 ? idx : 0)

      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        if (spaceBelow < 310 && rect.top > 310) {
          setOpenUpwards(true)
        } else {
          setOpenUpwards(false)
        }
      }
    } else {
      setHighlightedIndex(-1)
    }
  }, [isOpen, options, value])

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      })
    }
  }, [highlightedIndex, isOpen])

  // Click outside and Escape handling
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!isOpen) {
        onToggle()
      } else {
        const delta = e.key === "ArrowDown" ? 1 : -1
        setHighlightedIndex((prev) => {
          if (options.length === 0) return -1
          const next = prev + delta
          if (next < 0) return options.length - 1
          if (next >= options.length) return 0
          return next
        })
      }
    } else if (e.key === "Enter" || e.key === " ") {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
        e.preventDefault()
        onChange(options[highlightedIndex])
        onClose()
      } else if (!isOpen && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        onToggle()
      }
    } else if (e.key === "Tab") {
      if (isOpen) {
        onClose()
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full" id={`dropdown-container-${id}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (!disabled) onToggle()
        }}
        onKeyDown={handleTriggerKeyDown}
        className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition outline-none ${
          disabled
            ? "cursor-not-allowed border-white/10 bg-[#071628]/60 text-white/30 opacity-40"
            : isOpen
              ? "border-[#38BDF8] bg-[#071628] text-white ring-1 ring-[#38BDF8]"
              : "border-white/20 bg-[#071628] text-white hover:border-white/40 focus:border-[#38BDF8]"
        }`}
      >
        <span
          className={`truncate ${
            value
              ? "text-base font-bold text-white"
              : "text-sm font-semibold uppercase tracking-wider text-white/40"
          }`}
        >
          {value || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`ml-2 shrink-0 text-white/60 transition-transform ${
            isOpen ? "rotate-180 text-[#38BDF8]" : ""
          } ${disabled ? "opacity-30" : ""}`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 z-50 w-full overflow-hidden rounded-xl border border-white/15 bg-[#0a1b31] p-1.5 shadow-2xl backdrop-blur-xl ${
            openUpwards ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden space-y-1 pr-1">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs italic text-white/40">
                No options available
              </div>
            ) : (
              options.map((option, idx) => {
                const isSelected = option === value
                const isHighlighted = idx === highlightedIndex

                return (
                  <button
                    key={option}
                    ref={(el) => {
                      optionRefs.current[idx] = el
                    }}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => {
                      onChange(option)
                      onClose()
                      triggerRef.current?.focus()
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition ${
                      isSelected
                        ? "border border-[#38BDF8]/40 bg-[#38BDF8]/20 font-bold text-[#38BDF8]"
                        : isHighlighted
                          ? "bg-[#38BDF8]/15 text-[#38BDF8]"
                          : "text-white/80 hover:bg-[#38BDF8]/15 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{option}</span>
                    {isSelected && (
                      <Check size={16} className="shrink-0 ml-2 text-[#38BDF8]" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<
    | "home"
    | "setup"
    | "lineup"
    | "preview"
    | "result"
    | "league-setup"
    | "league-formation"
    | "league-squad"
    | "league-dashboard"
  >("home")

  const [leagueSeason, setLeagueSeason] = useState("")
  const [leagueDifficulty, setLeagueDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("medium")
  const [leagueFormation, setLeagueFormation] = useState<FormationKey>("4-3-3")

  // Market & Starting XI state
  const rawRatedCsvRef = useRef<string | null>(null)
  const randomOrderMapRef = useRef<Record<string, number>>({})
  const [, setRandomSeed] = useState(0)

  const [marketPlayers, setMarketPlayers] = useState<RatedPlayer[]>([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketError, setMarketError] = useState<string | null>(null)

  // Market filters & sorting
  const [marketSearch, setMarketSearch] = useState("")
  const [marketPositionFilter, setMarketPositionFilter] = useState<
    "ALL" | "GK" | "DEF" | "MID" | "FWD"
  >("ALL")
  const [marketSortBy, setMarketSortBy] = useState<
    "price_desc" | "price_asc" | "name_asc" | "random"
  >("price_desc")
  const [marketPage, setMarketPage] = useState(1)

  // User's selected Starting XI (up to 11 players matching chosen formation)
  const [leagueStartingXI, setLeagueStartingXI] = useState<RatedPlayer[]>([])

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  const resetMatchState = () => {
    setHomeTeam("")
    setHomeSeason("")
    setAwayTeam("")
    setAwaySeason("")
    setHomePlayers([])
    setAwayPlayers([])
    setHomeXI([])
    setAwayXI([])
    setMatchResult(null)
    setOpenDropdownId(null)
    setScreen("setup")
  }
  const resetMatch = resetMatchState

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

  useEffect(() => {
    if (!leagueSeason) {
      setMarketPlayers([])
      return
    }

    let isMounted = true
    setMarketLoading(true)
    setMarketError(null)

    const processCsv = (csvText: string) => {
      const result = Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
      })

      const rows = result.data.filter((r) => r.Season === leagueSeason)
      const playerMap = new Map<string, RatedPlayer>()

      rows.forEach((row) => {
        const id = row.id?.trim()
        if (!id) return
        const existing = playerMap.get(id)
        const team = row.Team?.trim() || ""

        if (existing) {
          if (team && !existing.teams.includes(team)) {
            existing.teams.push(team)
            existing.Team = existing.teams.join(" / ")
          }
        } else {
          const rating = parseInt(row.Rating, 10) || 50
          const price = parseFloat(row.Price) || 5.0
          const posGroup = (row.position_group?.trim() || "MID") as
            | "GK"
            | "DEF"
            | "MID"
            | "FWD"

          playerMap.set(id, {
            id,
            Season: row.Season,
            season_year: row.season_year,
            Team: team,
            teams: team ? [team] : [],
            Player: row.Player || "Unknown",
            Position: row.Position || posGroup,
            position_group: posGroup,
            age: parseFloat(row.age) || 25,
            Rating: rating,
            Price: price,
          })
        }
      })

      const deduplicated = Array.from(playerMap.values())
      if (isMounted) {
        const initialRandomMap: Record<string, number> = {}
        deduplicated.forEach((p) => {
          initialRandomMap[p.id] = Math.random()
        })
        randomOrderMapRef.current = initialRandomMap
        setMarketPlayers(deduplicated)
        setMarketLoading(false)
        setMarketPage(1)
      }
    }

    if (rawRatedCsvRef.current) {
      processCsv(rawRatedCsvRef.current)
    } else {
      fetch("/data/players_rated.csv")
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to load player market data (${res.status})`)
          }
          return res.text()
        })
        .then((csvText) => {
          rawRatedCsvRef.current = csvText
          processCsv(csvText)
        })
        .catch((err) => {
          if (isMounted) {
            console.error("Error loading players_rated.csv:", err)
            setMarketError(err.message || "Failed to load player data")
            setMarketLoading(false)
          }
        })
    }

    return () => {
      isMounted = false
    }
  }, [leagueSeason])
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
      <main className="relative min-h-screen overflow-hidden bg-[#061426] text-white">

        {/* Match Preview Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/EplKickoff.avif')" }}
        />



        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#141414]/70" />

        <div className="relative z-10">



        <nav className="flex h-20 items-center justify-between border-b border-[#141414]/10 bg-[#1E3A8A] px-8 lg:px-14">

          <button
            onClick={() => setScreen("lineup")}
            className="text-sm font-bold text-white/50 transition hover:text-white"
          >
            ← Edit Lineups
          </button>

          <div className="text-xl font-black tracking-tight">
            EPL <span className="text-[#38BDF8]">REWIND</span>
          </div>

          <div className="text-xs font-bold uppercase tracking-widest text-white">
            Match Preview
          </div>

        </nav>

        <section className="mx-auto max-w-5xl px-8 pt-26 pb-20">

          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
              Match Preview
            </p>

            <h1 className="mt-4 text-5xl font-black">
              READY TO <span className="text-[#38BDF8]">REWIND?</span>
            </h1>

          </div>

          <div className="mt-16 grid grid-cols-3 items-center gap-8">

            <div className="text-center">
              <p className="text-3xl font-black">
                {homeTeam}
              </p>

              <p className="mt-2 text-sm text-white">
                {homeSeason}
              </p>

              <p className="mt-6 text-xs font-bold uppercase tracking-widest text-white">
                {homeXI.length} Players Selected
              </p>
            </div>

            <div className="text-center text-5xl font-black text-white">
              VS
            </div>

            <div className="text-center">
              <p className="text-3xl font-black">
                {awayTeam}
              </p>

              <p className="mt-2 text-sm text-white">
                {awaySeason}
              </p>

              <p className="mt-6 text-xs font-bold uppercase tracking-widest text-white">
                {awayXI.length} Players Selected
              </p>
            </div>

          </div>

          <div className="mt-16 flex justify-center">

            <button
              onClick={async () => {
                try {
                  const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/simulate`,
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
              className="rounded-xl bg-[#38BDF8] px-12 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:scale-105"
            >
              SIMULATE MATCH
            </button>

          </div>

        </section>
      
        </div>

      </main>
    )
  }


  if (screen === "result") {
    return (
      <main className="min-h-screen bg-[#141414] text-white">

        <nav className="flex h-20 items-center justify-between border-b border-[#141414]/10 bg-[#1E3A8A] px-8 lg:px-14">

          <button
            onClick={() => setScreen("preview")}
            className="text-sm font-bold text-white/50 transition hover:text-white"
          >
            ← Match Preview
          </button>

          <div className="text-xl font-black tracking-tight">
            EPL <span className="text-[#38BDF8]">REWIND</span>
          </div>

          <div className="text-xs font-bold uppercase tracking-widest text-white">
            Full Time
          </div>

        </nav>

        <section className="mx-auto max-w-6xl px-8 py-16">

          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
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

            <div className="rounded-2xl border border-[#38BDF8]/20 bg-[#0a1b31] p-7">

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#38BDF8]">
                Man of the Match
              </p>

              <p className="mt-5 text-2xl font-black">
                <span>{matchResult?.man_of_match || "—"}</span>
              </p>

            </div>

          </div>

          <div className="mt-10 flex justify-center">

            <button
              onClick={resetMatch}
              className="rounded-xl bg-[#38BDF8] px-10 py-4 text-sm font-black uppercase tracking-widest text-[#FFFFFF] transition hover:scale-105"
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
      <main className="min-h-screen bg-[#141414] text-white">

        <nav className="flex h-20 items-center justify-between border-b border-[#141414]/10 bg-[#1E3A8A] px-8 lg:px-14">

          <button
            onClick={() => setScreen("setup")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#38BDF8] font-black text-[#000000]">
              <svg 
                className="h-5 w-5 fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" />
              </svg>
            </div>

            <span className="text-xl font-black tracking-tight">
              EPL REWIND
            </span>
          </button>

          <div className="rounded-full border border-[#FFFFFF] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#FFFFFF]">
            Starting XI
          </div>

        </nav>

        <section className="mx-auto max-w-6xl px-8 py-16">

          <div className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-10 bg-[#38BDF8]" />

              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
                Match Setup
              </span>
            </div>

            <h1 className="text-5xl font-black tracking-[-0.04em]">
              BUILD YOUR
              <span className="text-[#38BDF8]"> XI.</span>
            </h1>

            <p className="mt-4 text-white/45">
              Select your starting eleven for each team.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            <div className="flex min-h-[1200px] flex-col rounded-3xl border border-white/10 bg-[#0a1b31] p-7">

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#38BDF8]">
                Home
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {homeTeam}
              </h2>

              <p className="mt-1 text-sm text-white/40">
                {homeSeason}
              </p>

              <div className="mt-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/70">
                  Select Players
                </p>

                <div className="space-y-6">

                  <div className="space-y-8">
                  

                    {[
                      ["ATTACKERS", ATTACKERS],
                      ["MIDFIELDERS", MIDFIELDERS],
                      ["DEFENDERS", DEFENDERS],
                      ["GOALKEEPERS", GOALKEEPERS],
                    ].map(([label, positions]) => {

                      const positionPlayers = getPlayersByPosition(
                        homePlayers,
                        positions as string[]
                      )

                      if (positionPlayers.length === 0) {
                        return null
                      }

                      return (
                        <div
                          key={label as string}
                          style={{
                            minHeight: `${
                              Math.max(
                                Math.ceil(positionPlayers.length / 2),
                                Math.ceil(
                                  getPlayersByPosition(
                                    awayPlayers,
                                    positions as string[]
                                  ).length / 2
                                )
                              ) * 108 + 50
                            }px`,
                          }}
                        >

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
                                      ? "border-[#38BDF8] bg-[#38BDF8]/10"
                                      : "border-white/10 bg-[#141414] hover:border-white/30"
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
                      <div className="mt-auto rounded-xl border border-white/10 bg-[#141414] p-4">

                        <div className="flex items-center justify-between">

                          <span className="text-sm text-white/50">
                            {homeXI.length} / 11 selected
                          </span>

                          <span
                            className={
                              status.valid
                                ? "text-sm font-bold text-[#38BDF8]"
                                : "text-sm font-bold text-white/40"
                            }
                          >
                            {status.valid ? "XI READY" : "XI INCOMPLETE"}
                          </span>

                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">

                          <span className={status.goalkeepers === 1 ? "text-[#38BDF8]" : "text-red-400"}>
                            {status.goalkeepers === 1 ? "✓" : "✕"} 1 Goalkeeper
                          </span>

                          <span className={status.defenders >= 3 ? "text-[#38BDF8]" : "text-red-400"}>
                            {status.defenders >= 3 ? "✓" : "✕"} 3+ Defenders
                          </span>

                          <span className={status.midfielders >= 2 ? "text-[#38BDF8]" : "text-red-400"}>
                            {status.midfielders >= 2 ? "✓" : "✕"} 2+ Midfielders
                          </span>

                          <span className={status.attackers >= 1 ? "text-[#38BDF8]" : "text-red-400"}>
                            {status.attackers >= 1 ? "✓" : "✕"} 1+ Attacker
                          </span>

                        </div>

                      </div>
                    )
                  })()}

                </div>
                

              </div>

            </div>

            <div className="flex min-h-[1200px] flex-col rounded-3xl border border-white/10 bg-[#0a1b31] p-7">

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#38BDF8]">
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

                <div className="space-y-6">

                  <div className="space-y-8">

                    {[
                      ["ATTACKERS", ATTACKERS],
                      ["MIDFIELDERS", MIDFIELDERS],
                      ["DEFENDERS", DEFENDERS],
                      ["GOALKEEPERS", GOALKEEPERS],
                    ].map(([label, positions]) => {

                      const positionPlayers = getPlayersByPosition(
                        awayPlayers,
                        positions as string[]
                      )

                      if (positionPlayers.length === 0) {
                        return null
                      }

                      return (
                        <div
                          key={label as string}
                          style={{
                            minHeight: `${
                              Math.max(
                                Math.ceil(positionPlayers.length / 2),
                                Math.ceil(
                                  getPlayersByPosition(
                                    homePlayers,
                                    positions as string[]
                                  ).length / 2
                                )
                              ) * 108 + 50
                            }px`,
                          }}
                        >

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
                                      ? "border-[#38BDF8] bg-[#38BDF8]/10"
                                      : "border-white/10 bg-[#141414] hover:border-white/30"
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
                      <div className="mt-auto rounded-xl border border-white/10 bg-[#141414] p-4">

                        <div className="flex items-center justify-between">

                          <span className="text-sm text-white/50">
                            {awayXI.length} / 11 selected
                          </span>

                          <span
                            className={
                              status.valid
                                ? "text-sm font-bold text-[#38BDF8]"
                                : "text-sm font-bold text-white/40"
                            }
                          >
                            {status.valid ? "XI READY" : "XI INCOMPLETE"}
                          </span>

                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">

                          <span className={status.goalkeepers === 1 ? "text-[#38BDF8]" : "text-red-400"}>
                            {status.goalkeepers === 1 ? "✓" : "✕"} 1 Goalkeeper
                          </span>

                          <span className={status.defenders >= 3 ? "text-[#38BDF8]" : "text-red-400"}>
                            {status.defenders >= 3 ? "✓" : "✕"} 3+ Defenders
                          </span>

                          <span className={status.midfielders >= 2 ? "text-[#38BDF8]" : "text-red-400"}>
                            {status.midfielders >= 2 ? "✓" : "✕"} 2+ Midfielders
                          </span>

                          <span className={status.attackers >= 1 ? "text-[#38BDF8]" : "text-red-400"}>
                            {status.attackers >= 1 ? "✓" : "✕"} 1+ Attacker
                          </span>

                        </div>

                      </div>
                    )
                  })()}

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
                  ? "bg-[#38BDF8] text-white/80 hover:scale-105"
                  : "cursor-not-allowed bg-white/10 text-white/60"
              }`}
            >
              CONTINUE
            </button>

          </div>
        </section>

      </main>
    )
  }


  // Shared League Mode budget & Starting XI calculations
  const startingBudget = STARTING_BUDGETS[leagueDifficulty]
  const totalSpent =
    Math.round(leagueStartingXI.reduce((sum, p) => sum + p.Price, 0) * 10) / 10
  const remainingBudget =
    Math.round((startingBudget - totalSpent) * 10) / 10

  const formationReq = FORMATIONS[leagueFormation]
  const currentGK = leagueStartingXI.filter((p) => p.position_group === "GK").length
  const currentDEF = leagueStartingXI.filter((p) => p.position_group === "DEF").length
  const currentMID = leagueStartingXI.filter((p) => p.position_group === "MID").length
  const currentFWD = leagueStartingXI.filter((p) => p.position_group === "FWD").length

  const isXIComplete =
    leagueStartingXI.length === 11 &&
    currentGK === formationReq.GK &&
    currentDEF === formationReq.DEF &&
    currentMID === formationReq.MID &&
    currentFWD === formationReq.FWD &&
    remainingBudget >= 0

  const handleAddPlayer = (player: RatedPlayer) => {
    if (leagueStartingXI.some((p) => p.id === player.id)) return
    if (leagueStartingXI.length >= 11) return
    if (player.position_group === "GK" && currentGK >= formationReq.GK) return
    if (player.position_group === "DEF" && currentDEF >= formationReq.DEF) return
    if (player.position_group === "MID" && currentMID >= formationReq.MID) return
    if (player.position_group === "FWD" && currentFWD >= formationReq.FWD) return
    if (totalSpent + player.Price > startingBudget + 0.001) return

    setLeagueStartingXI((prev) => [...prev, player])
  }

  const handleRemovePlayer = (playerId: string) => {
    setLeagueStartingXI((prev) => prev.filter((p) => p.id !== playerId))
  }

  const handleSelectFormation = (f: FormationKey) => {
    if (f !== leagueFormation) {
      setLeagueFormation(f)
      setLeagueStartingXI([])
    }
  }

  const reshuffleRandomOrder = (playersList: RatedPlayer[] = marketPlayers) => {
    const map: Record<string, number> = {}
    playersList.forEach((p) => {
      map[p.id] = Math.random()
    })
    randomOrderMapRef.current = map
    setRandomSeed((s) => s + 1)
    setMarketPage(1)
  }

  // Rating profile
  const xiFWDPlayers = leagueStartingXI.filter((p) => p.position_group === "FWD")
  const xiMIDPlayers = leagueStartingXI.filter((p) => p.position_group === "MID")
  const xiDEFPlayers = leagueStartingXI.filter((p) => p.position_group === "DEF")
  const xiGKPlayers = leagueStartingXI.filter((p) => p.position_group === "GK")

  const attackRating =
    xiFWDPlayers.length > 0
      ? Math.round(
          xiFWDPlayers.reduce((sum, p) => sum + p.Rating, 0) /
            xiFWDPlayers.length
        )
      : 0

  const midfieldRating =
    xiMIDPlayers.length > 0
      ? Math.round(
          xiMIDPlayers.reduce((sum, p) => sum + p.Rating, 0) /
            xiMIDPlayers.length
        )
      : 0

  const defenceRating =
    xiDEFPlayers.length > 0
      ? Math.round(
          xiDEFPlayers.reduce((sum, p) => sum + p.Rating, 0) /
            xiDEFPlayers.length
        )
      : 0

  const gkRating = xiGKPlayers.length > 0 ? xiGKPlayers[0].Rating : 0

  const overallRating =
    leagueStartingXI.length > 0
      ? Math.round(
          leagueStartingXI.reduce((sum, p) => sum + p.Rating, 0) /
            leagueStartingXI.length
        )
      : 0

  const difficultyDisplay =
    leagueDifficulty === "easy"
      ? "Easy"
      : leagueDifficulty === "hard"
        ? "Hard"
        : "Medium"

  // -------------------------------------------------------------------------
  // SCREEN: LEAGUE DASHBOARD (Confirmation)
  // -------------------------------------------------------------------------
  if (screen === "league-dashboard") {
    return (
      <main className="min-h-screen bg-[#141414] text-white">
        <nav className="flex h-20 items-center justify-between border-b border-[#141414]/10 bg-[#1E3A8A] px-8 lg:px-14">
          <button
            onClick={() => setScreen("home")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#38BDF8] font-black text-[#000000]">
              <svg 
                className="h-5 w-5 fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight">
              EPL REWIND
            </span>
          </button>

          <div className="hidden items-center gap-8 text-sm font-semibold text-white/40 md:flex">
            <span>MATCH SIMULATOR</span>
            <span>HISTORY</span>
            <span>ABOUT</span>
          </div>

          <div className="rounded-full border border-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
            Historical Football
          </div>
        </nav>

        <section className="relative min-h-[calc(100vh-80px)] overflow-hidden px-8 py-12 lg:px-14">
          <div className="relative mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <button
                onClick={() => setScreen("league-squad")}
                className="flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-white"
              >
                <ArrowLeft size={17} />
                Edit Starting XI
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setScreen("league-formation")}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:border-[#38BDF8] hover:text-[#38BDF8]"
                >
                  Change Formation
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="mb-10">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px w-10 bg-[#38BDF8]" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
                  LEAGUE MODE
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                SEASON <span className="text-[#38BDF8]">READY.</span>
              </h1>
              <p className="mt-2 text-sm text-white/50">
                Your starting eleven has been confirmed and registered for the {leagueSeason} Premier League campaign.
              </p>
            </div>

            {/* Key campaign & finances overview */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Season & Difficulty
                </p>
                <p className="mt-2 text-2xl font-black text-[#38BDF8]">
                  {leagueSeason}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {difficultyDisplay} Difficulty
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Tactical Formation
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {leagueFormation}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {formationReq.GK}-{formationReq.DEF}-{formationReq.MID}-{formationReq.FWD} System
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Total Spent
                </p>
                <p className="mt-2 text-2xl font-black text-amber-400">
                  £{totalSpent.toFixed(1)}m
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Budget: £{startingBudget}m
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Remaining Funds
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-400">
                  £{remainingBudget.toFixed(1)}m
                </p>
                <p className="mt-1 text-xs text-white/40">
                  11 / 11 Starters Signed
                </p>
              </div>
            </div>

            {/* Team Strength Ratings Profile */}
            <div className="mb-10 rounded-3xl border border-[#38BDF8]/20 bg-[#0a1b31]/90 p-7 backdrop-blur">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#38BDF8]">
                    Starting XI Strength Profile
                  </p>
                  <h2 className="mt-1 text-xl font-black text-white">
                    TEAM RATINGS MATRIX
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/10 px-4 py-2 text-xs font-bold text-[#38BDF8]">
                  <span>OVERALL RATING:</span>
                  <span className="text-lg font-black">{overallRating}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Overall</p>
                  <p className="mt-2 text-3xl font-black text-[#38BDF8]">{overallRating}</p>
                  <p className="mt-1 text-[10px] text-white/40">11 Starters</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Attack</p>
                  <p className="mt-2 text-3xl font-black text-rose-400">{attackRating}</p>
                  <p className="mt-1 text-[10px] text-white/40">{currentFWD} Forwards</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Midfield</p>
                  <p className="mt-2 text-3xl font-black text-amber-400">{midfieldRating}</p>
                  <p className="mt-1 text-[10px] text-white/40">{currentMID} Midfielders</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Defence</p>
                  <p className="mt-2 text-3xl font-black text-blue-400">{defenceRating}</p>
                  <p className="mt-1 text-[10px] text-white/40">{currentDEF} Defenders</p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Goalkeeper</p>
                  <p className="mt-2 text-3xl font-black text-emerald-400">{gkRating}</p>
                  <p className="mt-1 text-[10px] text-white/40">{currentGK} Goalkeeper</p>
                </div>
              </div>
            </div>

            {/* Confirmed Starting XI Details */}
            <div className="mb-10 rounded-3xl border border-white/10 bg-[#0a1b31]/80 p-7 backdrop-blur">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">CONFIRMED STARTING XI</h3>
                  <p className="text-xs text-white/40">Formation: {leagueFormation} ({formationReq.GK} GK · {formationReq.DEF} DEF · {formationReq.MID} MID · {formationReq.FWD} FWD)</p>
                </div>
                <span className="rounded-full bg-[#38BDF8] px-3.5 py-1 text-xs font-black text-black">
                  11 PLAYERS
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {(["GK", "DEF", "MID", "FWD"] as const).map((group) => {
                  const groupStarters = leagueStartingXI.filter((p) => p.position_group === group)
                  const label = group === "GK" ? "Goalkeeper" : group === "DEF" ? "Defenders" : group === "MID" ? "Midfielders" : "Forwards"

                  return (
                    <div key={group} className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/50 border-b border-white/10 pb-1.5">
                        <span>{label}</span>
                        <span className="text-[#38BDF8]">{groupStarters.length}</span>
                      </div>
                      {groupStarters.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 transition hover:border-white/20"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#38BDF8] text-xs font-black text-black">
                              {player.Rating}
                            </span>
                            <div className="overflow-hidden">
                              <p className="truncate text-xs font-bold text-white">{player.Player}</p>
                              <p className="truncate text-[10px] text-white/40">{player.Team}</p>
                            </div>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-emerald-400">
                            £{player.Price.toFixed(1)}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* LEAGUE SIMULATION COMING NEXT NOTICE */}
            <div className="mb-12 rounded-3xl border border-dashed border-[#38BDF8]/40 bg-[#0a1b31]/50 p-10 text-center backdrop-blur">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#38BDF8]/10 text-[#38BDF8]">
                <Trophy size={28} />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
                LEAGUE SIMULATION COMING NEXT
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/60">
                Your 11 starters are confirmed and locked in for the 38-match campaign. League fixtures, standings, and simulated matchdays will be available in the next update.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setScreen("league-squad")}
                  className="rounded-xl border border-[#38BDF8] bg-[#38BDF8]/10 px-6 py-3 text-xs font-black tracking-wider text-white transition hover:bg-[#38BDF8]/20"
                >
                  MODIFY STARTING XI
                </button>
                <button
                  onClick={() => setScreen("league-formation")}
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-xs font-black tracking-wider text-white transition hover:border-white/40"
                >
                  CHANGE FORMATION
                </button>
                <button
                  onClick={() => setScreen("home")}
                  className="rounded-xl bg-white/10 px-6 py-3 text-xs font-black tracking-wider text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  RETURN TO HOME
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // -------------------------------------------------------------------------
  // SCREEN: LEAGUE FORMATION (Choose Formation Before Player Market)
  // -------------------------------------------------------------------------
  if (screen === "league-formation") {
    return (
      <main className="min-h-screen bg-[#141414] text-white">
        <nav className="flex h-20 items-center justify-between border-b border-[#141414]/10 bg-[#1E3A8A] px-8 lg:px-14">
          <button
            onClick={() => setScreen("home")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#38BDF8] font-black text-[#000000]">
              <svg 
                className="h-5 w-5 fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight">
              EPL REWIND
            </span>
          </button>

          <div className="hidden items-center gap-8 text-sm font-semibold text-white/40 md:flex">
            <span>MATCH SIMULATOR</span>
            <span>HISTORY</span>
            <span>ABOUT</span>
          </div>

          <div className="rounded-full border border-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
            Historical Football
          </div>
        </nav>

        <section className="relative min-h-[calc(100vh-80px)] overflow-hidden px-8 py-12 lg:px-14">
          <div className="relative mx-auto max-w-6xl">
            <button
              onClick={() => setScreen("league-setup")}
              className="mb-8 flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-white"
            >
              <ArrowLeft size={17} />
              Back to Setup
            </button>

            {/* Header */}
            <div className="mb-10">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px w-10 bg-[#38BDF8]" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
                  LEAGUE MODE
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                CHOOSE YOUR <span className="text-[#38BDF8]">FORMATION.</span>
              </h1>
              <p className="mt-2 text-sm text-white/50">
                Season {leagueSeason} · {difficultyDisplay} Difficulty
              </p>
              <p className="mt-1 text-sm text-white/40">
                Select your tactical system. This determines the exact positional requirements for your 11-player starting XI.
              </p>
            </div>

            {/* Formations Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {(Object.keys(FORMATIONS) as FormationKey[]).map((fKey) => {
                const fData = FORMATIONS[fKey]
                const isSelected = leagueFormation === fKey

                return (
                  <button
                    key={fKey}
                    type="button"
                    onClick={() => handleSelectFormation(fKey)}
                    className={`group flex flex-col justify-between rounded-3xl border p-5 text-left transition ${
                      isSelected
                        ? "border-[#38BDF8] bg-[#38BDF8]/15 shadow-xl scale-[1.02]"
                        : "border-white/10 bg-[#0a1b31]/80 hover:border-white/30 hover:scale-[1.01]"
                    }`}
                  >
                    <div>
                      {/* Mini pitch illustration */}
                      <div className="relative mb-4 h-32 w-full overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/70 via-[#062016]/80 to-emerald-950/90 p-2.5 shadow-inner">
                        <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-white/10" />
                        <div className="pointer-events-none absolute left-1.5 right-1.5 top-1/2 -translate-y-1/2 border-b border-white/10" />
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

                        {/* Formation dots per pitch row */}
                        <div className="relative z-10 flex h-full flex-col justify-between py-1">
                          {fData.pitchRows.map((count, rIdx) => (
                            <div key={rIdx} className="flex justify-around items-center px-1">
                              {Array.from({ length: count }).map((_, dotIdx) => (
                                <div
                                  key={dotIdx}
                                  className={`h-2.5 w-2.5 rounded-full shadow-sm ${
                                    rIdx === 0
                                      ? "bg-rose-400"
                                      : rIdx === 1
                                        ? "bg-amber-400"
                                        : rIdx === 2
                                          ? "bg-blue-400"
                                          : "bg-emerald-400"
                                  }`}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-black ${isSelected ? "text-[#38BDF8]" : "text-white"}`}>
                          {fKey}
                        </span>
                        {isSelected && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#38BDF8] text-black">
                            <Check size={14} />
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs font-semibold text-white/50 leading-relaxed">
                        {fData.desc}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-3">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
                        {fData.GK} GK · {fData.DEF} DEF · {fData.MID} MID · {fData.FWD} FWD
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Continue Button */}
            <div className="mt-12 flex justify-end">
              <button
                onClick={() => setScreen("league-squad")}
                className="group flex items-center gap-4 rounded-xl bg-[#38BDF8] px-8 py-4 font-black text-white transition hover:scale-[1.02] hover:bg-[#38BDF8]"
              >
                CONTINUE TO PLAYER MARKET
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // -------------------------------------------------------------------------
  // SCREEN: LEAGUE SQUAD (XI-Only Player Market)
  // -------------------------------------------------------------------------
  if (screen === "league-squad") {
    const filteredMarketPlayers = marketPlayers
      .filter((p) => {
        if (marketPositionFilter !== "ALL" && p.position_group !== marketPositionFilter) {
          return false
        }
        if (marketSearch.trim()) {
          const q = marketSearch.trim().toLowerCase()
          return (
            p.Player.toLowerCase().includes(q) ||
            p.Team.toLowerCase().includes(q) ||
            p.Position.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        switch (marketSortBy) {
          case "price_desc":
            return b.Price - a.Price || b.Rating - a.Rating
          case "price_asc":
            return a.Price - b.Price || b.Rating - a.Rating
          case "name_asc":
            return a.Player.localeCompare(b.Player)
          case "random":
            return (randomOrderMapRef.current[a.id] ?? 0) - (randomOrderMapRef.current[b.id] ?? 0)
          default:
            return 0
        }
      })

    const PLAYERS_PER_PAGE = 30
    const totalMarketPages = Math.max(1, Math.ceil(filteredMarketPlayers.length / PLAYERS_PER_PAGE))
    const paginatedMarketPlayers = filteredMarketPlayers.slice(
      (marketPage - 1) * PLAYERS_PER_PAGE,
      marketPage * PLAYERS_PER_PAGE
    )

    return (
      <main className="min-h-screen bg-[#141414] text-white">
        <nav className="flex h-20 items-center justify-between border-b border-[#141414]/10 bg-[#1E3A8A] px-8 lg:px-14">
          <button
            onClick={() => setScreen("home")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#38BDF8] font-black text-[#000000]">
              <svg 
                className="h-5 w-5 fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight">
              EPL REWIND
            </span>
          </button>

          <div className="hidden items-center gap-8 text-sm font-semibold text-white/40 md:flex">
            <span>MATCH SIMULATOR</span>
            <span>HISTORY</span>
            <span>ABOUT</span>
          </div>

          <div className="rounded-full border border-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
            Historical Football
          </div>
        </nav>

        <section className="relative min-h-[calc(100vh-80px)] overflow-hidden px-8 py-12 lg:px-14">
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => setScreen("league-formation")}
                className="flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-white"
              >
                <ArrowLeft size={17} />
                Change Formation
              </button>

              <div className="flex items-center gap-2 rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/10 px-4 py-1.5 text-xs font-bold text-[#38BDF8]">
                <span>Tactical Shape:</span>
                <span className="font-black text-white">{leagueFormation}</span>
                <span className="text-white/40">({formationReq.GK} GK · {formationReq.DEF} DEF · {formationReq.MID} MID · {formationReq.FWD} FWD)</span>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px w-10 bg-[#38BDF8]" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
                  LEAGUE MODE
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                BUILD YOUR <span className="text-[#38BDF8]">STARTING XI.</span>
              </h1>
              <p className="mt-2 text-sm text-white/50">
                Season {leagueSeason} · {difficultyDisplay} Difficulty · Formation: {leagueFormation}
              </p>
            </div>

            {/* Summary statistics cards */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Starting Budget
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  £{startingBudget}m
                </p>
                <p className="mt-1 text-xs text-white/40">{difficultyDisplay} mode</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Total Spent
                </p>
                <p className="mt-2 text-2xl font-black text-amber-400">
                  £{totalSpent.toFixed(1)}m
                </p>
                <p className="mt-1 text-xs text-white/40">{leagueStartingXI.length} starters signed</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Remaining Budget
                </p>
                <p className={`mt-2 text-2xl font-black ${remainingBudget >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  £{remainingBudget.toFixed(1)}m
                </p>
                <p className="mt-1 text-xs text-white/40">Available funds</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Starting XI Progress
                </p>
                <p className="mt-2 text-2xl font-black text-[#38BDF8]">
                  {leagueStartingXI.length} / 11 STARTERS
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {currentGK}/{formationReq.GK} GK · {currentDEF}/{formationReq.DEF} DEF · {currentMID}/{formationReq.MID} MID · {currentFWD}/{formationReq.FWD} FWD
                </p>
              </div>
            </div>

            {/* Live team-strength ratings matrix */}
            <div className="mb-10 rounded-2xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#38BDF8]/10 text-[#38BDF8]">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Starting XI Strength Metrics
                    </h3>
                    <p className="text-[11px] text-white/40">
                      Calculated dynamically from your 11 starters
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-center">
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 min-w-[65px]">
                    <div className="text-[10px] font-bold uppercase text-white/40">Overall</div>
                    <div className="text-lg font-black text-[#38BDF8]">{overallRating}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 min-w-[65px]">
                    <div className="text-[10px] font-bold uppercase text-white/40">Attack</div>
                    <div className="text-lg font-black text-rose-400">{attackRating}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 min-w-[65px]">
                    <div className="text-[10px] font-bold uppercase text-white/40">Midfield</div>
                    <div className="text-lg font-black text-amber-400">{midfieldRating}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 min-w-[65px]">
                    <div className="text-[10px] font-bold uppercase text-white/40">Defence</div>
                    <div className="text-lg font-black text-blue-400">{defenceRating}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 min-w-[65px]">
                    <div className="text-[10px] font-bold uppercase text-white/40">GK</div>
                    <div className="text-lg font-black text-emerald-400">{gkRating}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout: Market (Left) + Starting XI Panel (Right) */}
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left Column: Player Market (7 or 8 cols) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                {/* Search & Filter Bar */}
                <div className="rounded-3xl border border-white/10 bg-[#0a1b31]/80 p-5 backdrop-blur">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search input */}
                    <div className="relative flex-1">
                      <Search
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <input
                        type="text"
                        value={marketSearch}
                        onChange={(e) => {
                          setMarketSearch(e.target.value)
                          setMarketPage(1)
                        }}
                        placeholder="Search player or historical club..."
                        className="w-full rounded-xl border border-white/15 bg-black/40 pl-11 pr-10 py-3 text-sm text-white placeholder-white/35 outline-none transition focus:border-[#38BDF8]"
                      />
                      {marketSearch && (
                        <button
                          onClick={() => {
                            setMarketSearch("")
                            setMarketPage(1)
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* Sort select & shuffle action */}
                    <div className="flex items-center gap-2 sm:w-72">
                      <div className="relative flex-1">
                        <select
                          value={marketSortBy}
                          onChange={(e) => {
                            const newSort = e.target.value as any
                            setMarketSortBy(newSort)
                            if (newSort === "random") {
                              reshuffleRandomOrder()
                            }
                            setMarketPage(1)
                          }}
                          className="w-full appearance-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-xs font-bold text-white outline-none transition focus:border-[#38BDF8]"
                        >
                          <option value="price_desc" className="bg-[#141414] text-white">
                            Price: High to Low
                          </option>
                          <option value="price_asc" className="bg-[#141414] text-white">
                            Price: Low to High
                          </option>
                          <option value="name_asc" className="bg-[#141414] text-white">
                            Player Name: A–Z
                          </option>
                          <option value="random" className="bg-[#141414] text-white">
                            Random Order
                          </option>
                        </select>
                        <ChevronDown
                          size={16}
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                        />
                      </div>

                      {marketSortBy === "random" && (
                        <button
                          type="button"
                          onClick={() => reshuffleRandomOrder()}
                          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/10 px-3 py-3 text-xs font-bold text-[#38BDF8] transition hover:bg-[#38BDF8]/20"
                          title="Generate a new random shuffle"
                        >
                          <RotateCcw size={14} />
                          Shuffle
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Position filters */}
                  <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-white/10">
                    {(
                      [
                        { id: "ALL", label: "All Positions" },
                        { id: "GK", label: `GK (${currentGK}/${formationReq.GK})` },
                        { id: "DEF", label: `DEF (${currentDEF}/${formationReq.DEF})` },
                        { id: "MID", label: `MID (${currentMID}/${formationReq.MID})` },
                        { id: "FWD", label: `FWD (${currentFWD}/${formationReq.FWD})` },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setMarketPositionFilter(tab.id)
                          setMarketPage(1)
                        }}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                          marketPositionFilter === tab.id
                            ? "bg-[#38BDF8] text-black"
                            : "border border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between text-xs text-white/50 px-1">
                  <span>
                    Showing {paginatedMarketPlayers.length} of {filteredMarketPlayers.length} players
                  </span>
                  <span>
                    Page {marketPage} of {totalMarketPages}
                  </span>
                </div>

                {/* Loading state */}
                {marketLoading && (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0a1b31]/40 p-16 text-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#38BDF8] border-t-transparent" />
                    <p className="mt-4 text-sm font-semibold text-white/60">
                      Loading player market for {leagueSeason}...
                    </p>
                  </div>
                )}

                {/* Error state */}
                {marketError && (
                  <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-10 text-center text-rose-300">
                    <AlertCircle className="mx-auto h-8 w-8 mb-2 text-rose-400" />
                    <p className="font-bold">{marketError}</p>
                    <button
                      onClick={() => {
                        rawRatedCsvRef.current = null
                        setLeagueSeason((prev) => prev)
                      }}
                      className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
                    >
                      Retry Loading
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {!marketLoading && !marketError && filteredMarketPlayers.length === 0 && (
                  <div className="rounded-3xl border border-white/10 bg-[#0a1b31]/40 p-14 text-center text-white/50">
                    <Search className="mx-auto h-8 w-8 mb-3 text-white/30" />
                    <p className="text-base font-bold text-white">No players found</p>
                    <p className="mt-1 text-xs">Try adjusting your search query or position filter.</p>
                    <button
                      onClick={() => {
                        setMarketSearch("")
                        setMarketPositionFilter("ALL")
                      }}
                      className="mt-4 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white hover:border-[#38BDF8]"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}

                {/* Player Cards Grid */}
                {!marketLoading && !marketError && filteredMarketPlayers.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {paginatedMarketPlayers.map((player) => {
                      const isSelected = leagueStartingXI.some((p) => p.id === player.id)
                      const isXIFull = leagueStartingXI.length >= 11
                      const cannotAfford = remainingBudget < player.Price
                      let positionFull = false
                      if (player.position_group === "GK" && currentGK >= formationReq.GK) positionFull = true
                      if (player.position_group === "DEF" && currentDEF >= formationReq.DEF) positionFull = true
                      if (player.position_group === "MID" && currentMID >= formationReq.MID) positionFull = true
                      if (player.position_group === "FWD" && currentFWD >= formationReq.FWD) positionFull = true

                      const canAdd = !isSelected && !isXIFull && !cannotAfford && !positionFull

                      return (
                        <div
                          key={player.id}
                          className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                            isSelected
                              ? "border-[#38BDF8] bg-[#38BDF8]/10 shadow-md"
                              : "border-white/10 bg-[#0a1b31]/80 hover:border-white/25"
                          }`}
                        >
                          <div>
                            {/* Card top badges */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
                                {player.Position} · {player.position_group}
                              </span>

                              <div className="flex items-center gap-1 rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/15 px-2.5 py-0.5 font-black text-[#38BDF8]">
                                <span className="text-[10px] text-[#38BDF8]/70">OVR</span>
                                <span className="text-sm">{player.Rating}</span>
                              </div>
                            </div>

                            {/* Player name & club */}
                            <div className="mt-3">
                              <h3 className="truncate text-base font-black text-white" title={player.Player}>
                                {player.Player}
                              </h3>
                              <p className="mt-0.5 truncate text-xs text-white/50" title={player.Team}>
                                {player.Team}
                              </p>
                            </div>
                          </div>

                          {/* Card bottom price & action */}
                          <div className="mt-4 border-t border-white/10 pt-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs text-white/50">Price</span>
                              <span className="text-base font-black text-emerald-400">
                                £{player.Price.toFixed(1)}m
                              </span>
                            </div>

                            {isSelected ? (
                              <button
                                type="button"
                                onClick={() => handleRemovePlayer(player.id)}
                                className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 py-2 text-xs font-black uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/20"
                              >
                                In XI · Remove
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!canAdd}
                                onClick={() => handleAddPlayer(player)}
                                className={`w-full rounded-xl py-2 text-xs font-black uppercase tracking-wider transition ${
                                  canAdd
                                    ? "bg-[#38BDF8] text-white hover:bg-[#38BDF8]/80 hover:scale-[1.01]"
                                    : "cursor-not-allowed bg-white/5 text-white/30"
                                }`}
                              >
                                {cannotAfford
                                  ? "Can't Afford"
                                  : isXIFull
                                    ? "XI Full"
                                    : positionFull
                                      ? `Max ${player.position_group} (${formationReq[player.position_group]})`
                                      : "+ Add to Starting XI"}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalMarketPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <button
                      disabled={marketPage <= 1}
                      onClick={() => setMarketPage((prev) => Math.max(1, prev - 1))}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:border-[#38BDF8] disabled:opacity-30 disabled:hover:border-white/15"
                    >
                      ← Previous
                    </button>
                    <span className="text-xs text-white/50">
                      Page {marketPage} of {totalMarketPages}
                    </span>
                    <button
                      disabled={marketPage >= totalMarketPages}
                      onClick={() => setMarketPage((prev) => Math.min(totalMarketPages, prev + 1))}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:border-[#38BDF8] disabled:opacity-30 disabled:hover:border-white/15"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Starting XI Panel (5 or 4 cols) */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="sticky top-6 rounded-3xl border border-white/10 bg-[#0a1b31]/95 p-6 backdrop-blur shadow-2xl">
                  {/* XI Header */}
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <h2 className="text-lg font-black text-white">STARTING XI</h2>
                      <p className="text-xs text-white/40">Formation: {leagueFormation}</p>
                    </div>
                    <span className="rounded-full bg-[#38BDF8] px-3 py-1 text-xs font-black text-black">
                      {leagueStartingXI.length} / 11
                    </span>
                  </div>

                  {/* Positional quotas indicators */}
                  <div className="mb-6 grid grid-cols-4 gap-2 text-center text-xs">
                    <div className={`rounded-xl border p-2 ${currentGK === formationReq.GK ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]" : "border-white/10 bg-black/30 text-white/60"}`}>
                      <div className="text-[10px] font-bold">GK</div>
                      <div className="font-black">{currentGK}/{formationReq.GK}</div>
                    </div>
                    <div className={`rounded-xl border p-2 ${currentDEF === formationReq.DEF ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]" : "border-white/10 bg-black/30 text-white/60"}`}>
                      <div className="text-[10px] font-bold">DEF</div>
                      <div className="font-black">{currentDEF}/{formationReq.DEF}</div>
                    </div>
                    <div className={`rounded-xl border p-2 ${currentMID === formationReq.MID ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]" : "border-white/10 bg-black/30 text-white/60"}`}>
                      <div className="text-[10px] font-bold">MID</div>
                      <div className="font-black">{currentMID}/{formationReq.MID}</div>
                    </div>
                    <div className={`rounded-xl border p-2 ${currentFWD === formationReq.FWD ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]" : "border-white/10 bg-black/30 text-white/60"}`}>
                      <div className="text-[10px] font-bold">FWD</div>
                      <div className="font-black">{currentFWD}/{formationReq.FWD}</div>
                    </div>
                  </div>

                  {/* Grouped players list matching chosen formation */}
                  <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1">
                    {(
                      [
                        { group: "GK", label: "Goalkeeper", quota: formationReq.GK },
                        { group: "DEF", label: "Defenders", quota: formationReq.DEF },
                        { group: "MID", label: "Midfielders", quota: formationReq.MID },
                        { group: "FWD", label: "Forwards", quota: formationReq.FWD },
                      ] as const
                    ).map(({ group, label, quota }) => {
                      const playersInGroup = leagueStartingXI.filter((p) => p.position_group === group)
                      const emptySlots = quota - playersInGroup.length

                      return (
                        <div key={group} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white/40">
                            <span>{label}</span>
                            <span>{playersInGroup.length} / {quota}</span>
                          </div>

                          {playersInGroup.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 transition hover:border-white/20"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#38BDF8] text-[10px] font-black text-black">
                                  {player.Rating}
                                </span>
                                <div className="overflow-hidden">
                                  <p className="truncate text-xs font-bold text-white">
                                    {player.Player}
                                  </p>
                                  <p className="truncate text-[10px] text-white/40">
                                    {player.Position} · £{player.Price.toFixed(1)}m
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePlayer(player.id)}
                                className="shrink-0 rounded-lg p-1 text-white/40 hover:bg-rose-500/20 hover:text-rose-400"
                                title="Remove starter"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}

                          {Array.from({ length: Math.max(0, emptySlots) }).map((_, i) => (
                            <div
                              key={`empty-${group}-${i}`}
                              className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-2 text-[11px] text-white/25 flex items-center justify-between"
                            >
                              <span>+ Required {group} Slot</span>
                              <span className="text-[10px] text-white/20">Slot {playersInGroup.length + i + 1}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>

                  {/* Confirm Button */}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <button
                      disabled={!isXIComplete}
                      onClick={() => {
                        if (isXIComplete) {
                          setScreen("league-dashboard")
                        }
                      }}
                      className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#38BDF8] py-4 font-black text-white transition hover:scale-[1.01] hover:bg-[#38BDF8] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
                    >
                      CONFIRM STARTING XI
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </button>
                    {!isXIComplete && (
                      <p className="mt-2 text-center text-[11px] text-white/40">
                        Fill all 11 positions ({formationReq.GK} GK, {formationReq.DEF} DEF, {formationReq.MID} MID, {formationReq.FWD} FWD) within budget.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (screen === "league-setup") {
    const availableSeasons = [
      ...new Set(Object.values(teamSeasons).flat()),
    ].sort()

    return (
      <main className="min-h-screen bg-[#141414] text-white">
        <nav className="flex h-20 items-center justify-between border-b border-[#141414]/10 bg-[#1E3A8A] px-8 lg:px-14">
          <button
            onClick={() => setScreen("home")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#38BDF8] font-black text-[#000000]">
              <svg 
                className="h-5 w-5 fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" />
              </svg>
            </div>

            <span className="text-xl font-black tracking-tight">
              EPL REWIND
            </span>
          </button>

          <div className="hidden items-center gap-8 text-sm font-semibold text-white/40 md:flex">
            <span>
              MATCH SIMULATOR
            </span>

            <span>
              HISTORY
            </span>

            <span>
              ABOUT
            </span>
          </div>

          <div className="rounded-full border border-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
            Historical Football
          </div>
        </nav>

        <section className="relative min-h-[calc(100vh-80px)] overflow-hidden px-8 py-16 lg:px-14">
          <div className="relative mx-auto max-w-4xl">
            <button
              onClick={() => setScreen("home")}
              className="mb-8 flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-white"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="mb-12">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-10 bg-[#38BDF8]" />

                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
                  LEAGUE MODE
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.04em] sm:text-6xl">
                BUILD YOUR
                <br />
                <span className="text-[#38BDF8]">SEASON.</span>
              </h1>

              <p className="mt-4 max-w-xl text-white/45">
                Choose a historical Premier League season, set your difficulty, and build your squad before taking on the league.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0a1b31]/80 p-8 sm:p-10 backdrop-blur">
              {/* 1. Historical Season */}
              <div className="mb-8">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                  HISTORICAL SEASON
                </label>

                <div className="relative">
                  <select
                    value={leagueSeason}
                    onChange={(e) => {
                      const nextSeason = e.target.value
                      if (nextSeason !== leagueSeason) {
                        setLeagueSeason(nextSeason)
                        setLeagueStartingXI([])
                      }
                    }}
                    className="w-full appearance-none rounded-xl border border-white bg-grey text-[#FFFFFF] px-5 py-4 outline-none transition focus:border-[#38BDF8]"
                  >
                    <option value="" disabled className="bg-[#141414] text-white">
                      SELECT HISTORICAL SEASON
                    </option>

                    {availableSeasons.map((season) => (
                      <option key={season} value={season} className="bg-[#141414] text-white">
                        {season}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-white/60"
                  />
                </div>
              </div>

              {/* 2. Difficulty */}
              <div className="mb-10">
                <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-white/70">
                  DIFFICULTY
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      { id: "easy", name: "EASY", budget: "£100m", label: "Easy — £100m" },
                      { id: "medium", name: "MEDIUM", budget: "£85m", label: "Medium — £85m" },
                      { id: "hard", name: "HARD", budget: "£70m", label: "Hard — £70m" },
                    ] as const
                  ).map((item) => {
                    const isSelected = leagueDifficulty === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.id !== leagueDifficulty) {
                            setLeagueDifficulty(item.id)
                            setLeagueStartingXI([])
                          }
                        }}
                        className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition ${
                          isSelected
                            ? "border-[#38BDF8] bg-[#38BDF8]/10 text-white"
                            : "border-white/10 bg-[#141414]/40 text-white/70 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-base font-black tracking-wider text-white">
                            {item.name}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              isSelected
                                ? "bg-[#38BDF8] text-[#000000]"
                                : "border border-white/20 text-white/60"
                            }`}
                          >
                            {item.budget}
                          </span>
                        </div>

                        <div className="mt-4 text-xs font-semibold text-white/50">
                          {item.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Continue button */}
              <div className="flex justify-end pt-2">
                <button
                  disabled={!leagueSeason || !leagueDifficulty}
                  onClick={() => {
                    if (leagueSeason && leagueDifficulty) {
                      setScreen("league-formation")
                    }
                  }}
                  className="group flex items-center gap-4 rounded-xl bg-[#38BDF8] px-7 py-4 font-black text-white transition hover:scale-[1.02] hover:bg-[#38BDF8] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
                >
                  CONTINUE

                  <ArrowRight
                    size={20}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </div>
            </div>

            <div className="mt-16 flex gap-8 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <History size={17} />
                Historical seasons
              </div>

              <div className="flex items-center gap-2">
                <Trophy size={17} />
                Custom squad
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (screen === "setup") {
    return (
      <main className="min-h-screen bg-[#141414] text-white">

        {/* Navigation */}
        <nav className="flex h-20 items-center justify-between border-b border-[#141414]/10 bg-[#1E3A8A] px-8 lg:px-14">

          <button
            onClick={() => setScreen("home")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#38BDF8] font-black text-[#000000]">
              <svg 
                className="h-5 w-5 fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" />
              </svg>
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

          <div className="rounded-full border border-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
            Match Setup
          </div>

        </nav>

        {/* Setup */}
        <section className="relative min-h-[calc(100vh-80px)] overflow-hidden px-8 py-16 lg:px-14">

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
                <div className="h-px w-10 bg-[#38BDF8]" />

                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
                  Match Simulator
                </span>
              </div>

              <h1 className="text-5xl font-black tracking-[-0.04em] sm:text-6xl">
                CHOOSE YOUR
                <span className="text-[#38BDF8]"> MATCH.</span>
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
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#38BDF8]">
                      Home
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      HOME TEAM
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-white/60">
                    H
                  </div>
                </div>

                {/* Team */}
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                  Team
                </label>

                <div className="mb-6">
                  <CustomSelect
                    id="home-team"
                    value={homeTeam}
                    options={teams}
                    placeholder="SELECT HOME TEAM"
                    isOpen={openDropdownId === "home-team"}
                    onToggle={() =>
                      setOpenDropdownId(openDropdownId === "home-team" ? null : "home-team")
                    }
                    onClose={() => setOpenDropdownId(null)}
                    onChange={(newTeam) => {
                      setHomeTeam(newTeam)
                      setHomeSeason("")
                    }}
                  />
                </div>

                {/* Season */}
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                  Season
                </label>

                <div>
                  <CustomSelect
                    id="home-season"
                    value={homeSeason}
                    options={homeTeam ? teamSeasons[homeTeam] || [] : []}
                    placeholder="SELECT SEASON"
                    disabled={!homeTeam}
                    isOpen={openDropdownId === "home-season"}
                    onToggle={() =>
                      setOpenDropdownId(openDropdownId === "home-season" ? null : "home-season")
                    }
                    onClose={() => setOpenDropdownId(null)}
                    onChange={(newSeason) => {
                      setHomeSeason(newSeason)
                    }}
                  />
                </div>
              </div>

              {/* AWAY */}
              <div className="rounded-3xl border border-white/10 bg-[#0a1b31]/80 p-7 backdrop-blur">

                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#38BDF8]">
                      Away
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      AWAY TEAM
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-white/60">
                    A
                  </div>
                </div>

                {/* Team */}
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                  Team
                </label>

                <div className="mb-6">
                  <CustomSelect
                    id="away-team"
                    value={awayTeam}
                    options={teams}
                    placeholder="SELECT AWAY TEAM"
                    isOpen={openDropdownId === "away-team"}
                    onToggle={() =>
                      setOpenDropdownId(openDropdownId === "away-team" ? null : "away-team")
                    }
                    onClose={() => setOpenDropdownId(null)}
                    onChange={(newTeam) => {
                      setAwayTeam(newTeam)
                      setAwaySeason("")
                    }}
                  />
                </div>

                {/* Season */}
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                  Season
                </label>

                <div>
                  <CustomSelect
                    id="away-season"
                    value={awaySeason}
                    options={awayTeam ? teamSeasons[awayTeam] || [] : []}
                    placeholder="SELECT SEASON"
                    disabled={!awayTeam}
                    isOpen={openDropdownId === "away-season"}
                    onToggle={() =>
                      setOpenDropdownId(openDropdownId === "away-season" ? null : "away-season")
                    }
                    onClose={() => setOpenDropdownId(null)}
                    onChange={(newSeason) => {
                      setAwaySeason(newSeason)
                    }}
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
                className="group flex items-center gap-4 rounded-xl bg-[#38BDF8] px-7 py-4 font-black text-white transition hover:scale-[1.02] hover:bg-[#38BDF8] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
              >

                CONTINUE

                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />

              </button>

            </div>

            {/* Bottom info */}
            <div className="mt-16 flex gap-8 text-sm text-white/70">

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
    <main className="min-h-screen overflow-hidden bg-[#141414] text-white">

      <nav className="flex h-20 items-center justify-between border-b border-[#141414]/10 bg-[#1E3A8A] px-8 lg:px-14">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#38BDF8] font-black text-[#000000]">
            <svg 
              className="h-5 w-5 fill-current" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" />
            </svg>
          </div>

          <span className="text-xl font-black tracking-tight text-[#FFFFFF]">
            EPL REWIND
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-semibold text-white/80 md:flex">
          <span>
            MATCH SIMULATOR
          </span>

          <span>
            HISTORY
          </span>

          <span>
            ABOUT
          </span>
        </div>

        <div className="rounded-full border border-[#FFFFFF] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#FFFFFF]">
          Historical Football
        </div>

      </nav>

      <section className="relative flex min-h-[calc(100vh-80px)] items-center overflow-hidden px-8 lg:px-14">

        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/EplVideo.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

<div className="absolute inset-0 bg-black/45" />

        

        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-[#38BDF8]/10 blur-[120px]" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 py-12 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto_auto_auto] lg:gap-x-16 lg:gap-y-0 lg:py-0">

          {/* Left column: Match Simulator hero */}
          <div className="flex flex-col lg:grid lg:grid-rows-subgrid lg:row-span-5">

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-10 bg-[#38BDF8]" />

              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
                Premier League Time Machine
              </span>
            </div>

            <h1 className="max-w-3xl text-6xl font-black leading-[0.9] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              REWIND
              <br />
              <span className="text-[#38BDF8]">HISTORY.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-white/55">
              Put legendary Premier League teams from different eras
              head-to-head and see what happens when history gets
              rewritten.
            </p>

            <div className="mt-10 flex items-center">
              <button
                onClick={() => setScreen("setup")}
                className="group flex items-center gap-4 rounded-xl bg-[#38BDF8] px-7 py-4 font-black text-[#FFFFFF] transition hover:scale-[1.02] hover:bg-[#38BDF8]"
              >
                START MATCH

                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>

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

          {/* Right column: League Mode hero */}
          <div className="flex flex-col lg:grid lg:grid-rows-subgrid lg:row-span-5">

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-10 bg-[#38BDF8]" />

              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#38BDF8]">
                League Mode
              </span>
            </div>

            <h2 className="max-w-3xl text-6xl font-black leading-[0.9] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              PLAY THE
              <br />
              <span className="text-[#38BDF8]">LEAGUE.</span>
            </h2>

            <p className="mt-8 max-w-xl text-lg leading-8 text-white/55">
              Build your dream XI from historical Premier League players,
              manage your budget, and compete across an entire season.
            </p>

            <div className="mt-10 flex items-center">
              <button
                onClick={() => setScreen("league-setup")}
                className="group flex items-center gap-4 rounded-xl bg-[#38BDF8] px-7 py-4 font-black text-[#FFFFFF] transition hover:scale-[1.02] hover:bg-[#38BDF8]"
              >
                START LEAGUE

                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 sm:gap-8 text-sm text-white/40">

              <div className="flex items-center gap-2">
                <Trophy size={17} />
                20 Teams
              </div>

              <div className="flex items-center gap-2">
                <History size={17} />
                38 Matches
              </div>

              <div className="flex items-center gap-2">
                <Shield size={17} />
                Custom Squad
              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default App