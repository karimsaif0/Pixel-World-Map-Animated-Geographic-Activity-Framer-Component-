/**
 * Made with 💛 by Karim Saif
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
"use client"
import * as React from "react"
import {
    addPropertyControls,
    ControlType,
    useIsStaticRenderer,
    useReducedMotion,
} from "framer"
const MAP_ROWS = [
    "000003f7ffe01c0000500000",
    "000065e0ffe00001c1fc0400",
    "0003f6f07fc0000227ffff00",
    "0fffff5c3fc00fc3ffffffff",
    "ffffffde3e301fffffffffff",
    "0fffff3418003bffffffffff",
    "0f7ffe1c00007bffffffff98",
    "0407ff9f000337fffffff820",
    "0007ffdf80077ffffffffc60",
    "0003ffff8001fffffffffe00",
    "0001ffffc001fffffffff800",
    "0001fffe0003ff3ffffff200",
    "0001fff800072ffbffffe400",
    "0001fff0000301fbffff2400",
    "0000fff00003e07fffff1800",
    "00007fe00007ffffffff8000",
    "00003c200007fffbffff0000",
    "00001c20000fffbcffff0000",
    "00000ce0001fffff3ffe0000",
    "00000f84001fffde1e700000",
    "000003c0001ffffc0c788000",
    "00000040001ffff00c380000",
    "0000005f000ffffc08014000",
    "0000001fc007fff804200000",
    "0000001fe0003ff800330000",
    "0000003fe0003fe000378000",
    "0000003ffc001fe000129c80",
    "0000003ffe001fe0000c0600",
    "0000001ffe001fe000010100",
    "0000001ffc001fe000001000",
    "0000000ffc001fec00007a00",
    "00000007fc001fc80000fe00",
    "00000007f8000fd80001ff00",
    "00000007e0000f800003ff80",
    "00000007e0000f800003ff80",
    "00000007c00007000001ff80",
    "00000007c000060000018700",
    "0000000f8000000000000701",
    "0000000e0000000000000002",
    "0000000e0000000000000004",
    "0000000c0000000000000000",
    "0000000c0000000000000000",
    "0000000c0000000000000000",
]
const MAP_COLUMNS = 96
const MAP_HEIGHT = MAP_ROWS.length
const MAP_TOP_LAT = 80
const MAP_BOTTOM_LAT = -55
const MAX_DPR = 2
const MAX_PIXELS = 4194304
const MAX_PINGS = 500
const LAND = MAP_ROWS.map((row) =>
    Array.from({ length: MAP_COLUMNS }, (_, column) => {
        const digit = parseInt(row[column >> 2] || "0", 16)
        return (digit >> (3 - (column & 3))) & 1
    })
)
function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}
function safeNumber(value: number, fallback: number) {
    return Number.isFinite(value) ? value : fallback
}
function wrap(value: number, max: number) {
    return ((value % max) + max) % max
}
function hash(value: number) {
    const n = Math.sin(value * 127.1 + 78.233) * 43758.5453
    return n - Math.floor(n)
}
function shade(column: number, row: number) {
    return 0.75 + 0.25 * hash(column * 19.7 + row * 41.3)
}
function longitudeToColumn(longitude: number) {
    return ((longitude + 180) / 360) * MAP_COLUMNS
}
function latitudeToRow(latitude: number) {
    return (
        ((MAP_TOP_LAT - latitude) / (MAP_TOP_LAT - MAP_BOTTOM_LAT)) * MAP_HEIGHT
    )
}
function columnToLongitude(column: number) {
    return (column / MAP_COLUMNS) * 360 - 180
}
function rowToLatitude(row: number) {
    return (
        MAP_TOP_LAT -
        ((row + 0.5) / MAP_HEIGHT) * (MAP_TOP_LAT - MAP_BOTTOM_LAT)
    )
}
type MapView =
    | "world"
    | "north-america"
    | "south-america"
    | "europe"
    | "africa"
    | "asia"
    | "middle-east"
    | "oceania"
    | "custom"
type StartPosition =
    | "auto"
    | "new-york"
    | "london"
    | "cairo"
    | "dubai"
    | "tokyo"
    | "sydney"
    | "custom"
type Preset = "ember" | "ocean" | "neon" | "minimal" | "custom"
type Region = {
    latitude: number
    longitude: number
    west: number
    east: number
    south: number
    north: number
    zoom: number
}
type LandCell = {
    column: number
    row: number
    alpha: number
}
type Ping = {
    column: number
    row: number
    born: number
    life: number
}
interface Props {
    mapView: MapView
    startPosition: StartPosition
    latitude: number
    longitude: number
    columns: number
    autoZoom: boolean
    customRadius: number
    scrolling: boolean
    lockRegion: boolean
    preset: Preset
    pingColor: string
    landColor: string
    backgroundColor: string
    density: number
    speed: number
    squareSize: number
    landOpacity: number
    pingLifetime: number
    rippleSize: number
    rippleOpacity: number
    showRipples: boolean
    paused: boolean
    style?: React.CSSProperties
}
const REGIONS: Record<Exclude<MapView, "custom">, Region> = {
    world: {
        latitude: 12,
        longitude: 0,
        west: -180,
        east: 180,
        south: -55,
        north: 80,
        zoom: 49,
    },
    "north-america": {
        latitude: 42,
        longitude: -102,
        west: -170,
        east: -50,
        south: 7,
        north: 75,
        zoom: 38,
    },
    "south-america": {
        latitude: -17,
        longitude: -62,
        west: -85,
        east: -30,
        south: -55,
        north: 15,
        zoom: 30,
    },
    europe: {
        latitude: 51,
        longitude: 15,
        west: -12,
        east: 45,
        south: 34,
        north: 72,
        zoom: 27,
    },
    africa: {
        latitude: 2,
        longitude: 20,
        west: -20,
        east: 55,
        south: -36,
        north: 38,
        zoom: 33,
    },
    asia: {
        latitude: 37,
        longitude: 98,
        west: 25,
        east: 180,
        south: -10,
        north: 80,
        zoom: 43,
    },
    "middle-east": {
        latitude: 29,
        longitude: 43,
        west: 25,
        east: 65,
        south: 12,
        north: 43,
        zoom: 23,
    },
    oceania: {
        latitude: -23,
        longitude: 143,
        west: 110,
        east: 180,
        south: -50,
        north: 5,
        zoom: 32,
    },
}
const STARTS: Record<
    Exclude<StartPosition, "auto" | "custom">,
    { latitude: number; longitude: number }
> = {
    "new-york": { latitude: 40.71, longitude: -74.01 },
    london: { latitude: 51.51, longitude: -0.13 },
    cairo: { latitude: 30.04, longitude: 31.24 },
    dubai: { latitude: 25.2, longitude: 55.27 },
    tokyo: { latitude: 35.68, longitude: 139.69 },
    sydney: { latitude: -33.87, longitude: 151.21 },
}
const PRESETS: Record<
    Exclude<Preset, "custom">,
    { ping: string; land: string; background: string }
> = {
    ember: {
        ping: "#F2762E",
        land: "#3D3A37",
        background: "#1F1D1C",
    },
    ocean: {
        ping: "#42D9FF",
        land: "#24435B",
        background: "#091824",
    },
    neon: {
        ping: "#B8FF65",
        land: "#344538",
        background: "#101810",
    },
    minimal: {
        ping: "#FFFFFF",
        land: "#454545",
        background: "#141414",
    },
}
type Bounds = {
    west: number
    east: number
    south: number
    north: number
}
type Scene = {
    cell: number
    cx: number
    cy: number
    bounds: Bounds | null
    minX: number
    maxX: number
    minY: number
    maxY: number
}
function makeScene(
    w: number,
    h: number,
    zoom: number,
    start: { latitude: number; longitude: number },
    bounds: Bounds | null,
    locked: boolean
): Scene {
    const cell = Math.max(0.01, w / zoom)
    const halfX = w / (2 * cell)
    const halfY = h / (2 * cell)
    let cx = longitudeToColumn(start.longitude)
    let cy = latitudeToRow(start.latitude)
    let minX = -Infinity
    let maxX = Infinity
    let minY = -Infinity
    let maxY = Infinity
    if (locked && bounds) {
        const west = longitudeToColumn(bounds.west)
        const east = longitudeToColumn(bounds.east)
        const north = latitudeToRow(bounds.north)
        const south = latitudeToRow(bounds.south)
        minX = west + halfX
        maxX = east - halfX
        minY = north + halfY
        maxY = south - halfY
        cx = maxX < minX ? (west + east) / 2 : clamp(cx, minX, maxX)
        cy = maxY < minY ? (north + south) / 2 : clamp(cy, minY, maxY)
    }
    return {
        cell,
        cx,
        cy,
        bounds,
        minX,
        maxX,
        minY,
        maxY,
    }
}
function insideBounds(
    column: number,
    row: number,
    bounds: Bounds | null,
    locked: boolean
) {
    if (!locked || !bounds) return true
    const lat = rowToLatitude(row)
    const lon = columnToLongitude(wrap(column, MAP_COLUMNS) + 0.5)
    if (lat < bounds.south || lat > bounds.north) {
        return false
    }
    const base = longitudeToColumn(lon)
    const west = longitudeToColumn(bounds.west)
    const east = longitudeToColumn(bounds.east)
    return [base - MAP_COLUMNS, base, base + MAP_COLUMNS].some(
        (value) => value >= west && value <= east
    )
}
function cameraColumn(scene: Scene, elapsed: number, scroll: boolean) {
    if (!scroll) return scene.cx
    const distance = elapsed * 0.5
    if (!Number.isFinite(scene.minX)) {
        return scene.cx + distance
    }
    if (scene.maxX <= scene.minX) {
        return scene.cx
    }
    const span = scene.maxX - scene.minX
    const phase = wrap(scene.cx - scene.minX + distance, span * 2)
    return scene.minX + (phase <= span ? phase : span * 2 - phase)
}
function sceneCells(
    w: number,
    h: number,
    scene: Scene,
    centerX: number,
    lock: boolean
): LandCell[] {
    const { cell } = scene
    const first = Math.floor(centerX - w / (2 * cell))
    const last = Math.ceil(centerX + w / (2 * cell)) + 1
    const originY = h / 2 - scene.cy * cell
    const rowStart = Math.max(0, Math.floor(-originY / cell) - 1)
    const rowEnd = Math.min(MAP_HEIGHT, Math.ceil((h - originY) / cell) + 1)
    const result: LandCell[] = []
    for (let row = rowStart; row < rowEnd; row++) {
        for (let col = first; col <= last; col++) {
            if (
                !LAND[row][wrap(col, MAP_COLUMNS)] ||
                !insideBounds(col, row, scene.bounds, lock)
            ) {
                continue
            }
            result.push({
                column: col,
                row,
                alpha: shade(wrap(col, MAP_COLUMNS), row),
            })
        }
    }
    return result
}
export default function KarimSaifPixelWorldMap(props: Props) {
    const {
        mapView = "world",
        startPosition = "auto",
        latitude = 30,
        longitude = 31,
        columns = 49,
        autoZoom = true,
        customRadius = 25,
        scrolling = true,
        lockRegion = false,
        preset = "ember",
        pingColor = "#F2762E",
        landColor = "#3D3A37",
        backgroundColor = "#1F1D1C",
        density = 0.07,
        speed = 1,
        squareSize = 74,
        landOpacity = 100,
        pingLifetime = 4,
        rippleSize = 1.6,
        rippleOpacity = 60,
        showRipples = true,
        paused = false,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const hostRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const stateRef = React.useRef({
        elapsed: 0,
        pings: [] as Ping[],
        seed: 0,
        cameraKey: "",
    })
    const region =
        mapView === "custom" ? null : REGIONS[mapView] || REGIONS.world
    const customPoint = {
        latitude: clamp(safeNumber(latitude, 30), MAP_BOTTOM_LAT, MAP_TOP_LAT),
        longitude: clamp(safeNumber(longitude, 31), -180, 180),
    }
    const start =
        startPosition === "custom"
            ? customPoint
            : startPosition === "auto"
              ? region
                  ? {
                        latitude: region.latitude,
                        longitude: region.longitude,
                    }
                  : customPoint
              : STARTS[startPosition] || customPoint
    const palette =
        preset === "custom"
            ? {
                  ping: pingColor,
                  land: landColor,
                  background: backgroundColor,
              }
            : PRESETS[preset] || PRESETS.ember
    const share = clamp(safeNumber(density, 0.07), 0, 0.5)
    const rate = clamp(safeNumber(speed, 1), 0, 5)
    const size = clamp(safeNumber(squareSize, 74) / 100, 0.2, 1)
    const landAlpha = clamp(safeNumber(landOpacity, 100) / 100, 0, 1)
    const life = clamp(safeNumber(pingLifetime, 4), 1, 12)
    const rippleScale = clamp(safeNumber(rippleSize, 1.6), 0, 4)
    const rippleAlpha = clamp(safeNumber(rippleOpacity, 60) / 100, 0, 1)
    const radius = clamp(safeNumber(customRadius, 25), 5, 180)
    const bounds: Bounds | null =
        mapView === "world"
            ? null
            : mapView === "custom"
              ? {
                    west: customPoint.longitude - radius,
                    east: customPoint.longitude + radius,
                    south: clamp(
                        customPoint.latitude - radius * 0.65,
                        MAP_BOTTOM_LAT,
                        MAP_TOP_LAT
                    ),
                    north: clamp(
                        customPoint.latitude + radius * 0.65,
                        MAP_BOTTOM_LAT,
                        MAP_TOP_LAT
                    ),
                }
              : region
                ? {
                      west: region.west,
                      east: region.east,
                      south: region.south,
                      north: region.north,
                  }
                : null
    const manualZoom = clamp(safeNumber(columns, 49), 12, 96)
    const getZoom = (w: number, h: number) => {
        if (!autoZoom) return manualZoom
        if (!bounds) {
            return region?.zoom || 49
        }
        const spanX = ((bounds.east - bounds.west) * MAP_COLUMNS) / 360
        const spanY =
            ((bounds.north - bounds.south) * MAP_HEIGHT) /
            (MAP_TOP_LAT - MAP_BOTTOM_LAT)
        const fit = Math.max(spanX * 1.12, spanY * Math.max(0.1, w / h) * 1.12)
        return clamp(fit, 12, 96)
    }
    const cameraKey = [
        mapView,
        start.latitude,
        start.longitude,
        autoZoom,
        manualZoom,
        radius,
        lockRegion,
    ].join("|")
    if (stateRef.current.cameraKey !== cameraKey) {
        stateRef.current.cameraKey = cameraKey
        stateRef.current.elapsed = 0
        stateRef.current.pings = []
        stateRef.current.seed = 0
    }
    const still = isStatic || reduced === true
    const svg = React.useMemo(() => {
        if (!still) return null
        const w = 1000
        const h = 600
        const scene = makeScene(w, h, getZoom(w, h), start, bounds, lockRegion)
        const cells = sceneCells(w, h, scene, scene.cx, lockRegion)
        const side = scene.cell * size
        const inset = (scene.cell - side) / 2
        return (
            <svg
                viewBox="0 0 1000 600"
                preserveAspectRatio="none"
                width="100%"
                height="100%"
                aria-hidden="true"
                style={{
                    display: "block",
                    position: "absolute",
                    inset: 0,
                }}
            >
                <rect width="1000" height="600" fill={palette.background} />
                {cells.map((c, i) => {
                    const x = (c.column - scene.cx) * scene.cell + w / 2 + inset
                    const y = (c.row - scene.cy) * scene.cell + h / 2 + inset
                    const lit =
                        hash(c.row * 97 + wrap(c.column, MAP_COLUMNS) * 31) <
                        share
                    return (
                        <rect
                            key={i}
                            x={x}
                            y={y}
                            width={side}
                            height={side}
                            fill={lit ? palette.ping : palette.land}
                            opacity={lit ? 1 : landAlpha * c.alpha}
                        />
                    )
                })}
            </svg>
        )
    }, [
        still,
        mapView,
        start.latitude,
        start.longitude,
        autoZoom,
        manualZoom,
        radius,
        lockRegion,
        palette.ping,
        palette.land,
        palette.background,
        share,
        size,
        landAlpha,
    ])
    const settingsRef = React.useRef({
        palette,
        share,
        rate,
        size,
        landAlpha,
        life,
        rippleScale,
        rippleAlpha,
        showRipples,
        paused,
        scrolling,
    })
    settingsRef.current = {
        palette,
        share,
        rate,
        size,
        landAlpha,
        life,
        rippleScale,
        rippleAlpha,
        showRipples,
        paused,
        scrolling,
    }
    React.useEffect(() => {
        if (still) return
        const host = hostRef.current
        const canvas = canvasRef.current
        if (!host || !canvas) return
        const ctx = canvas.getContext("2d", {
            alpha: false,
        })
        if (!ctx) return
        let w = 0
        let h = 0
        let raf = 0
        let lastTime = 0
        let inView = typeof IntersectionObserver === "undefined"
        let dead = false
        let scene = makeScene(
            1000,
            600,
            getZoom(1000, 600),
            start,
            bounds,
            lockRegion
        )
        let cachedFirst = NaN
        let cachedRowStart = NaN
        let cachedRowEnd = NaN
        let cachedCells: LandCell[] = []
        let spawnCarry = 0
        const state = stateRef.current
        const stop = () => {
            if (raf) {
                cancelAnimationFrame(raf)
            }
            raf = 0
        }
        const active = () =>
            !dead &&
            inView &&
            !document.hidden &&
            !settingsRef.current.paused &&
            settingsRef.current.rate > 0 &&
            w > 0 &&
            h > 0
        const cellsAt = (center: number) => {
            const first = Math.floor(center - w / (2 * scene.cell))
            const originY = h / 2 - scene.cy * scene.cell
            const r0 = Math.floor(-originY / scene.cell)
            const r1 = Math.ceil((h - originY) / scene.cell)
            if (
                first !== cachedFirst ||
                r0 !== cachedRowStart ||
                r1 !== cachedRowEnd
            ) {
                cachedCells = sceneCells(w, h, scene, center, lockRegion)
                cachedFirst = first
                cachedRowStart = r0
                cachedRowEnd = r1
            }
            return cachedCells
        }
        const draw = () => {
            if (dead || w <= 0 || h <= 0) {
                return
            }
            const s = settingsRef.current
            const center = cameraColumn(scene, state.elapsed, s.scrolling)
            const cells = cellsAt(center)
            const square = scene.cell * s.size
            const inset = (scene.cell - square) / 2
            ctx.globalAlpha = 1
            ctx.fillStyle = s.palette.background
            ctx.fillRect(0, 0, w, h)
            ctx.fillStyle = s.palette.land
            for (const c of cells) {
                ctx.globalAlpha = s.landAlpha * c.alpha
                ctx.fillRect(
                    (c.column - center) * scene.cell + w / 2 + inset,
                    (c.row - scene.cy) * scene.cell + h / 2 + inset,
                    square,
                    square
                )
            }
            const goal = Math.min(
                MAX_PINGS,
                cells.length,
                Math.round(cells.length * s.share)
            )
            if (state.pings.length > goal) {
                state.pings.length = goal
            }
            if (state.pings.length < goal && state.seed === 0) {
                const count = Math.min(goal, Math.ceil(goal * 0.7))
                for (let i = 0; i < count; i++) {
                    const c =
                        cells[Math.floor(hash(i * 7.3 + 19) * cells.length)]
                    if (c) {
                        state.pings.push({
                            column: c.column,
                            row: c.row,
                            born:
                                state.elapsed -
                                hash(i * 9.1 + 4) * s.life * 0.5,
                            life: s.life,
                        })
                    }
                }
                state.seed = 1
            }
            ctx.fillStyle = s.palette.ping
            ctx.strokeStyle = s.palette.ping
            ctx.lineWidth = Math.max(1, scene.cell * 0.045)
            for (const p of state.pings) {
                const age = state.elapsed - p.born
                const x =
                    (p.column - center) * scene.cell + w / 2 + scene.cell / 2
                const y =
                    (p.row - scene.cy) * scene.cell + h / 2 + scene.cell / 2
                if (
                    age < 0 ||
                    age >= p.life ||
                    x < -scene.cell * 3 ||
                    x > w + scene.cell * 3 ||
                    y < -scene.cell * 3 ||
                    y > h + scene.cell * 3
                ) {
                    continue
                }
                const pop = clamp(age / 0.18, 0, 1)
                const fade = clamp((p.life - age) / 1, 0, 1)
                ctx.globalAlpha = fade * pop
                ctx.fillRect(x - square / 2, y - square / 2, square, square)
                if (s.showRipples && age < 0.9 && s.rippleScale > 0) {
                    const t = age / 0.9
                    const r = square / 2 + t * scene.cell * s.rippleScale
                    ctx.globalAlpha = (1 - t) * s.rippleAlpha * fade
                    ctx.strokeRect(x - r, y - r, 2 * r, 2 * r)
                }
            }
            ctx.globalAlpha = 1
        }
        const tick = (now: number) => {
            raf = 0
            if (!active()) return
            const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000))
            lastTime = now
            const s = settingsRef.current
            state.elapsed += dt * s.rate
            const center = cameraColumn(scene, state.elapsed, s.scrolling)
            const cells = cellsAt(center)
            const visible = new Set(cells.map((c) => `${c.column}:${c.row}`))
            state.pings = state.pings.filter(
                (p) =>
                    state.elapsed - p.born < p.life &&
                    visible.has(`${p.column}:${p.row}`)
            )
            const target = Math.min(
                MAX_PINGS,
                cells.length,
                Math.round(cells.length * s.share)
            )
            if (state.pings.length > target) {
                state.pings.length = target
            }
            const occupied = new Set(
                state.pings.map((p) => `${p.column}:${p.row}`)
            )
            spawnCarry = Math.min(
                60,
                spawnCarry +
                    dt *
                        s.rate *
                        Math.min(
                            60,
                            Math.max(1, target / Math.max(0.5, s.life))
                        )
            )
            let attempts = Math.min(
                Math.floor(spawnCarry),
                Math.max(0, target - state.pings.length)
            )
            spawnCarry -= attempts
            while (attempts-- > 0 && cells.length) {
                let c: LandCell | undefined
                for (let tries = 0; tries < 8; tries++) {
                    const candidate =
                        cells[Math.floor(Math.random() * cells.length)]
                    if (
                        candidate &&
                        !occupied.has(`${candidate.column}:${candidate.row}`)
                    ) {
                        c = candidate
                        break
                    }
                }
                if (!c) break
                occupied.add(`${c.column}:${c.row}`)
                state.pings.push({
                    column: c.column,
                    row: c.row,
                    born: state.elapsed,
                    life: s.life * (0.8 + Math.random() * 0.4),
                })
            }
            draw()
            if (active()) {
                raf = requestAnimationFrame(tick)
            }
        }
        const update = () => {
            stop()
            draw()
            if (active()) {
                lastTime = performance.now()
                raf = requestAnimationFrame(tick)
            }
        }
        const resize = () => {
            if (dead) return
            const rect = host.getBoundingClientRect()
            const nw = Math.max(0, rect.width)
            const nh = Math.max(0, rect.height)
            if (Math.abs(w - nw) < 0.5 && Math.abs(h - nh) < 0.5) {
                return
            }
            w = nw
            h = nh
            if (w <= 0 || h <= 0) {
                stop()
                return
            }
            const dpr = Math.max(
                0.1,
                Math.min(
                    MAX_DPR,
                    window.devicePixelRatio || 1,
                    Math.sqrt(MAX_PIXELS / (w * h))
                )
            )
            const pw = Math.max(1, Math.floor(w * dpr))
            const ph = Math.max(1, Math.floor(h * dpr))
            if (canvas.width !== pw || canvas.height !== ph) {
                canvas.width = pw
                canvas.height = ph
            }
            ctx.setTransform(pw / w, 0, 0, ph / h, 0, 0)
            scene = makeScene(w, h, getZoom(w, h), start, bounds, lockRegion)
            cachedFirst = NaN
            update()
        }
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(resize)
                : null
        ro?.observe(host)
        const io =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver((entries) => {
                      inView = !!entries[0]?.isIntersecting
                      update()
                  })
                : null
        io?.observe(host)
        document.addEventListener("visibilitychange", update)
        resize()
        return () => {
            dead = true
            stop()
            ro?.disconnect()
            io?.disconnect()
            document.removeEventListener("visibilitychange", update)
        }
    }, [still, cameraKey, paused, rate])
    React.useEffect(() => {
        if (!still && canvasRef.current && hostRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d")
            if (ctx) {
                const rect = hostRef.current.getBoundingClientRect()
                if (rect.width > 0 && rect.height > 0) {
                    const w = rect.width
                    const h = rect.height
                    const scene = makeScene(
                        w,
                        h,
                        getZoom(w, h),
                        start,
                        bounds,
                        lockRegion
                    )
                    const center = cameraColumn(
                        scene,
                        stateRef.current.elapsed,
                        scrolling
                    )
                    const side = scene.cell * size
                    const inset = (scene.cell - side) / 2
                    ctx.globalAlpha = 1
                    ctx.fillStyle = palette.background
                    ctx.fillRect(0, 0, w, h)
                    ctx.fillStyle = palette.land
                    for (const c of sceneCells(
                        w,
                        h,
                        scene,
                        center,
                        lockRegion
                    )) {
                        ctx.globalAlpha = landAlpha * c.alpha
                        ctx.fillRect(
                            (c.column - center) * scene.cell + w / 2 + inset,
                            (c.row - scene.cy) * scene.cell + h / 2 + inset,
                            side,
                            side
                        )
                    }
                    ctx.globalAlpha = 1
                }
            }
        }
    }, [
        still,
        palette.ping,
        palette.land,
        palette.background,
        landAlpha,
        size,
        share,
        showRipples,
        rippleScale,
        rippleAlpha,
    ])
    return (
        <div
            ref={hostRef}
            role="img"
            aria-label="Stylized pixel world map with animated simulated activity"
            style={{
                ...style,
                position: "relative",
                display: "block",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                isolation: "isolate",
                backgroundColor: palette.background,
            }}
        >
            {still ? (
                svg
            ) : (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "block",
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}
addPropertyControls(KarimSaifPixelWorldMap, {
    mapView: {
        type: ControlType.Enum,
        title: "Map View",
        options: [
            "world",
            "north-america",
            "south-america",
            "europe",
            "africa",
            "asia",
            "middle-east",
            "oceania",
            "custom",
        ],
        optionTitles: [
            "World",
            "North America",
            "South America",
            "Europe",
            "Africa",
            "Asia",
            "Middle East",
            "Oceania",
            "Custom Area",
        ],
        defaultValue: "world",
        description:
            "Choose a geographic region to center the pixel map. Select Custom Area to position it using your own coordinates.",
    },
    startPosition: {
        type: ControlType.Enum,
        title: "Start Position",
        options: [
            "auto",
            "new-york",
            "london",
            "cairo",
            "dubai",
            "tokyo",
            "sydney",
            "custom",
        ],
        optionTitles: [
            "Region Center",
            "New York",
            "London",
            "Cairo",
            "Dubai",
            "Tokyo",
            "Sydney",
            "Custom Coordinates",
        ],
        defaultValue: "auto",
        description:
            "Choose the geographic point shown at the center when the map starts. Region Center uses the selected Map View.",
    },
    latitude: {
        type: ControlType.Number,
        title: "Latitude",
        min: -55,
        max: 80,
        step: 0.1,
        defaultValue: 30,
        hidden: (props) =>
            props.startPosition !== "custom" &&
            !(props.mapView === "custom" && props.startPosition === "auto"),
        description:
            "Sets the north-south center of the map in degrees when custom coordinates are enabled.",
    },
    longitude: {
        type: ControlType.Number,
        title: "Longitude",
        min: -180,
        max: 180,
        step: 0.1,
        defaultValue: 31,
        hidden: (props) =>
            props.startPosition !== "custom" &&
            !(props.mapView === "custom" && props.startPosition === "auto"),
        description:
            "Sets the east-west center of the map in degrees when custom coordinates are enabled.",
    },
    autoZoom: {
        type: ControlType.Boolean,
        title: "Auto Zoom",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Uses a region-aware zoom level. Turn off to set zoom manually.",
    },
    customRadius: {
        type: ControlType.Number,
        title: "Area Radius",
        min: 5,
        max: 180,
        step: 1,
        defaultValue: 25,
        unit: "°",
        hidden: (props) => props.mapView !== "custom",
        description:
            "Defines the approximate longitude radius of the custom geographic area in degrees.",
    },
    columns: {
        type: ControlType.Number,
        title: "Zoom",
        min: 12,
        max: 96,
        step: 1,
        defaultValue: 49,
        displayStepper: true,
        hidden: (props) => props.autoZoom !== false,
        description:
            "Controls how many pixel columns fit across the frame. Lower values zoom in; higher values reveal a wider area.",
    },
    scrolling: {
        type: ControlType.Boolean,
        title: "Scrolling",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Enables automatic horizontal map movement while activity markers continue animating.",
    },
    lockRegion: {
        type: ControlType.Boolean,
        title: "Lock to Region",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.mapView === "world",
        description:
            "Shows only land inside the selected region or custom area, and confines horizontal movement to its bounds.",
    },
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["ember", "ocean", "neon", "minimal", "custom"],
        optionTitles: ["Ember", "Ocean", "Neon", "Minimal", "Custom"],
        defaultValue: "ember",
        description:
            "Choose a ready-made color palette or select Custom to set the activity, land, and background colors.",
    },
    pingColor: {
        type: ControlType.Color,
        title: "Ping Color",
        defaultValue: "#F2762E",
        hidden: (props) => props.preset !== "custom",
        description:
            "Sets the color of illuminated activity markers and expanding square ripples.",
    },
    landColor: {
        type: ControlType.Color,
        title: "Land Color",
        defaultValue: "#3D3A37",
        hidden: (props) => props.preset !== "custom",
        description:
            "Sets the color of the pixel squares that form the landmasses.",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#1F1D1C",
        hidden: (props) => props.preset !== "custom",
        description: "Changes the background color behind the pixel world map.",
    },
    density: {
        type: ControlType.Number,
        title: "Activity",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.07,
        description:
            "Controls the proportion of visible land pixels illuminated by simulated activity markers.",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        description:
            "Adjusts map movement and activity animation speed. Zero displays a static map.",
    },
    squareSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        min: 20,
        max: 100,
        step: 1,
        defaultValue: 74,
        unit: "%",
        description:
            "Adjusts the size of each pixel square relative to its grid cell, controlling the spacing between pixels.",
    },
    landOpacity: {
        type: ControlType.Number,
        title: "Land Opacity",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 100,
        unit: "%",
        description:
            "Adjusts the visibility of the land pixels while preserving subtle brightness variations.",
    },
    pingLifetime: {
        type: ControlType.Number,
        title: "Ping Life",
        min: 1,
        max: 12,
        step: 0.5,
        defaultValue: 4,
        unit: "s",
        description:
            "Sets how long each illuminated activity marker remains visible before fading away.",
    },
    showRipples: {
        type: ControlType.Boolean,
        title: "Ripples",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Shows expanding square ripple outlines when new activity markers appear.",
    },
    rippleSize: {
        type: ControlType.Number,
        title: "Ripple Size",
        min: 0,
        max: 4,
        step: 0.1,
        defaultValue: 1.6,
        hidden: (props) => !props.showRipples,
        description:
            "Controls how far each square ripple expands from its activity marker.",
    },
    rippleOpacity: {
        type: ControlType.Number,
        title: "Ripple Opacity",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 60,
        unit: "%",
        hidden: (props) => !props.showRipples,
        description:
            "Adjusts the initial opacity of expanding square ripple outlines.",
    },
    paused: {
        type: ControlType.Boolean,
        title: "Paused",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Pauses the animation while preserving its current position and activity.",
    },
})
