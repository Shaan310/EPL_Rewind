import { useEffect, useMemo, useRef, useState } from "react"
import Papa from "papaparse"
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Trophy,
  Search,
  X,
  Check,
  Shield,
  RotateCcw,
  AlertCircle,
  Award,
  Medal,
  Play,
  Pause,
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
  easy: 250,
  medium: 200,
  hard: 100,
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
  const [leagueReplacedClub, setLeagueReplacedClub] = useState("")
  const [leagueCustomClubName, setLeagueCustomClubName] = useState("Custom XI")

  // League Schedule & Simulation state
  const [leagueSchedule, setLeagueSchedule] = useState<any[]>([])
  const [leagueStandings, setLeagueStandings] = useState<any[]>([])
  const [leagueMatchResults, setLeagueMatchResults] = useState<Record<number, any[]>>({})
  const [currentSimulatedMatchday, setCurrentSimulatedMatchday] = useState(0)
  const [viewingMatchday, setViewingMatchday] = useState(1)
  const [leagueSimulating, setLeagueSimulating] = useState(false)
  const [leagueInitLoading, setLeagueInitLoading] = useState(false)
  const [leagueError, setLeagueError] = useState<string | null>(null)
  const [leagueInitialized, setLeagueInitialized] = useState(false)
  const [dashboardTab, setDashboardTab] = useState<"table" | "scorers" | "cleansheets" | "mvp">("table")
  const [playerStats, setPlayerStats] = useState<{
    goals: Record<string, number>
    clean_sheets: Record<string, number>
    mvp_points: Record<string, number>
    player_meta: Record<string, { player: string; team: string; position_group: string }>
  }>({
    goals: {},
    clean_sheets: {},
    mvp_points: {},
    player_meta: {},
  })
  const [leagueAwards, setLeagueAwards] = useState<{
    golden_boot: { player: string; team: string; goals: number }[]
    golden_glove: { player: string; team: string; clean_sheets: number }[]
    season_mvp: { player: string; team: string; mvp_points: number }[]
  } | null>(null)

  const [isAutoSimulating, setIsAutoSimulating] = useState(false)
  const [simSpeed, setSimSpeed] = useState<"1x" | "2x">("1x")
  const isAutoSimulatingRef = useRef(false)
  const simSpeedRef = useRef<"1x" | "2x">("1x")

  const toggleSimSpeed = (speed: "1x" | "2x") => {
    setSimSpeed(speed)
    simSpeedRef.current = speed
  }

  useEffect(() => {
    return () => {
      isAutoSimulatingRef.current = false
    }
  }, [])

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

  const seasonTeams = useMemo(() => {
    if (!leagueSeason) return []
    return Object.keys(teamSeasons)
      .filter((team) => teamSeasons[team]?.includes(leagueSeason))
      .sort()
  }, [teamSeasons, leagueSeason])

  const topScorersList = useMemo(() => {
    return Object.entries(playerStats.goals)
      .map(([key, count]) => {
        const meta = playerStats.player_meta[key] || {
          player: key.split("||")[0],
          team: key.split("||")[1] || "",
          position_group: "FWD",
        }
        return {
          key,
          player: meta.player,
          team: meta.team,
          position_group: meta.position_group,
          goals: count,
        }
      })
      .sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player))
      .slice(0, 15)
  }, [playerStats.goals, playerStats.player_meta])

  const topCleanSheetsList = useMemo(() => {
    return Object.entries(playerStats.clean_sheets)
      .map(([key, count]) => {
        const meta = playerStats.player_meta[key] || {
          player: key.split("||")[0],
          team: key.split("||")[1] || "",
          position_group: "GK",
        }
        return {
          key,
          player: meta.player,
          team: meta.team,
          clean_sheets: count,
        }
      })
      .sort((a, b) => b.clean_sheets - a.clean_sheets || a.player.localeCompare(b.player))
      .slice(0, 15)
  }, [playerStats.clean_sheets, playerStats.player_meta])

  const topMvpList = useMemo(() => {
    return Object.entries(playerStats.mvp_points)
      .map(([key, points]) => {
        const meta = playerStats.player_meta[key] || {
          player: key.split("||")[0],
          team: key.split("||")[1] || "",
          position_group: "MID",
        }
        const goals = playerStats.goals[key] || 0
        const cs = playerStats.clean_sheets[key] || 0
        return {
          key,
          player: meta.player,
          team: meta.team,
          position_group: meta.position_group,
          mvp_points: points,
          goals,
          clean_sheets: cs,
        }
      })
      .sort((a, b) => b.mvp_points - a.mvp_points || a.player.localeCompare(b.player))
      .slice(0, 15)
  }, [playerStats.mvp_points, playerStats.player_meta, playerStats.goals, playerStats.clean_sheets])

  const initLeagueSeason = async () => {
    setLeagueInitLoading(true)
    setLeagueError(null)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"
      const res = await fetch(`${apiUrl}/api/league/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: leagueSeason,
          replaced_club: leagueReplacedClub,
          custom_club_name: leagueCustomClubName.trim() || "Custom XI",
          custom_xi: leagueStartingXI,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize league fixtures")
      }
      setLeagueSchedule(data.schedule)
      setLeagueStandings(data.initial_standings)
      setLeagueMatchResults({})
      setCurrentSimulatedMatchday(0)
      setViewingMatchday(1)
      setPlayerStats({
        goals: {},
        clean_sheets: {},
        mvp_points: {},
        player_meta: {},
      })
      setLeagueAwards(null)
      setLeagueInitialized(true)
    } catch (err: any) {
      console.error("Error initializing league:", err)
      setLeagueError(err.message || "Failed to initialize league simulation")
    } finally {
      setLeagueInitLoading(false)
    }
  }

  useEffect(() => {
    if (
      screen === "league-dashboard" &&
      leagueSeason &&
      leagueReplacedClub &&
      leagueStartingXI.length === 11 &&
      !leagueInitialized &&
      !leagueInitLoading
    ) {
      initLeagueSeason()
    }
  }, [
    screen,
    leagueSeason,
    leagueReplacedClub,
    leagueStartingXI.length,
    leagueInitialized,
    leagueInitLoading,
  ])

  const handleStartAutoSimulation = async () => {
    if (currentSimulatedMatchday >= 38 || isAutoSimulatingRef.current || !leagueSchedule.length) return

    isAutoSimulatingRef.current = true
    setIsAutoSimulating(true)
    setLeagueSimulating(true)
    setLeagueError(null)

    let curMd = currentSimulatedMatchday
    let curStandings = leagueStandings
    let curPlayerStats = playerStats

    const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"

    try {
      while (curMd < 38 && isAutoSimulatingRef.current) {
        const nextMd = curMd + 1
        const scheduleItem = leagueSchedule.find((s) => s.matchday === nextMd)
        const fixturesList = scheduleItem?.matches || scheduleItem?.fixtures || []
        if (!scheduleItem || !fixturesList.length) {
          throw new Error(`No fixture data found for matchday ${nextMd}`)
        }

        const res = await fetch(`${apiUrl}/api/league/simulate-matchday`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            season: leagueSeason,
            matchday: nextMd,
            matches: fixturesList,
            custom_club_name: leagueCustomClubName.trim() || "Custom XI",
            replaced_club: leagueReplacedClub,
            custom_xi: leagueStartingXI,
            current_standings: curStandings,
            player_stats: curPlayerStats,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to simulate matchday ${nextMd}`)
        }

        curStandings = data.standings
        curPlayerStats = data.player_stats
        curMd = nextMd

        setLeagueMatchResults((prev) => ({
          ...prev,
          [nextMd]: data.results,
        }))
        setLeagueStandings(data.standings)
        setPlayerStats(data.player_stats)
        if (data.awards) {
          setLeagueAwards(data.awards)
        }
        setCurrentSimulatedMatchday(nextMd)
        setViewingMatchday(nextMd)

        // If another matchday remains and auto-sim is still active, wait before simulating next matchday
        if (curMd < 38 && isAutoSimulatingRef.current) {
          const delay = simSpeedRef.current === "2x" ? 350 : 800
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    } catch (err: any) {
      console.error(`Simulation loop error at matchday ${curMd + 1}:`, err)
      setLeagueError(err.message || "Simulation request failed")
    } finally {
      isAutoSimulatingRef.current = false
      setIsAutoSimulating(false)
      setLeagueSimulating(false)
    }
  }

  const handlePauseAutoSimulation = () => {
    isAutoSimulatingRef.current = false
    setIsAutoSimulating(false)
    setLeagueSimulating(false)
  }

  const handleSimulateSingleMatchday = async () => {
    if (currentSimulatedMatchday >= 38 || leagueSimulating || isAutoSimulating || !leagueSchedule.length) return
    const nextMd = currentSimulatedMatchday + 1
    const scheduleItem = leagueSchedule.find((s) => s.matchday === nextMd)
    const fixturesList = scheduleItem?.matches || scheduleItem?.fixtures || []
    if (!scheduleItem || !fixturesList.length) {
      setLeagueError(`No fixture data found for matchday ${nextMd}`)
      return
    }

    setLeagueSimulating(true)
    setLeagueError(null)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"
      const res = await fetch(`${apiUrl}/api/league/simulate-matchday`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: leagueSeason,
          matchday: nextMd,
          matches: fixturesList,
          custom_club_name: leagueCustomClubName.trim() || "Custom XI",
          replaced_club: leagueReplacedClub,
          custom_xi: leagueStartingXI,
          current_standings: leagueStandings,
          player_stats: playerStats,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to simulate matchday ${nextMd}`)
      }

      setLeagueMatchResults((prev) => ({
        ...prev,
        [nextMd]: data.results,
      }))
      setLeagueStandings(data.standings)
      setPlayerStats(data.player_stats)
      if (data.awards) {
        setLeagueAwards(data.awards)
      }
      setCurrentSimulatedMatchday(nextMd)
      setViewingMatchday(nextMd)
    } catch (err: any) {
      console.error(`Error simulating matchday ${nextMd}:`, err)
      setLeagueError(err.message || "Simulation request failed")
    } finally {
      setLeagueSimulating(false)
    }
  }

  const resetLeagueCampaign = () => {
    isAutoSimulatingRef.current = false
    setIsAutoSimulating(false)
    setLeagueSimulating(false)
    setLeagueSchedule([])
    setLeagueStandings([])
    setLeagueMatchResults({})
    setCurrentSimulatedMatchday(0)
    setViewingMatchday(1)
    setPlayerStats({
      goals: {},
      clean_sheets: {},
      mvp_points: {},
      player_meta: {},
    })
    setLeagueAwards(null)
    setLeagueInitialized(false)
    setLeagueError(null)
    setScreen("league-setup")
  }

  // -------------------------------------------------------------------------
  // SCREEN: LEAGUE DASHBOARD
  // -------------------------------------------------------------------------
  if (screen === "league-dashboard") {
    const customClubDisplayName = leagueCustomClubName.trim() || "Custom XI"
    const rawFixtures =
      viewingMatchday <= currentSimulatedMatchday
        ? leagueMatchResults[viewingMatchday] || []
        : ((leagueSchedule.find((s) => s.matchday === viewingMatchday)?.matches || leagueSchedule.find((s) => s.matchday === viewingMatchday)?.fixtures) || []).map((f: any) => ({
            home_team: f.home_team,
            away_team: f.away_team,
            home_score: null,
            away_score: null,
            home_xg: null,
            away_xg: null,
            home_scorers: [],
            away_scorers: [],
            motm: null,
            clean_sheet_home: false,
            clean_sheet_away: false,
          }))

    // Always display user's chosen custom team fixture first in each matchday, with the other fixtures afterward
    const currentFixtures = [...rawFixtures].sort((a: any, b: any) => {
      const aIsCustom = a.home_team === customClubDisplayName || a.away_team === customClubDisplayName
      const bIsCustom = b.home_team === customClubDisplayName || b.away_team === customClubDisplayName
      if (aIsCustom && !bIsCustom) return -1
      if (!aIsCustom && bIsCustom) return 1
      return 0
    })

    const isSeasonCompleted = currentSimulatedMatchday >= 38
    const championTeam = leagueStandings.length > 0 ? leagueStandings[0] : null
    const customTeamStanding = leagueStandings.find((t) => t.team === customClubDisplayName)

    const formatScorers = (
      rawScorers: any,
      teamName?: string,
      match?: any
    ): string[] | null => {
      if (!rawScorers) return null

      const cleanText = (val: any): string => {
        if (!val || typeof val !== "string") return ""
        const t = val.trim()
        if (t === "undefined" || t === "null" || t === "None" || t === "NaN") return ""
        return t
      }

      const cleanMin = (val: any): number | null => {
        if (val === null || val === undefined) return null
        if (typeof val === "string") {
          const numStr = val.replace(/[^0-9]/g, "")
          if (!numStr) return null
          const n = parseInt(numStr, 10)
          return isNaN(n) || n <= 0 || n > 120 ? null : n
        }
        if (typeof val === "number") {
          return !isNaN(val) && val > 0 && val <= 120 ? Math.round(val) : null
        }
        return null
      }

      const getCandidatePlayers = (): string[] => {
        if (!teamName) return []
        const candidates: string[] = []

        // 1. MOTM player if playing for this team
        if (match?.motm?.team === teamName && cleanText(match.motm.player)) {
          candidates.push(cleanText(match.motm.player))
        }

        // 2. Cumulative scorers for this team from playerStats
        Object.entries(playerStats.goals || {}).forEach(([key, goals]) => {
          if (goals > 0) {
            const meta = playerStats.player_meta?.[key]
            if (meta?.team === teamName && cleanText(meta.player)) {
              const p = cleanText(meta.player)
              if (!candidates.includes(p)) candidates.push(p)
            }
          }
        })

        // 3. Custom squad forwards & midfielders if custom club
        if (teamName === customClubDisplayName && leagueStartingXI.length > 0) {
          const priorityGroups = ["FWD", "MID", "DEF"]
          priorityGroups.forEach((grp) => {
            leagueStartingXI
              .filter((p) => p.position_group === grp && cleanText(p.Player))
              .forEach((p) => {
                const name = cleanText(p.Player)
                if (!candidates.includes(name)) candidates.push(name)
              })
          })
        }

        // 4. Historical roster from marketPlayers
        if (marketPlayers.length > 0) {
          const teamRoster = marketPlayers.filter((p) => p.Team === teamName && cleanText(p.Player))
          const fwds = teamRoster.filter((p) => p.position_group === "FWD")
          const mids = teamRoster.filter((p) => p.position_group === "MID")
          const defs = teamRoster.filter((p) => p.position_group === "DEF")
          ;[...fwds, ...mids, ...defs].forEach((p) => {
            const name = cleanText(p.Player)
            if (!candidates.includes(name)) candidates.push(name)
          })
        }

        return candidates
      }

      const teamCandidates = getCandidatePlayers()
      let candidateIdx = 0

      const entries: { player: string; minute: number | null }[] = []

      if (
        typeof rawScorers === "object" &&
        !Array.isArray(rawScorers) &&
        !("player" in rawScorers) &&
        !("Player" in rawScorers) &&
        !("name" in rawScorers) &&
        !("scorer" in rawScorers)
      ) {
        Object.entries(rawScorers).forEach(([rawName, val]) => {
          const pName = cleanText(rawName)
          if (!pName) return
          if (Array.isArray(val)) {
            val.forEach((m) => {
              entries.push({ player: pName, minute: cleanMin(m) })
            })
          } else if (typeof val === "number") {
            for (let i = 0; i < val; i++) {
              entries.push({ player: pName, minute: null })
            }
          } else {
            entries.push({ player: pName, minute: cleanMin(val) })
          }
        })
      } else {
        const list = Array.isArray(rawScorers) ? rawScorers : [rawScorers]

        list.forEach((item: any) => {
          if (item === null || item === undefined) return

          if (typeof item === "number") {
            const min = cleanMin(item)
            if (min !== null) {
              const assignedPlayer =
                teamCandidates.length > 0
                  ? teamCandidates[candidateIdx++ % teamCandidates.length]
                  : ""
              entries.push({ player: assignedPlayer, minute: min })
            }
            return
          }

          if (typeof item === "string") {
            const cleaned = cleanText(item)
            if (!cleaned) return

            const pureMin = cleanMin(cleaned)
            if (pureMin !== null && /^\d+['’]?$/.test(cleaned)) {
              const assignedPlayer =
                teamCandidates.length > 0
                  ? teamCandidates[candidateIdx++ % teamCandidates.length]
                  : ""
              entries.push({ player: assignedPlayer, minute: pureMin })
              return
            }

            const matchPattern = cleaned.match(/^(.*?)(?:\s*\(?(\d+)['’]?\)?)?$/)
            if (matchPattern) {
              const parsedName = cleanText(matchPattern[1])
              const parsedMin = cleanMin(matchPattern[2])
              if (parsedName || parsedMin !== null) {
                entries.push({
                  player: parsedName || (teamCandidates.length > 0 ? teamCandidates[candidateIdx++ % teamCandidates.length] : ""),
                  minute: parsedMin,
                })
                return
              }
            }

            entries.push({ player: cleaned, minute: null })
            return
          }

          if (typeof item === "object") {
            const playerName = cleanText(
              item.player ??
              item.Player ??
              item.name ??
              item.Name ??
              item.scorer ??
              item.Scorer ??
              item.playerName ??
              item.player_name ??
              item.scorerName ??
              item.scorer_name
            )

            const minute = cleanMin(
              item.minute ??
              item.Minute ??
              item.min ??
              item.Min ??
              item.time ??
              item.Time ??
              item.goal_minute ??
              item.goalMinute ??
              item.m
            )

            const finalPlayer =
              playerName ||
              (teamCandidates.length > 0 && minute !== null
                ? teamCandidates[candidateIdx++ % teamCandidates.length]
                : "")

            if (finalPlayer || minute !== null) {
              entries.push({ player: finalPlayer, minute })
            }
          }
        })
      }

      if (entries.length === 0) return null

      const grouped: Record<string, number[]> = {}
      const minutesWithoutPlayer: number[] = []

      entries.forEach(({ player, minute }) => {
        if (player) {
          if (!grouped[player]) grouped[player] = []
          if (minute !== null && !grouped[player].includes(minute)) {
            grouped[player].push(minute)
          }
        } else if (minute !== null) {
          if (!minutesWithoutPlayer.includes(minute)) {
            minutesWithoutPlayer.push(minute)
          }
        }
      })

      const resultLines: string[] = []

      Object.entries(grouped).forEach(([player, mins]) => {
        if (!player || player === "undefined") return
        if (mins.length > 0) {
          const sortedMins = mins.sort((a, b) => a - b).map((m) => `${m}'`).join(", ")
          resultLines.push(`${player} ${sortedMins}`)
        } else {
          resultLines.push(player)
        }
      })

      minutesWithoutPlayer.sort((a, b) => a - b).forEach((m) => {
        resultLines.push(`${m}'`)
      })

      return resultLines.length > 0 ? resultLines : null
    }

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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setScreen("league-squad")}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:border-[#38BDF8] hover:text-[#38BDF8]"
            >
              Review Squad
            </button>
            <button
              onClick={resetLeagueCampaign}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs font-semibold text-white/60 transition hover:border-rose-500/40 hover:text-rose-400"
              title="Reset campaign and start over"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </nav>

        <section className="relative min-h-[calc(100vh-80px)] px-6 py-10 lg:px-12">
          <div className="mx-auto max-w-7xl">
            {/* Top Campaign Bar */}
            <div className="mb-8 rounded-3xl border border-white/10 bg-[#0a1b31]/90 p-6 backdrop-blur shadow-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#38BDF8]">
                    <span>PREMIER LEAGUE {leagueSeason}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/60">{difficultyDisplay} Difficulty</span>
                  </div>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {customClubDisplayName}
                  </h1>
                  <p className="mt-1 text-xs text-white/50">
                    Taking the place of <span className="font-bold text-white/80">{leagueReplacedClub}</span> in the 20-team Barclays Premier League calendar
                  </p>
                </div>

                {/* Starting XI strength matrix */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-white/40">OVR</p>
                    <p className="text-base font-black text-[#38BDF8]">{overallRating}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-white/40">ATT</p>
                    <p className="text-base font-black text-rose-400">{attackRating}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-white/40">MID</p>
                    <p className="text-base font-black text-amber-400">{midfieldRating}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-white/40">DEF</p>
                    <p className="text-base font-black text-blue-400">{defenceRating}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-white/40">GK</p>
                    <p className="text-base font-black text-emerald-400">{gkRating}</p>
                  </div>
                </div>
              </div>

              {/* Progress & Simulate Matchday Action */}
              <div className="mt-6 border-t border-white/10 pt-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 pr-0 sm:pr-8">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-white/60">
                          Season Progress
                        </span>
                        {isAutoSimulating && (
                          <span className="flex items-center gap-1.5 rounded-full bg-[#38BDF8]/15 px-2.5 py-0.5 text-[10px] font-black text-[#38BDF8] animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
                            LIVE SIMULATION
                          </span>
                        )}
                      </div>
                      <span className="font-black text-[#38BDF8]">
                        MATCHDAY {currentSimulatedMatchday} / 38
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-blue-500 transition-all duration-500"
                        style={{ width: `${(currentSimulatedMatchday / 38) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions: SIMULATE SEASON / PAUSE / RESUME / SPEED */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Speed Controls (shown whenever not completed) */}
                    {!isSeasonCompleted && (
                      <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1 text-xs">
                        <button
                          onClick={() => toggleSimSpeed("1x")}
                          className={`rounded-lg px-2.5 py-1.5 font-black transition ${
                            simSpeed === "1x"
                              ? "bg-[#38BDF8] text-black shadow"
                              : "text-white/60 hover:text-white"
                          }`}
                          title="Normal Speed (~800ms delay)"
                        >
                          1x
                        </button>
                        <button
                          onClick={() => toggleSimSpeed("2x")}
                          className={`rounded-lg px-2.5 py-1.5 font-black transition ${
                            simSpeed === "2x"
                              ? "bg-[#38BDF8] text-black shadow"
                              : "text-white/60 hover:text-white"
                          }`}
                          title="Fast Speed (~350ms delay)"
                        >
                          2x
                        </button>
                      </div>
                    )}

                    {!isSeasonCompleted ? (
                      isAutoSimulating ? (
                        <button
                          onClick={handlePauseAutoSimulation}
                          className="flex items-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-400/20 px-6 py-3 font-black text-amber-300 shadow-lg shadow-amber-400/10 transition hover:bg-amber-400/30 active:scale-95"
                        >
                          <Pause size={18} className="shrink-0" />
                          <span>PAUSE SEASON</span>
                        </button>
                      ) : currentSimulatedMatchday > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={leagueSimulating || leagueInitLoading || !leagueInitialized}
                            onClick={handleStartAutoSimulation}
                            className="group flex items-center justify-center gap-2.5 rounded-xl bg-[#38BDF8] px-6 py-3 font-black text-[#000000] shadow-lg shadow-[#38BDF8]/20 transition hover:scale-[1.02] hover:bg-[#38BDF8] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Play size={18} className="fill-black shrink-0" />
                            <span>RESUME SEASON</span>
                          </button>
                          <button
                            disabled={leagueSimulating || leagueInitLoading || !leagueInitialized}
                            onClick={handleSimulateSingleMatchday}
                            className="rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-xs font-black text-white/80 transition hover:border-white/40 hover:text-white disabled:opacity-40"
                            title="Simulate just the next matchday"
                          >
                            +1 MD
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={leagueSimulating || leagueInitLoading || !leagueInitialized}
                          onClick={handleStartAutoSimulation}
                          className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#38BDF8] px-8 py-3.5 font-black text-[#000000] shadow-lg shadow-[#38BDF8]/20 transition hover:scale-[1.02] hover:bg-[#38BDF8] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:w-auto"
                        >
                          <Play size={18} className="fill-black shrink-0" />
                          <span>SIMULATE SEASON</span>
                        </button>
                      )
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-6 py-3 font-black text-amber-300">
                        <Trophy size={18} />
                        <span>38 / 38 MATCHDAYS COMPLETE</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {leagueError && (
              <div className="mb-8 flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">{leagueError}</p>
                </div>
                <button
                  onClick={() => {
                    setLeagueError(null)
                    if (!leagueInitialized) initLeagueSeason()
                  }}
                  className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-bold transition hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Season Initializing Loader */}
            {leagueInitLoading && (
              <div className="my-16 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#38BDF8] border-t-transparent" />
                <h3 className="mt-6 text-xl font-black">GENERATING LEAGUE FIXTURES...</h3>
                <p className="mt-2 text-xs text-white/50">
                  Building full 38-match double round-robin calendar for 20 teams.
                </p>
              </div>
            )}

            {/* End of Season Awards Banner */}
            {isSeasonCompleted && championTeam && (
              <div className="mb-10 rounded-3xl border border-amber-400/30 bg-gradient-to-b from-amber-950/40 via-[#0a1b31]/95 to-[#0a1b31]/95 p-8 backdrop-blur shadow-2xl">
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                    <Trophy size={34} />
                  </div>
                  <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {championTeam.team === customClubDisplayName ? (
                      <span className="text-amber-300">CHAMPIONS OF ENGLAND! 🏆</span>
                    ) : (
                      <span>{championTeam.team} WINS THE TITLE</span>
                    )}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-white/70">
                    {championTeam.team === customClubDisplayName
                      ? `Incredible achievement! You guided ${customClubDisplayName} to Premier League glory with ${championTeam.points} points!`
                      : `${championTeam.team} secured the ${leagueSeason} Premier League title with ${championTeam.points} points.`}
                  </p>
                  {customTeamStanding && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/40 px-5 py-2.5 text-xs">
                      <span className="text-white/60">Your Club Finish: </span>
                      <span className="font-black text-[#38BDF8]">
                        #{customTeamStanding.rank} ({customTeamStanding.won}W - {customTeamStanding.drawn}D - {customTeamStanding.lost}L · {customTeamStanding.points} Pts · GD {customTeamStanding.gd > 0 ? `+${customTeamStanding.gd}` : customTeamStanding.gd})
                      </span>
                    </div>
                  )}
                </div>

                {/* Official Awards Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Golden Boot */}
                  <div className="rounded-2xl border border-amber-400/20 bg-black/40 p-5 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                      <Award size={20} />
                    </div>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-amber-300/80">
                      Golden Boot
                    </p>
                    {leagueAwards?.golden_boot && leagueAwards.golden_boot.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {leagueAwards.golden_boot.map((w, idx) => (
                          <div key={idx}>
                            <p className="text-base font-black text-white">{w.player}</p>
                            <p className="text-xs text-white/50">{w.team}</p>
                            <p className="mt-1 text-sm font-black text-amber-300">{w.goals} Goals</p>
                          </div>
                        ))}
                        {leagueAwards.golden_boot.length > 1 && (
                          <span className="inline-block rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            Tied Winners
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-white/40">No goals recorded</p>
                    )}
                  </div>

                  {/* Golden Glove */}
                  <div className="rounded-2xl border border-blue-400/20 bg-black/40 p-5 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
                      <Shield size={20} />
                    </div>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-blue-300/80">
                      Golden Glove
                    </p>
                    {leagueAwards?.golden_glove && leagueAwards.golden_glove.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {leagueAwards.golden_glove.map((w, idx) => (
                          <div key={idx}>
                            <p className="text-base font-black text-white">{w.player}</p>
                            <p className="text-xs text-white/50">{w.team}</p>
                            <p className="mt-1 text-sm font-black text-blue-300">{w.clean_sheets} Clean Sheets</p>
                          </div>
                        ))}
                        {leagueAwards.golden_glove.length > 1 && (
                          <span className="inline-block rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                            Tied Winners
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-white/40">No clean sheets recorded</p>
                    )}
                  </div>

                  {/* Season MVP */}
                  <div className="rounded-2xl border border-purple-400/20 bg-black/40 p-5 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10 text-purple-300">
                      <Medal size={20} />
                    </div>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-purple-300/80">
                      Season MVP
                    </p>
                    {leagueAwards?.season_mvp && leagueAwards.season_mvp.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {leagueAwards.season_mvp.map((w, idx) => (
                          <div key={idx}>
                            <p className="text-base font-black text-white">{w.player}</p>
                            <p className="text-xs text-white/50">{w.team}</p>
                            <p className="mt-1 text-sm font-black text-purple-300">{w.mvp_points.toFixed(1)} MVP Pts</p>
                          </div>
                        ))}
                        {leagueAwards.season_mvp.length > 1 && (
                          <span className="inline-block rounded-full bg-purple-400/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                            Tied Winners
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-white/40">No MVP calculated</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main 2-Column Dashboard Grid */}
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left Column: Matchday Fixtures (7 cols) */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-white/10 bg-[#0a1b31]/80 p-6 backdrop-blur">
                  {/* Matchday Navigator */}
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <button
                        disabled={viewingMatchday <= 1}
                        onClick={() => setViewingMatchday((prev) => Math.max(1, prev - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white transition hover:border-white/30 disabled:opacity-30 disabled:hover:border-white/10"
                        title="Previous Matchday"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <div className="relative">
                        <select
                          value={viewingMatchday}
                          onChange={(e) => setViewingMatchday(Number(e.target.value))}
                          className="appearance-none rounded-xl border border-white/20 bg-black/50 py-2 pl-4 pr-9 text-xs font-black text-white outline-none transition focus:border-[#38BDF8]"
                        >
                          {Array.from({ length: 38 }, (_, i) => i + 1).map((md) => (
                            <option key={md} value={md} className="bg-[#141414] text-white">
                              Matchday {md} {md <= currentSimulatedMatchday ? "✓ (Played)" : "⏳ (Upcoming)"}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                        />
                      </div>

                      <button
                        disabled={viewingMatchday >= 38}
                        onClick={() => setViewingMatchday((prev) => Math.min(38, prev + 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white transition hover:border-white/30 disabled:opacity-30 disabled:hover:border-white/10"
                        title="Next Matchday"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {viewingMatchday <= currentSimulatedMatchday ? (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-black text-emerald-400">
                          ● SIMULATED
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-black text-amber-400">
                          ○ UPCOMING
                        </span>
                      )}

                      {currentSimulatedMatchday > 0 && viewingMatchday !== currentSimulatedMatchday && (
                        <button
                          onClick={() => setViewingMatchday(currentSimulatedMatchday)}
                          className="rounded-xl border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 text-[11px] font-bold text-[#38BDF8] transition hover:bg-[#38BDF8]/20"
                        >
                          Latest MD
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Matches List */}
                  <div className="space-y-3.5">
                    {currentFixtures.length === 0 ? (
                      <div className="py-12 text-center text-xs text-white/40">
                        No matches found for matchday {viewingMatchday}.
                      </div>
                    ) : (
                      currentFixtures.map((m: any, idx: number) => {
                        const isCustomMatch =
                          m.home_team === customClubDisplayName ||
                          m.away_team === customClubDisplayName

                        const isPlayed = m.home_score !== null && m.away_score !== null
                        const homeScorersText = formatScorers(m.home_scorers, m.home_team, m)
                        const awayScorersText = formatScorers(m.away_scorers, m.away_team, m)

                        return (
                          <div
                            key={`${viewingMatchday}-${idx}`}
                            style={{ animationDelay: isPlayed ? `${idx * 35}ms` : undefined }}
                            className={`rounded-2xl border p-4 transition-all duration-300 ${
                              isPlayed ? "animate-card-reveal" : ""
                            } ${
                              isCustomMatch
                                ? `border-[#38BDF8] bg-[#0d2745]/90 shadow-md shadow-[#38BDF8]/10 ${
                                    isAutoSimulating ? "ring-2 ring-[#38BDF8]/60 shadow-lg shadow-[#38BDF8]/20" : ""
                                  }`
                                : "border-white/10 bg-black/30 hover:border-white/20"
                            }`}
                          >
                            {/* Match Header with Custom Badge */}
                            {isCustomMatch && (
                              <div className="mb-2 flex items-center justify-between">
                                <span className="rounded-md bg-[#38BDF8] px-2 py-0.5 text-[9px] font-black text-black">
                                  ★ YOUR MATCH
                                </span>
                                {isPlayed && m.home_xg !== null && m.away_xg !== null && (
                                  <span className="text-[10px] text-white/50">
                                    xG: {m.home_xg.toFixed(2)} - {m.away_xg.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Scoreline / Teams */}
                            <div className="grid grid-cols-12 items-center gap-2">
                              {/* Home team */}
                              <div className="col-span-5 text-right">
                                <span
                                  className={`text-sm font-black truncate block ${
                                    m.home_team === customClubDisplayName
                                      ? "text-[#38BDF8]"
                                      : "text-white"
                                  }`}
                                  title={m.home_team}
                                >
                                  {m.home_team}
                                </span>
                              </div>

                              {/* Score or VS */}
                              <div className="col-span-2 text-center">
                                {isPlayed ? (
                                  <span
                                    style={{ animationDelay: `${idx * 35 + 80}ms` }}
                                    className="inline-block animate-score-pop rounded-lg bg-black/60 px-3 py-1 text-base font-black tracking-wider text-white border border-white/10"
                                  >
                                    {m.home_score} - {m.away_score}
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-white/30">VS</span>
                                )}
                              </div>

                              {/* Away team */}
                              <div className="col-span-5 text-left">
                                <span
                                  className={`text-sm font-black truncate block ${
                                    m.away_team === customClubDisplayName
                                      ? "text-[#38BDF8]"
                                      : "text-white"
                                  }`}
                                  title={m.away_team}
                                >
                                  {m.away_team}
                                </span>
                              </div>
                            </div>

                            {/* Scorers info (if played) */}
                            {isPlayed && (
                              <div
                                style={{ animationDelay: `${idx * 35 + 140}ms` }}
                                className="animate-scorer-fade mt-3 border-t border-white/5 pt-2.5 text-[11px] text-white/60"
                              >
                                {(homeScorersText || awayScorersText) ? (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="text-right text-emerald-400">
                                      {homeScorersText?.map((txt, sIdx) => (
                                        <div key={sIdx} className="truncate">⚽ {txt}</div>
                                      ))}
                                    </div>
                                    <div className="text-left text-emerald-400">
                                      {awayScorersText?.map((txt, sIdx) => (
                                        <div key={sIdx} className="truncate">⚽ {txt}</div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-[10px] text-white/30">
                                    No goals scored
                                  </div>
                                )}

                                {/* MOTM & Clean sheets */}
                                {m.motm && (
                                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-1.5 text-[10px]">
                                    <span className="text-amber-300 font-bold truncate">
                                      ★ MOTM: {m.motm.player} ({m.motm.team}) · {m.motm.rating}
                                    </span>
                                    <div className="flex gap-2">
                                      {m.clean_sheet_home && (
                                        <span className="text-blue-300">🛡️ CS: {m.home_team}</span>
                                      )}
                                      {m.clean_sheet_away && (
                                        <span className="text-blue-300">🛡️ CS: {m.away_team}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Upcoming fixture notice */}
                            {!isPlayed && (
                              <div className="mt-2 text-center text-[10px] text-white/30">
                                Scheduled Matchday {viewingMatchday}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Standings & Leaderboards (5 cols) */}
              <div className="lg:col-span-5">
                <div className="sticky top-6 rounded-3xl border border-white/10 bg-[#0a1b31]/80 p-6 backdrop-blur">
                  {/* Tabs */}
                  <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl bg-black/40 p-1">
                    <button
                      onClick={() => setDashboardTab("table")}
                      className={`rounded-lg py-2 text-xs font-black transition ${
                        dashboardTab === "table"
                          ? "bg-[#38BDF8] text-black shadow"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      TABLE
                    </button>
                    <button
                      onClick={() => setDashboardTab("scorers")}
                      className={`rounded-lg py-2 text-xs font-black transition ${
                        dashboardTab === "scorers"
                          ? "bg-[#38BDF8] text-black shadow"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      SCORERS
                    </button>
                    <button
                      onClick={() => setDashboardTab("cleansheets")}
                      className={`rounded-lg py-2 text-xs font-black transition ${
                        dashboardTab === "cleansheets"
                          ? "bg-[#38BDF8] text-black shadow"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      GLOVES
                    </button>
                    <button
                      onClick={() => setDashboardTab("mvp")}
                      className={`rounded-lg py-2 text-xs font-black transition ${
                        dashboardTab === "mvp"
                          ? "bg-[#38BDF8] text-black shadow"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      MVP
                    </button>
                  </div>

                  {/* TAB 1: League Table */}
                  {dashboardTab === "table" && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/40">
                              <th className="py-2 pl-2">#</th>
                              <th className="py-2">Club</th>
                              <th className="py-2 text-center">P</th>
                              <th className="py-2 text-center">W</th>
                              <th className="py-2 text-center">D</th>
                              <th className="py-2 text-center">L</th>
                              <th className="py-2 text-center">GD</th>
                              <th className="py-2 pr-2 text-right">PTS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {leagueStandings.map((row) => {
                              const isCustom = row.team === customClubDisplayName
                              const isTop4 = row.rank <= 4
                              const isFifth = row.rank === 5
                              const isRelegation = row.rank >= 18

                              return (
                                <tr
                                  key={row.team}
                                  className={`transition ${
                                    isCustom
                                      ? "bg-[#38BDF8]/20 font-black text-white"
                                      : "hover:bg-white/5 text-white/80"
                                  }`}
                                >
                                  <td className="py-2 pl-2 font-bold">
                                    <span
                                      className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] ${
                                        isTop4
                                          ? "bg-blue-500/20 text-blue-300 font-black"
                                          : isFifth
                                            ? "bg-amber-500/20 text-amber-300 font-bold"
                                            : isRelegation
                                              ? "bg-rose-500/20 text-rose-300 font-bold"
                                              : "text-white/50"
                                      }`}
                                    >
                                      {row.rank}
                                    </span>
                                  </td>
                                  <td className="py-2 truncate max-w-[130px]" title={row.team}>
                                    <span className={isCustom ? "text-[#38BDF8]" : ""}>
                                      {row.team}
                                    </span>
                                    {isCustom && (
                                      <span className="ml-1 text-[9px] font-black text-[#38BDF8]">
                                        (YOU)
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 text-center text-white/50">{row.played}</td>
                                  <td className="py-2 text-center text-white/60">{row.won}</td>
                                  <td className="py-2 text-center text-white/40">{row.drawn}</td>
                                  <td className="py-2 text-center text-white/40">{row.lost}</td>
                                  <td className="py-2 text-center font-bold text-white/70">
                                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                                  </td>
                                  <td className="py-2 pr-2 text-right font-black text-white">
                                    {row.points}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Standings Legend */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px] text-white/40">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-400" />
                          <span>1-4 Champions League</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <span>5 Europa League</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-rose-400" />
                          <span>18-20 Relegation</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Top Scorers */}
                  {dashboardTab === "scorers" && (
                    <div>
                      <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                        <span>Golden Boot Race</span>
                        <span>Goals</span>
                      </div>
                      {topScorersList.length === 0 ? (
                        <div className="py-12 text-center text-xs text-white/40">
                          No goals simulated yet.
                        </div>
                      ) : (
                        <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
                          {topScorersList.map((p, idx) => {
                            const isCustomPlayer = p.team === customClubDisplayName
                            return (
                              <div
                                key={p.key}
                                className={`flex items-center justify-between rounded-xl border p-2.5 transition ${
                                  isCustomPlayer
                                    ? "border-[#38BDF8] bg-[#38BDF8]/15"
                                    : "border-white/5 bg-black/30 hover:border-white/15"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-black/50 text-[10px] font-black text-white/70">
                                    {idx + 1}
                                  </span>
                                  <div className="overflow-hidden">
                                    <p className={`truncate text-xs font-black ${isCustomPlayer ? "text-[#38BDF8]" : "text-white"}`}>
                                      {p.player}
                                    </p>
                                    <p className="truncate text-[10px] text-white/40">
                                      {p.team} · {p.position_group}
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 text-sm font-black text-amber-300">
                                  {p.goals}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Clean Sheets */}
                  {dashboardTab === "cleansheets" && (
                    <div>
                      <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-300">
                        <span>Golden Glove Race</span>
                        <span>Clean Sheets</span>
                      </div>
                      {topCleanSheetsList.length === 0 ? (
                        <div className="py-12 text-center text-xs text-white/40">
                          No clean sheets simulated yet.
                        </div>
                      ) : (
                        <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
                          {topCleanSheetsList.map((p, idx) => {
                            const isCustomGK = p.team === customClubDisplayName
                            return (
                              <div
                                key={p.key}
                                className={`flex items-center justify-between rounded-xl border p-2.5 transition ${
                                  isCustomGK
                                    ? "border-[#38BDF8] bg-[#38BDF8]/15"
                                    : "border-white/5 bg-black/30 hover:border-white/15"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-black/50 text-[10px] font-black text-white/70">
                                    {idx + 1}
                                  </span>
                                  <div className="overflow-hidden">
                                    <p className={`truncate text-xs font-black ${isCustomGK ? "text-[#38BDF8]" : "text-white"}`}>
                                      {p.player}
                                    </p>
                                    <p className="truncate text-[10px] text-white/40">{p.team}</p>
                                  </div>
                                </div>
                                <span className="shrink-0 text-sm font-black text-blue-300">
                                  {p.clean_sheets}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: MVP Race */}
                  {dashboardTab === "mvp" && (
                    <div>
                      <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-300">
                        <span>Season MVP Race</span>
                        <span>MVP Points</span>
                      </div>
                      {topMvpList.length === 0 ? (
                        <div className="py-12 text-center text-xs text-white/40">
                          No MVP points recorded yet.
                        </div>
                      ) : (
                        <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
                          {topMvpList.map((p, idx) => {
                            const isCustomPlayer = p.team === customClubDisplayName
                            return (
                              <div
                                key={p.key}
                                className={`flex items-center justify-between rounded-xl border p-2.5 transition ${
                                  isCustomPlayer
                                    ? "border-[#38BDF8] bg-[#38BDF8]/15"
                                    : "border-white/5 bg-black/30 hover:border-white/15"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-black/50 text-[10px] font-black text-white/70">
                                    {idx + 1}
                                  </span>
                                  <div className="overflow-hidden">
                                    <p className={`truncate text-xs font-black ${isCustomPlayer ? "text-[#38BDF8]" : "text-white"}`}>
                                      {p.player}
                                    </p>
                                    <p className="truncate text-[10px] text-white/40">
                                      {p.team} · {p.position_group} ({p.goals}G, {p.clean_sheets}CS)
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 text-sm font-black text-purple-300">
                                  {p.mvp_points.toFixed(1)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                        setLeagueReplacedClub("")
                        setLeagueStartingXI([])
                        setLeagueInitialized(false)
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

              {/* 2. Club to Replace */}
              <div className="mb-8">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                  CLUB TO REPLACE <span className="text-[#38BDF8]">*</span>
                </label>

                <div className="relative">
                  <select
                    value={leagueReplacedClub}
                    disabled={!leagueSeason}
                    onChange={(e) => {
                      setLeagueReplacedClub(e.target.value)
                      setLeagueInitialized(false)
                    }}
                    className="w-full appearance-none rounded-xl border border-white bg-grey text-[#FFFFFF] px-5 py-4 outline-none transition focus:border-[#38BDF8] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled className="bg-[#141414] text-white">
                      {leagueSeason ? "SELECT CLUB TO REPLACE (20 TEAMS)" : "SELECT A SEASON FIRST"}
                    </option>

                    {seasonTeams.map((team) => (
                      <option key={team} value={team} className="bg-[#141414] text-white">
                        {team}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-white/60"
                  />
                </div>
                <p className="mt-2 text-xs text-white/40">
                  Your custom XI replaces this club in the 20-team fixture schedule for the 38-match season.
                </p>
              </div>

              {/* 3. Custom Club Name */}
              <div className="mb-8">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/70">
                  CUSTOM CLUB NAME (OPTIONAL)
                </label>

                <input
                  type="text"
                  maxLength={30}
                  value={leagueCustomClubName}
                  onChange={(e) => setLeagueCustomClubName(e.target.value)}
                  placeholder="e.g. Invincibles XI, London Stars, Custom XI"
                  className="w-full rounded-xl border border-white/20 bg-[#141414]/80 px-5 py-4 text-white placeholder-white/30 outline-none transition focus:border-[#38BDF8]"
                />
                <p className="mt-2 text-xs text-white/40">
                  This custom club name will appear across the league table and matchday scoreboards.
                </p>
              </div>

              {/* 4. Difficulty */}
              <div className="mb-10">
                <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-white/70">
                  DIFFICULTY
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      { id: "easy", name: "EASY", budget: "£250m", label: "Easy — £250m" },
                      { id: "medium", name: "MEDIUM", budget: "£200m", label: "Medium — £200m" },
                      { id: "hard", name: "HARD", budget: "£100m", label: "Hard — £100m" },
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

              {/* 5. Continue button */}
              <div className="flex justify-end pt-2">
                <button
                  disabled={!leagueSeason || !leagueDifficulty || !leagueReplacedClub}
                  onClick={() => {
                    if (leagueSeason && leagueDifficulty && leagueReplacedClub) {
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