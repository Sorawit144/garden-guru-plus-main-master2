import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MapPin,
  Plus,
  Trash2,
  Navigation,
  RefreshCw,
  Compass,
  AlertTriangle,
  Check,
  RotateCcw,
  BadgeInfo,
  Layers,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { AppShell, Badge, Card, Progress } from "@/components/AppShell";
import { usePlots } from "@/hooks/usePlots";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useDragonflyData } from "@/hooks/useDragonflyData";

export const Route = createFileRoute("/plots")({
  head: () => ({
    meta: [
      { title: "จัดการแปลง — สวนอัจฉริยะ" },
      { name: "description", content: "เพิ่มแปลงจาก GPS ดูชนิดพืช อายุ จำนวนต้น พื้นที่ และประวัติการดูแล" },
      { property: "og:title", content: "จัดการแปลง — สวนอัจฉริยะ" },
      { property: "og:description", content: "จัดการข้อมูลแปลงเพาะปลูกและประวัติการดูแลทั้งหมด" },
    ],
  }),
  component: PlotsPage,
});

// พรีเซ็ตของพืชหลักยอดนิยมในไทยพร้อมไอคอนอีโมจิ
const cropPresets = [
  { name: "ทุเรียนหมอนทอง", emoji: "🥭" },
  { name: "ทุเรียนชะนี", emoji: "🥭" },
  { name: "มังคุด", emoji: "🍇" },
  { name: "ลำไยอีดอ", emoji: "🌰" },
  { name: "เงาะโรงเรียน", emoji: "🍎" },
  { name: "ยางพารา", emoji: "🪵" },
  { name: "ปาล์มน้ำมัน", emoji: "🌴" },
  { name: "มะพร้าวน้ำหอม", emoji: "🥥" },
  { name: "ส้มโอทับทิมสยาม", emoji: "🍊" },
  { name: "มะม่วงน้ำดอกไม้", emoji: "🥭" },
  { name: "มะนาวแป้น", emoji: "🍋" },
  { name: "อะโวคาโด", emoji: "🥑" },
  { name: "กาแฟอาราบิกา", emoji: "☕" },
  { name: "กล้วยน้ำว้า", emoji: "🍌" },
];

interface Coord {
  lat: number;
  lng: number;
  acc: number;
  timestamp: number;
}

// คำนวณพื้นที่แบบ Shoelace (Gauss's Area Formula) บนระนาบเมตร
function calculatePolygonArea(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 3) return 0;
  const R = 6378137; // รัศมีโลกในหน่วยเมตร
  const lat0 = coords[0]!.lat;
  const lon0 = coords[0]!.lng;
  const lat0Rad = (lat0 * Math.PI) / 180;

  // แปลง Latitude/Longitude เป็นพิกัด X, Y ในหน่วยเมตร (Equirectangular Projection)
  const projected = coords.map((c) => {
    const x = R * ((c.lng - lon0) * Math.PI / 180) * Math.cos(lat0Rad);
    const y = R * ((c.lat - lat0) * Math.PI / 180);
    return { x, y };
  });

  let area = 0;
  const n = projected.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += projected[i]!.x * projected[j]!.y;
    area -= projected[j]!.x * projected[i]!.y;
  }
  return Math.abs(area) / 2; // พื้นที่ในหน่วย ตารางเมตร
}

// แปลงตารางเมตรเป็นหน่วยไทย (ไร่ - งาน - ตารางวา)
function sqmToThaiArea(sqm: number) {
  const totalRai = sqm / 1600;
  const rai = Math.floor(sqm / 1600);
  let remaining = sqm % 1600;
  const ngan = Math.floor(remaining / 400);
  remaining = remaining % 400;
  const wa = Math.round((remaining / 4) * 10) / 10;
  return { rai, ngan, wa, totalRai };
}

// Component สำหรับวาดขอบเขตแปลงจำลองโดยใช้ SVG
function PolygonPreview({ coords }: { coords: Coord[] }) {
  const height = 150;
  const width = 300;

  if (coords.length === 0) {
    return (
      <div className="flex h-[150px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/30 text-xs text-muted-foreground p-4 text-center">
        <Compass className="size-8 mb-2 text-muted-foreground/50 animate-bounce" />
        <span>ยังไม่มีการปักหมุดพิกัดมุมแปลง</span>
        <span className="text-[10px] text-muted-foreground/75 mt-1">กดปุ่ม "ปักหมุดตำแหน่งปัจจุบัน" เพื่อเริ่มวาด</span>
      </div>
    );
  }

  const R = 6378137;
  const lat0 = coords[0]!.lat;
  const lon0 = coords[0]!.lng;
  const lat0Rad = (lat0 * Math.PI) / 180;

  // โพรเจกต์จุดทั้งหมด
  const projected = coords.map((c) => {
    const x = R * ((c.lng - lon0) * Math.PI / 180) * Math.cos(lat0Rad);
    const y = R * ((c.lat - lat0) * Math.PI / 180);
    return { x, y };
  });

  const xs = projected.map((p) => p.x);
  const ys = projected.map((p) => p.y);

  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);

  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  const padding = 25;

  const scale = Math.min((width - padding * 2) / dx, (height - padding * 2) / dy);

  // คำนวณจุดพิกัดที่จะใช้วาดใน SVG
  const svgCoords = projected.map((p, i) => {
    const svgX = padding + (p.x - minX) * scale;
    const svgY = height - (padding + (p.y - minY) * scale); // สลับแกน Y เพื่อให้ทิศเหนือชี้ขึ้นข้างบน
    return { x: svgX, y: svgY, label: `P${i + 1}` };
  });

  const pointsString = svgCoords.map((pt) => `${pt.x},${pt.y}`).join(" ");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/40 p-2">
      <div className="absolute top-2 left-2 z-10 flex gap-1 items-center bg-background/90 backdrop-blur px-1.5 py-0.5 rounded border border-border text-[9px] font-semibold text-muted-foreground">
        <Layers className="size-2.5 text-primary" />
        แผนที่ขอบเขตแปลง (Scale: 1:{(1/scale).toFixed(0)})
      </div>
      <svg width="100%" height={height} className="overflow-visible bg-grid">
        {/* วาดรูปแปลงปิด */}
        {coords.length >= 3 && (
          <polygon
            points={pointsString}
            fill="rgba(34, 197, 94, 0.15)"
            stroke="rgb(34, 197, 94)"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
        )}
        {/* วาดเส้นประเชื่อมจุดกรณีที่จุดไม่ถึง 3 */}
        {coords.length > 1 && coords.length < 3 && (
          <polyline
            points={pointsString}
            fill="none"
            stroke="rgb(234, 179, 8)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        )}
        {/* วาดจุดปักหมุด */}
        {svgCoords.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={i === coords.length - 1 ? "7" : "5"}
              className={`${i === coords.length - 1 ? "fill-warning animate-pulse" : "fill-primary"} stroke-background`}
              strokeWidth="1.5"
            />
            <text
              x={pt.x}
              y={pt.y - 8}
              textAnchor="middle"
              className="text-[9px] font-bold fill-foreground"
            >
              {pt.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-muted-foreground px-1">
        <span>ขนาดกว้าง-ยาว: {Math.round(dx)} ม. × {Math.round(dy)} ม.</span>
        <span>จุดปักหมุดทั้งหมด: {coords.length} จุด</span>
      </div>
    </div>
  );
}

function useLeaflet() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setLoaded(true);
      return;
    }

    const cssId = "leaflet-cdn-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    let intervalId: any = null;

    const scriptId = "leaflet-cdn-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else {
      intervalId = setInterval(() => {
        if ((window as any).L) {
          setLoaded(true);
          clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return loaded;
}

interface SatelliteMapDrawerProps {
  points: Coord[];
  setPoints: React.Dispatch<React.SetStateAction<Coord[]>>;
  centerPoint: Coord | null;
}

// Component แผนที่ดาวเทียมสำหรับวาดขอบเขตแปลง (Dragonfly-style)
function SatelliteMapDrawer({ points, setPoints, centerPoint }: SatelliteMapDrawerProps) {
  const leafletLoaded = useLeaflet();
  const mapRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    const baseLat = centerPoint?.lat || 12.6086;
    const baseLng = centerPoint?.lng || 102.1035;

    const map = L.map("satellite-map", {
      center: [baseLat, baseLng],
      zoom: 17,
      zoomControl: false,
    });
    mapRef.current = map;

    // โหลด Tile แผนที่ภาพดาวเทียมจาก Esri
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19,
      }
    ).addTo(map);

    // เมื่อผู้ใช้แตะแผนที่
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      setPoints((prev) => [
        ...prev,
        { lat, lng, acc: 1, timestamp: Date.now() },
      ]);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletLoaded]);

  // ซิงค์สเตทจุดมุมในแผนที่กับการวาด Marker & Polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const L = (window as any).L;
    if (!L) return;

    // เคลียร์ Marker เก่าทั้งหมด
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // สร้าง Marker ใหม่ทับแต่ละพิกัดและทำให้ขยับลากได้ (Draggable)
    const newMarkers = points.map((p, idx) => {
      const marker = L.marker([p.lat, p.lng], {
        draggable: true,
        icon: L.divIcon({
          className: "custom-map-marker",
          html: `<div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary text-[10px] font-bold text-primary-foreground shadow-md transition-transform hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing">${idx + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);

      // ดักจับจังหวะลาก (Drag) เพื่ออัปเดตสเตทแบบ Real-time
      marker.on("drag", (e: any) => {
        const newLatLng = e.target.getLatLng();
        setPoints((prev) => {
          const updated = [...prev];
          if (updated[idx]) {
            updated[idx] = {
              ...updated[idx]!,
              lat: newLatLng.lat,
              lng: newLatLng.lng,
            };
          }
          return updated;
        });
      });

      return marker;
    });
    markersRef.current = newMarkers;

    // ล้างเส้น Polygon เก่า
    if (polygonRef.current) {
      polygonRef.current.remove();
    }

    // วาดขอบเขตรูปปิดหรือเส้นไกด์
    if (points.length >= 3) {
      const latlngs = points.map((p) => [p.lat, p.lng]);
      const polygon = L.polygon(latlngs, {
        color: "rgb(34, 197, 94)",
        fillColor: "rgba(34, 197, 94, 0.22)",
        weight: 3,
        dashArray: "4 2",
      }).addTo(map);
      polygonRef.current = polygon;
    } else if (points.length === 2) {
      const latlngs = points.map((p) => [p.lat, p.lng]);
      const line = L.polyline(latlngs, {
        color: "rgb(234, 179, 8)",
        weight: 2,
        dashArray: "3 3",
      }).addTo(map);
      polygonRef.current = line;
    }
  }, [points, leafletLoaded]);

  // ฟังก์ชันขยับแผนที่
  const handleCenterOnUser = () => {
    const map = mapRef.current;
    if (!map) return;
    const lat = centerPoint?.lat || 12.6086;
    const lng = centerPoint?.lng || 102.1035;
    map.setView([lat, lng], 17);
    toast.success("เลื่อนหน้าจอไปยังตำแหน่ง GPS ปัจจุบัน");
  };

  const handleZoomIn = () => {
    const map = mapRef.current;
    if (map) map.zoomIn();
  };

  const handleZoomOut = () => {
    const map = mapRef.current;
    if (map) map.zoomOut();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      {!leafletLoaded ? (
        <div className="flex h-[280px] w-full flex-col items-center justify-center bg-muted/40 text-xs text-muted-foreground gap-2">
          <RefreshCw className="size-6 text-primary animate-spin" />
          <span>กำลังโหลดแผนที่ดาวเทียม...</span>
        </div>
      ) : (
        <div className="relative">
          <div id="satellite-map" className="h-[280px] w-full" />
          
          {/* Overlay Map Controls */}
          <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="flex size-9 items-center justify-center rounded-full bg-background/95 backdrop-blur text-foreground shadow-md border border-border hover:bg-background cursor-pointer text-lg font-bold transition-transform active:scale-95"
              title="ขยายแผนที่"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              className="flex size-9 items-center justify-center rounded-full bg-background/95 backdrop-blur text-foreground shadow-md border border-border hover:bg-background cursor-pointer text-lg font-bold transition-transform active:scale-95"
              title="ย่อแผนที่"
            >
              -
            </button>
            <button
              onClick={handleCenterOnUser}
              className="flex size-9 items-center justify-center rounded-full bg-background/95 backdrop-blur text-primary shadow-md border border-border hover:bg-background cursor-pointer transition-transform active:scale-95"
              title="ขยับไปยังตำแหน่งของฉัน"
            >
              <Compass className="size-4.5 animate-pulse" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlotsPage() {
  const { plots, addPlot, isLoaded } = usePlots();
  const dragonfly = useDragonflyData();
  const isOrganizationEmployee = dragonfly.workspaceContext === "organization" && dragonfly.persona.id === "employee";
  const employeeWorker = dragonfly.state.workers.find((worker) => worker.id === "W-004") ?? dragonfly.state.workers[0];
  const employeePlotIds = useMemo(() => new Set([
    ...(employeeWorker?.plot ? [employeeWorker.plot] : []),
    ...dragonfly.state.tasks
      .filter((task) => task.assignedWorkerId === employeeWorker?.id || (!task.assignedWorkerId && task.team === employeeWorker?.crew))
      .map((task) => task.plot),
  ]), [dragonfly.state.tasks, employeeWorker?.crew, employeeWorker?.id, employeeWorker?.plot]);
  const [recentPlotName, setRecentPlotName] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const [cropFilter, setCropFilter] = useState("ทั้งหมด");
  const [healthFilter, setHealthFilter] = useState("ทั้งหมด");
  const [farmFilter, setFarmFilter] = useState(dragonfly.activeDashboardFarm.id);
  const [siteFilter, setSiteFilter] = useState("ทั้งหมด");
  const [newPlotSiteId, setNewPlotSiteId] = useState("");
  const [farmMode, setFarmMode] = useState<"existing" | "new">("existing");
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmLocation, setNewFarmLocation] = useState("");
  const [siteMode, setSiteMode] = useState<"existing" | "new">("existing");
  const [newSiteName, setNewSiteName] = useState("");

  // Dialog states
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<"walk" | "point" | "map" | null>(null);

  // Live GPS states
  const [currentLocation, setCurrentLocation] = useState<Coord | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  // Mode A & C: Walk GPS & Satellite Map states
  const [gpsCoords, setGpsCoords] = useState<Coord[]>([]);

  // Mode B: Single point area states
  const [singlePoint, setSinglePoint] = useState<Coord | null>(null);
  const [manualRai, setManualRai] = useState("0");
  const [manualNgan, setManualNgan] = useState("0");
  const [manualWa, setManualWa] = useState("0");

  // Form metadata states
  const [plotName, setPlotName] = useState("");
  const [cropType, setCropType] = useState("");
  const [cropEmoji, setCropEmoji] = useState("🌱");
  const [ageYears, setAgeYears] = useState("3");
  const [ageMonths, setAgeMonths] = useState("0");
  const [treeCount, setTreeCount] = useState("100");

  const selectedSite = dragonfly.state.sites.find((site) => site.id === siteFilter);
  const farmSites = useMemo(() => dragonfly.state.sites.filter((site) =>
    (site.farmId ?? "FARM-PRIMARY") === farmFilter &&
    (!isOrganizationEmployee || plots.some((plot) => employeePlotIds.has(plot.id) && (plot.siteId === site.id || site.plotPrefixes.some((prefix) => plot.id.startsWith(prefix)))))
  ), [dragonfly.state.sites, employeePlotIds, farmFilter, isOrganizationEmployee, plots]);
  const farmPlots = useMemo(
    () => plots.filter((plot) => (plot.farmId ?? "FARM-PRIMARY") === farmFilter && (!isOrganizationEmployee || employeePlotIds.has(plot.id))),
    [plots, employeePlotIds, farmFilter, isOrganizationEmployee]
  );
  const visibleFarms = useMemo(() => isOrganizationEmployee
    ? dragonfly.dashboardFarms.filter((farm) => plots.some((plot) => employeePlotIds.has(plot.id) && (plot.farmId ?? "FARM-PRIMARY") === farm.id))
    : dragonfly.dashboardFarms,
  [dragonfly.dashboardFarms, employeePlotIds, isOrganizationEmployee, plots]);
  const plotsInScope = useMemo(
    () => siteFilter === "ทั้งหมด"
      ? farmPlots
      : farmPlots.filter((plot) => plot.siteId === siteFilter || (!plot.siteId && selectedSite?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix)))),
    [farmPlots, selectedSite, siteFilter]
  );
  const cropOptions = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(plotsInScope.map((plot) => plot.crop)))], [plotsInScope]);
  const filteredPlots = useMemo(
    () => plotsInScope.filter((plot) => {
      const cropOk = cropFilter === "ทั้งหมด" || plot.crop === cropFilter;
      const health = plot.health > 80 ? "สมบูรณ์" : plot.health > 65 ? "เฝ้าระวัง" : "ต้องดูแล";
      return cropOk && (healthFilter === "ทั้งหมด" || health === healthFilter);
    }),
    [plotsInScope, cropFilter, healthFilter]
  );

  useEffect(() => {
    if (!dragonfly.dashboardFarms.some((farm) => farm.id === farmFilter)) {
      setFarmFilter(dragonfly.activeDashboardFarm.id);
    }
  }, [dragonfly.activeDashboardFarm.id, dragonfly.dashboardFarms, farmFilter]);

  // ติดตามพิกัดปัจจุบัน
  useEffect(() => {
    if (!isOpen || step !== 2) return;
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsError("เบราว์เซอร์ไม่รองรับระบบ Geolocation");
      return;
    }

    setIsWatching(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: Coord = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setCurrentLocation(coord);
        setGpsError(null);
        if (method === "point" && !singlePoint) {
          setSinglePoint(coord);
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        if (err.code === 1) {
          setGpsError("กรุณาเปิดสิทธิ์เข้าถึง GPS ในการตั้งค่าก่อนใช้งาน");
        } else {
          setGpsError("ไม่สามารถดึงตำแหน่งพิกัดได้ (สัญญาณอ่อน)");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 1000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsWatching(false);
    };
  }, [isOpen, step, method]);

  // คำนวณพื้นที่แบบเรียลไทม์จากตำแหน่งจุดที่เดินบันทึก หรือวาดบนแผนที่
  const sqmArea = useMemo(() => {
    if (method === "walk" || method === "map") {
      return calculatePolygonArea(gpsCoords);
    }
    return 0;
  }, [gpsCoords, method]);

  const thaiArea = useMemo(() => {
    if (method === "walk" || method === "map") {
      return sqmToThaiArea(sqmArea);
    }
    // สำหรับโหมด Single Point คำนวณตาม input
    const r = parseFloat(manualRai) || 0;
    const n = parseFloat(manualNgan) || 0;
    const w = parseFloat(manualWa) || 0;
    const totalRai = r + n / 4 + w / 400;
    return { rai: r, ngan: n, wa: w, totalRai };
  }, [sqmArea, manualRai, manualNgan, manualWa, method]);

  const plantingRecommendations = useMemo(() => {
    const lat = currentLocation?.lat ?? gpsCoords[0]?.lat ?? singlePoint?.lat ?? 12.6086;
    const areaHint = thaiArea.totalRai >= 5 ? "พื้นที่ขนาดกลางขึ้นไป เหมาะกับการวางระบบน้ำและจัดการเป็นรอบ" : "พื้นที่ขนาดเล็กถึงกลาง เหมาะเริ่มจากพืชที่ดูแลเป็นจุดได้";
    const climateHint = lat < 14 ? "พิกัดอยู่ในบริบทอากาศร้อนชื้นของชุดข้อมูลตัวอย่าง" : "พิกัดอยู่ในบริบทอากาศร้อนของชุดข้อมูลตัวอย่าง";
    return [
      { name: "ทุเรียนหมอนทอง", emoji: "🥭", reason: `${climateHint}; ${areaHint}` },
      { name: "มังคุด", emoji: "🍇", reason: "ใช้เป็นพืชร่วมสวนได้ในบริบทสวนผลไม้ร้อนชื้น และช่วยกระจายช่วงเก็บเกี่ยว" },
      { name: "มะพร้าวน้ำหอม", emoji: "🥥", reason: "เป็นทางเลือกสำหรับพื้นที่ที่ต้องการพืชยืนต้นและจัดการน้ำสม่ำเสมอ" },
    ];
  }, [currentLocation?.lat, gpsCoords, singlePoint?.lat, thaiArea.totalRai]);

  // เมื่อผู้ใช้เลือกพืชพรีเซ็ต ให้เปลี่ยนไอคอนอีโมจิอัตโนมัติ
  const handleSelectPresetCrop = (name: string, emoji: string) => {
    setCropType(name);
    setCropEmoji(emoji);
  };

  // จัดการการบันทึกตำแหน่งปัจจุบันลงลิสต์จุดขอบเขตแปลง (โหมดเดินรอบแปลง)
  const handleRecordPoint = () => {
    if (!currentLocation) {
      toast.error("รอสัญญาณ GPS สักครู่...");
      return;
    }
    setGpsCoords((prev) => [...prev, { ...currentLocation, timestamp: Date.now() }]);
    toast.success(`ปักหมุดจุดมุมที่ ${gpsCoords.length + 1} สำเร็จ!`);
  };

  // จำลองจุดถัดไป (ก้าวเดินทดสอบแบบสี่เหลี่ยมจัตุรัส)
  const handleMockStep = () => {
    const baseLat = currentLocation?.lat || 12.6086;
    const baseLng = currentLocation?.lng || 102.1035;
    const stepSize = 0.0006; // ~65 เมตร

    let nextLat = baseLat;
    let nextLng = baseLng;

    if (gpsCoords.length === 0) {
      nextLat = baseLat;
      nextLng = baseLng;
    } else if (gpsCoords.length === 1) {
      nextLat = gpsCoords[0]!.lat;
      nextLng = gpsCoords[0]!.lng + stepSize;
    } else if (gpsCoords.length === 2) {
      nextLat = gpsCoords[1]!.lat - stepSize;
      nextLng = gpsCoords[1]!.lng;
    } else if (gpsCoords.length === 3) {
      nextLat = gpsCoords[2]!.lat;
      nextLng = gpsCoords[2]!.lng - stepSize;
    } else {
      nextLat = gpsCoords[0]!.lat + (Math.random() - 0.5) * 0.00005;
      nextLng = gpsCoords[0]!.lng + (Math.random() - 0.5) * 0.00005;
    }

    const mockCoord: Coord = {
      lat: nextLat,
      lng: nextLng,
      acc: 4.5,
      timestamp: Date.now(),
    };

    setGpsCoords((prev) => [...prev, mockCoord]);
    setCurrentLocation(mockCoord);
    toast.success(`เดินจำลองมาถึงจุดมุมที่ ${gpsCoords.length + 1}`);
  };

  const handleResetWalk = () => {
    setGpsCoords([]);
    toast.info("เคลียร์ตำแหน่งปักหมุดใหม่ทั้งหมดแล้ว");
  };

  // ยืนยันบันทึกแปลง
  const handleSavePlot = () => {
    if (!plotName.trim()) {
      toast.error("กรุณากรอกชื่อแปลง");
      return;
    }
    if (!cropType.trim()) {
      toast.error("กรุณาระบุชนิดพืช");
      return;
    }
    if (farmMode === "new" && !newFarmName.trim()) {
      toast.error("กรุณาตั้งชื่อสวนใหม่");
      return;
    }
    if (siteMode === "new" && !newSiteName.trim()) {
      toast.error("กรุณาตั้งชื่อโซนใหม่");
      return;
    }

    let gpsStr = "";
    if ((method === "walk" || method === "map") && gpsCoords.length > 0) {
      // บันทึกจุดกึ่งกลางแบบเฉลี่ย
      const avgLat = gpsCoords.reduce((s, c) => s + c.lat, 0) / gpsCoords.length;
      const avgLng = gpsCoords.reduce((s, c) => s + c.lng, 0) / gpsCoords.length;
      gpsStr = `${avgLat.toFixed(5)}° N, ${avgLng.toFixed(5)}° E`;
    } else if (method === "point" && singlePoint) {
      gpsStr = `${singlePoint.lat.toFixed(5)}° N, ${singlePoint.lng.toFixed(5)}° E`;
    } else {
      gpsStr = "12.6086° N, 102.1035° E";
    }

    const totalAgeMonths = (parseInt(ageYears) || 0) * 12 + (parseInt(ageMonths) || 0);

    const newFarmId = `FARM-${Date.now()}`;
    const selectedFarmId = farmMode === "new" ? newFarmId : farmFilter;
    const newSiteId = `SITE-${Date.now()}`;
    const selectedSiteId = siteMode === "new" ? newSiteId : newPlotSiteId || undefined;
    addPlot({
      farmId: selectedFarmId,
      siteId: selectedSiteId,
      name: plotName,
      crop: cropType,
      emoji: cropEmoji,
      ageMonths: totalAgeMonths,
      trees: parseInt(treeCount) || 0,
      area: parseFloat(thaiArea.totalRai.toFixed(2)) || 0,
      gps: gpsStr,
    }, {
      newFarm: farmMode === "new" ? { id: newFarmId, name: newFarmName.trim(), location: newFarmLocation.trim() || "ยังไม่ระบุพื้นที่" } : undefined,
      newSite: siteMode === "new" ? { id: newSiteId, farmId: selectedFarmId, code: `Z${String(Date.now()).slice(-4)}`, name: newSiteName.trim() } : undefined,
    });

    setRecentPlotName(plotName);
    toast.success("บันทึกข้อมูลแปลงพืชใหม่สำเร็จ! 🎉");
    setIsOpen(false);
    
    // รีเซ็ตฟอร์ม
    setStep(1);
    setMethod(null);
    setGpsCoords([]);
    setSinglePoint(null);
    setPlotName("");
    setCropType("");
    setCropEmoji("🌱");
    setAgeYears("3");
    setAgeMonths("0");
    setTreeCount("100");
    setNewPlotSiteId("");
    setFarmMode("existing");
    setNewFarmName("");
    setNewFarmLocation("");
    setSiteMode("existing");
    setNewSiteName("");
  };

  return (
    <AppShell
      title={isOrganizationEmployee ? "แปลงที่ฉันรับผิดชอบ" : "จัดการแปลง"}
      subtitle={
        isLoaded
          ? `${dragonfly.workspaceLabel} · ${visibleFarms.find((farm) => farm.id === farmFilter)?.name ?? "ฟาร์ม"} · ${filteredPlots.length} แปลงที่แสดง · ${filteredPlots
              .reduce((s, p) => s + p.area, 0)
              .toFixed(1)} ไร่`
          : "กำลังโหลดข้อมูล..."
      }
    >
      {recentPlotName ? (
        <Card className="border-primary/30 bg-primary-soft/60">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-card text-lg">
              ✨
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">สร้างแปลง {recentPlotName} แล้ว</p>
              <p className="mt-1 text-xs text-muted-foreground">
                ระบบสร้างคำแนะนำพืชที่ควรปลูกและ next action ให้แล้ว โดยมีป้ายบอกว่าเป็น “ประมาณการจาก AI” หรือข้อมูลจากระบบอย่างชัดเจน
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/recommend"
                  className="rounded-xl bg-primary py-2.5 text-center text-xs font-semibold text-primary-foreground"
                >
                  ดูคำแนะนำพืช
                </Link>
                <button
                  onClick={() => setRecentPlotName(null)}
                  className="rounded-xl border border-border py-2.5 text-xs font-semibold"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {isOrganizationEmployee ? <Card className="border-primary/25 bg-primary-soft/45"><p className="text-sm font-semibold text-primary">สิทธิ์พนักงานในองค์กร</p><p className="mt-1 text-xs text-muted-foreground">ดูสุขภาพ ประวัติ และงานของแปลงที่ได้รับมอบหมายได้ แต่เพิ่ม ลบ หรือเปลี่ยนโครงสร้างแปลงไม่ได้</p></Card> : <button
        data-tour="plots-add-gps"
        onClick={() => {
          setNewPlotSiteId(siteFilter === "ทั้งหมด" ? dragonfly.state.sites[0]?.id ?? "" : siteFilter);
          setIsOpen(true);
        }}
        className="bg-primary flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform active:scale-[0.98] hover:opacity-95"
      >
        <Plus className="size-4" /> เพิ่มแปลงจากตำแหน่ง GPS
      </button>}

      <Card className="space-y-3">
        <label className="block text-xs font-medium text-muted-foreground">
          ฟาร์ม
          <select value={farmFilter} onChange={(event) => { setFarmFilter(event.target.value); setSiteFilter("ทั้งหมด"); setCropFilter("ทั้งหมด"); }} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary">
            {visibleFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name} · {farm.location}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          โซน
          <select value={siteFilter} onChange={(event) => { setSiteFilter(event.target.value); setCropFilter("ทั้งหมด"); }} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary">
            <option value="ทั้งหมด">ทุกโซนในฟาร์ม</option>
          {farmSites.map((site) => <option key={site.id} value={site.id}>{site.code} · {site.name}</option>)}
          </select>
        </label>
        <SearchableSelect label="ชนิดพืช" options={cropOptions} value={cropFilter} onChange={setCropFilter} allLabel="พืชทุกชนิด" searchPlaceholder="ค้นหาชนิดหรือพันธุ์พืช" />
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">สถานะสุขภาพ</p>
          <div className="grid grid-cols-2 gap-2">
            {["ทั้งหมด", "สมบูรณ์", "เฝ้าระวัง", "ต้องดูแล"].map((health) => <button key={health} onClick={() => setHealthFilter(health)} className={`min-h-10 rounded-lg border px-2 py-2 text-xs font-semibold ${healthFilter === health ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{health}</button>)}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">กำลังแสดง {filteredPlots.length} จาก {plotsInScope.length} แปลงในขอบเขตที่เลือก</p>
      </Card>

      <div className="space-y-4">
        {filteredPlots.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-2xl">
                {p.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.crop}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="size-3 text-primary/70" /> {p.gps}
                </p>
              </div>
              <Badge tone={p.health > 80 ? "good" : p.health > 65 ? "warn" : "bad"}>
                {p.health > 80 ? "สมบูรณ์" : p.health > 65 ? "เฝ้าระวัง" : "ต้องดูแล"}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-2 text-center">
              <div>
                <p className="text-sm font-semibold">
                  {Math.floor(p.ageMonths / 12) > 0 ? `${Math.floor(p.ageMonths / 12)} ปี ` : ""}
                  {p.ageMonths % 12} ด.
                </p>
                <p className="text-[11px] text-muted-foreground">อายุพืช</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{p.trees}</p>
                <p className="text-[11px] text-muted-foreground">จำนวนต้น</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{p.area.toFixed(1)} ไร่</p>
                <p className="text-[11px] text-muted-foreground">พื้นที่</p>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>สุขภาพต้นไม้</span>
                <span>{p.health}%</span>
              </div>
              <Progress value={p.health} />
            </div>

            <p className="mt-3 text-xs text-muted-foreground">ล่าสุด: {p.lastCare}</p>

            <button
              onClick={() => setOpenDetail(openDetail === p.id ? null : p.id)}
              className="mt-3 w-full rounded-xl border border-border py-2 text-xs font-medium text-primary hover:bg-primary-soft/30 transition-colors"
            >
              {openDetail === p.id ? "ซ่อนประวัติการดูแล" : "ดูประวัติการดูแล"}
            </button>

            {openDetail === p.id ? (
              <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="flex items-center justify-between gap-2"><div><p className="text-xs font-semibold text-foreground">ประวัติการดูแลจากงานที่ปิดแล้ว</p><p className="mt-0.5 text-[10px] text-muted-foreground">งานรายวันและ Work Order คือแหล่งข้อมูลกลางของประวัติแปลง</p></div><Link to="/calendar" className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">สร้างงานดูแล</Link></div>
                {p.history.length ? <ul className="space-y-3 border-l-2 border-primary pl-3">{p.history.map((h, i) => <li key={i} className="text-left"><p className="text-xs font-semibold">{h.action} <span className="font-normal text-muted-foreground">· {h.date}</span></p><p className="text-xs text-muted-foreground mt-0.5">{h.note}</p></li>)}</ul> : <p className="text-xs text-muted-foreground">ยังไม่มีประวัติการดูแล</p>}
              </div>
            ) : null}
          </Card>
        ))}
        {isLoaded && filteredPlots.length === 0 ? <Card className="py-8 text-center text-sm text-muted-foreground">{dragonfly.workspaceContext === "personal" && farmPlots.length === 0 ? "สวนส่วนตัวยังไม่มีแปลง กด “เพิ่มแปลงจากตำแหน่ง GPS” เพื่อเริ่มต้น" : "ไม่พบแปลงที่ตรงกับตัวกรอง เลือก “ทั้งหมด” เพื่อดูทุกแปลง"}</Card> : null}
      </div>

      {/* dialog สำหรับบันทึกพิกัดแปลง */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-[92vw] overflow-y-auto max-h-[85vh] rounded-3xl p-5 gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center flex items-center justify-center gap-2">
              <Sparkles className="size-5 text-primary animate-pulse" />
              เพิ่มแปลงเพาะปลูกใหม่ด้วย GPS
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              ขั้นตอนที่ {step} จาก 3: {step === 1 ? "เลือกวิธีบันทึก" : step === 2 ? "วัดพิกัดและขนาดพื้นที่" : "ข้อมูลเพาะปลูก"}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: เลือกวิธีบันทึกพื้นที่แปลง */}
          {step === 1 && (
            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground text-center">
                กรุณาเลือกวิธีการวัดพื้นที่และบันทึกพิกัดของแปลงเกษตร
              </p>

              <button
                onClick={() => {
                  setMethod("map");
                  setStep(2);
                }}
                className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary hover:bg-primary-soft/20 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:scale-105 transition-transform">
                  <Layers className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">วาดขอบเขตบนแผนที่ดาวเทียม</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ค้นหาแปลงเพาะปลูกของคุณบนภาพดาวเทียม แล้วจิ้มหน้าจอเพื่อวาดและลากปรับปรุงขนาดแปลงแบบเรียลไทม์
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setMethod("walk");
                  setStep(2);
                }}
                className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary hover:bg-primary-soft/20 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:scale-105 transition-transform">
                  <Compass className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">เดินปักหมุดรอบมุมแปลง</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    เดินรอบแปลงแล้วกดปุ่มปักพิกัดตามมุมแปลงจริง ระบบจะวาดแผนที่รูปเหลี่ยมและคำนวณพื้นที่เป็นไร่ให้โดยอัตโนมัติ
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setMethod("point");
                  setStep(2);
                }}
                className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary hover:bg-primary-soft/20 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:scale-105 transition-transform">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">บันทึกจากจุดปัจจุบัน (ปักหมุดตรงกลาง)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ใช้พิกัดตำแหน่งปัจจุบันที่คุณยืนอยู่เป็นพิกัดอ้างอิงแปลง และกรอกตัวเลขพื้นที่แปลงหน่วย ไร่-งาน-ตารางวา ด้วยตนเอง
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: จัดการ GPS พิกัด */}
          {step === 2 && (
            <div className="space-y-4 py-1">
              {/* แสดงสถานะ GPS ปัจจุบัน */}
              <div className="rounded-2xl bg-secondary/60 p-3 flex items-center justify-between border border-border">
                <div className="flex items-center gap-2">
                  <span className={`relative flex h-3 w-3 ${isWatching ? "block" : "hidden"}`}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-foreground">ความแม่นยำพิกัด GPS</p>
                    <p className="text-[10px] text-muted-foreground">
                      {currentLocation
                        ? `±${currentLocation.acc.toFixed(1)} เมตร (${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)})`
                        : "กำลังรับสัญญาณดาวเทียม..."}
                    </p>
                  </div>
                </div>
                {isWatching && (
                  <RefreshCw className="size-4 text-primary animate-spin shrink-0" />
                )}
              </div>

              {gpsError && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 flex items-start gap-2 text-destructive text-[11px]">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* คอนเทนต์ตามโหมด: วาดบนดาวเทียม */}
              {method === "map" && (
                <div className="space-y-3">
                  <SatelliteMapDrawer
                    points={gpsCoords}
                    setPoints={setGpsCoords}
                    centerPoint={currentLocation}
                  />
                  <p className="text-[10px] text-muted-foreground text-center">
                    * แตะบนแผนที่เพื่อเพิ่มปักหมุดมุมแปลง, ลาก Marker ย้ายเพื่อปรับแต่งมุม หรือจิ้มลบด้านล่าง
                  </p>

                  <div className="flex justify-between items-center bg-muted/30 p-2 rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground">จุดปักหมุด: {gpsCoords.length} จุด</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (gpsCoords.length > 0) {
                            setGpsCoords((prev) => prev.slice(0, -1));
                            toast.info("ลบจุดล่าสุดสำเร็จ");
                          }
                        }}
                        disabled={gpsCoords.length === 0}
                        className="text-[10px] text-warning hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="size-2.5" /> ย้อนกลับ 1 จุด
                      </button>
                      <button
                        onClick={handleResetWalk}
                        className="text-[10px] text-destructive hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 className="size-2.5" /> ล้างทั้งหมด
                      </button>
                    </div>
                  </div>

                  {/* แสดงผลการคำนวณพื้นที่แบบสดๆ */}
                  <div className="rounded-2xl border border-primary/30 bg-primary-soft/30 p-3.5 text-center">
                    <p className="text-[11px] text-primary font-medium">คำนวณขนาดพื้นที่รวมบนภาพดาวเทียม</p>
                    <div className="mt-1 flex items-baseline justify-center gap-1 text-primary">
                      <span className="text-2xl font-black">{thaiArea.rai}</span>
                      <span className="text-xs font-semibold mr-2">ไร่</span>
                      <span className="text-2xl font-black">{thaiArea.ngan}</span>
                      <span className="text-xs font-semibold mr-2">งาน</span>
                      <span className="text-2xl font-black">{thaiArea.wa}</span>
                      <span className="text-xs font-semibold">ตร.ว.</span>
                    </div>
                    {gpsCoords.length >= 3 ? (
                      <p className="text-[9px] text-muted-foreground mt-1">
                        ≈ {Math.round(sqmArea).toLocaleString("th-TH")} ตร.ม. (คำนวณแบบสดบนแผนที่)
                      </p>
                    ) : (
                      <p className="text-[9px] text-warning mt-1 flex items-center justify-center gap-1">
                        <BadgeInfo className="size-3" /> แตะบนแผนที่ดาวเทียมอย่างน้อย 3 จุดเพื่อเริ่มวาดขอบเขตแปลง
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* คอนเทนต์ตามโหมด: เดินรอบแปลง */}
              {method === "walk" && (
                <div className="space-y-3">
                  {/* แสดงรูปขอบเขตแปลง */}
                  <PolygonPreview coords={gpsCoords} />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleRecordPoint}
                      disabled={!currentLocation}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <MapPin className="size-3.5" />
                      ปักหมุดจุดมุม ({gpsCoords.length})
                    </button>

                    <button
                      onClick={handleMockStep}
                      className="bg-muted hover:bg-muted/90 text-foreground font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="size-3.5 text-primary animate-pulse" />
                      จำลองปักหมุดถัดไป
                    </button>
                  </div>

                  {gpsCoords.length > 0 && (
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground">จุดปักหมุดล่าสุด: P{gpsCoords.length}</span>
                      <button
                        onClick={handleResetWalk}
                        className="text-[10px] text-destructive hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <RotateCcw className="size-2.5" /> รีเซ็ตจุดทั้งหมด
                      </button>
                    </div>
                  )}

                  {/* แสดงผลการคำนวณพื้นที่แบบสดๆ */}
                  <div className="rounded-2xl border border-primary/30 bg-primary-soft/30 p-3.5 text-center">
                    <p className="text-[11px] text-primary font-medium">คำนวณขนาดพื้นที่รวม</p>
                    <div className="mt-1 flex items-baseline justify-center gap-1 text-primary">
                      <span className="text-2xl font-black">{thaiArea.rai}</span>
                      <span className="text-xs font-semibold mr-2">ไร่</span>
                      <span className="text-2xl font-black">{thaiArea.ngan}</span>
                      <span className="text-xs font-semibold mr-2">งาน</span>
                      <span className="text-2xl font-black">{thaiArea.wa}</span>
                      <span className="text-xs font-semibold">ตร.ว.</span>
                    </div>
                    {gpsCoords.length >= 3 ? (
                      <p className="text-[9px] text-muted-foreground mt-1">
                        ≈ {Math.round(sqmArea).toLocaleString("th-TH")} ตร.ม. (คำนวณจากจุดพิกัดจริง)
                      </p>
                    ) : (
                      <p className="text-[9px] text-warning mt-1 flex items-center justify-center gap-1">
                        <BadgeInfo className="size-3" /> ต้องปักหมุดอย่างน้อย 3 จุดเพื่อเริ่มคำนวณพื้นที่ (มีแล้ว {gpsCoords.length})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* คอนเทนต์ตามโหมด: จุดกึ่งกลาง + ระบุพื้นที่เอง */}
              {method === "point" && (
                <div className="space-y-3.5">
                  <div className="rounded-xl border border-border p-3 space-y-1">
                    <p className="text-xs font-bold text-foreground">พิกัดอ้างอิงของแปลง</p>
                    <p className="text-xs text-muted-foreground">
                      {singlePoint
                        ? `${singlePoint.lat.toFixed(6)}, ${singlePoint.lng.toFixed(6)}`
                        : "กำลังรับพิกัดปัจจุบัน..."}
                    </p>
                    {!singlePoint && (
                      <button
                        onClick={() =>
                          setSinglePoint({
                            lat: 12.6086 + (Math.random() - 0.5) * 0.005,
                            lng: 102.1035 + (Math.random() - 0.5) * 0.005,
                            acc: 5,
                            timestamp: Date.now(),
                          })
                        }
                        className="text-[10px] text-primary hover:underline mt-1 cursor-pointer block"
                      >
                        จำลองพิกัดจุดกึ่งกลาง (Demo)
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground">ระบุขนาดพื้นที่ของแปลง</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={manualRai}
                            onChange={(e) => setManualRai(e.target.value)}
                            className="w-full text-right pr-6 py-2 border border-border rounded-xl text-sm focus:outline-primary"
                          />
                          <span className="absolute right-2 top-2 text-xs text-muted-foreground">ไร่</span>
                        </div>
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={manualNgan}
                            onChange={(e) => setManualNgan(e.target.value)}
                            className="w-full text-right pr-8 py-2 border border-border rounded-xl text-sm focus:outline-primary"
                          />
                          <span className="absolute right-2 top-2 text-xs text-muted-foreground">งาน</span>
                        </div>
                      </div>
                      <div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="0.1"
                            value={manualWa}
                            onChange={(e) => setManualWa(e.target.value)}
                            className="w-full text-right pr-8 py-2 border border-border rounded-xl text-sm focus:outline-primary"
                          />
                          <span className="absolute right-2 top-2 text-xs text-muted-foreground">ตร.ว.</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-1">
                      แปลงเป็นทศนิยมได้: {thaiArea.totalRai.toFixed(2)} ไร่
                    </p>
                  </div>
                </div>
              )}

              {/* ปุ่มนำทาง */}
              <div className="flex gap-2 pt-2 border-t border-border mt-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setMethod(null);
                  }}
                  className="flex-1 border border-border font-semibold text-xs py-2.5 rounded-xl cursor-pointer hover:bg-muted"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={(method === "walk" || method === "map") && gpsCoords.length < 3}
                  className="flex-1 bg-primary text-primary-foreground font-semibold text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-50 hover:opacity-90"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}

          {/* Step 3: ข้อมูลพืชและการดูแล */}
          {step === 3 && (
            <div className="space-y-4 py-1">
              <div className="rounded-xl border border-primary/20 bg-primary-soft/35 p-3">
                <p className="text-xs font-bold text-foreground">ที่ตั้งในโครงสร้างสวน</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">ผูกฟาร์มและโซน เพื่อกรองงาน อากาศ รายงาน และสิทธิ์ต่อไป</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFarmMode("existing")} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${farmMode === "existing" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>เลือกสวนที่มีอยู่</button>
                  <button type="button" onClick={() => { setFarmMode("new"); setSiteMode("new"); }} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${farmMode === "new" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>สร้างสวนใหม่</button>
                </div>
                {farmMode === "existing" ? (
                  <label className="mt-2 block text-xs font-medium text-muted-foreground">สวน
                    <select value={farmFilter} onChange={(event) => { setFarmFilter(event.target.value); setNewPlotSiteId(""); }} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary">
                      {dragonfly.dashboardFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name} · {farm.location}</option>)}
                    </select>
                  </label>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2"><label className="text-xs font-medium text-muted-foreground">ชื่อสวน<input value={newFarmName} onChange={(event) => setNewFarmName(event.target.value)} placeholder="เช่น สวนบ้านคลอง" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" /></label><label className="text-xs font-medium text-muted-foreground">พื้นที่/จังหวัด<input value={newFarmLocation} onChange={(event) => setNewFarmLocation(event.target.value)} placeholder="เช่น จันทบุรี" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" /></label></div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" disabled={farmMode === "new"} onClick={() => setSiteMode("existing")} className={`rounded-lg border px-2 py-2 text-xs font-semibold disabled:opacity-45 ${siteMode === "existing" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>เลือกโซนเดิม</button>
                  <button type="button" onClick={() => setSiteMode("new")} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${siteMode === "new" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>สร้างโซนใหม่</button>
                </div>
                {siteMode === "existing" ? <label className="mt-2 block text-xs font-medium text-muted-foreground">โซนของแปลง<select value={newPlotSiteId} onChange={(event) => setNewPlotSiteId(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"><option value="">ยังไม่ระบุโซน</option>{farmSites.map((site) => <option key={site.id} value={site.id}>{site.code} · {site.name}</option>)}</select></label> : <label className="mt-2 block text-xs font-medium text-muted-foreground">ชื่อโซนใหม่<input value={newSiteName} onChange={(event) => setNewSiteName(event.target.value)} placeholder="เช่น โซนผลผลิต 1" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" /></label>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">ชื่อเรียกแปลง</label>
                <input
                  type="text"
                  placeholder="เช่น แปลงทุเรียนข้างแม่น้ำ, แปลงหลังบ้าน"
                  value={plotName}
                  onChange={(e) => setPlotName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-primary focus:border-primary"
                />
              </div>

              <div className="rounded-xl border border-primary/25 bg-primary-soft/35 p-3">
                <p className="text-xs font-bold text-primary">พืช/ผลไม้ที่ระบบแนะนำสำหรับตำแหน่งนี้</p>
                <p className="mt-1 text-[11px] text-muted-foreground">ประมาณการจากพิกัด GPS ขนาดพื้นที่ และบริบทโซนที่เลือกใน Demo Mode ยังไม่ได้ใช้ผลตรวจดิน แหล่งน้ำ หรือราคาตลาดจริง</p>
                <div className="mt-2 space-y-2">
                  {plantingRecommendations.map((item) => (
                    <button key={item.name} type="button" onClick={() => handleSelectPresetCrop(item.name, item.emoji)} className="flex w-full items-start gap-2 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary">
                      <span className="text-lg">{item.emoji}</span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-foreground">{item.name}</span><span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{item.reason}</span></span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">ชนิดพืชเพาะปลูก</label>
                <SearchableSelect label="เลือกจากชนิดพืชในระบบ" options={cropPresets.map((preset) => ({ value: preset.name, label: `${preset.emoji} ${preset.name}` }))} value={cropPresets.some((preset) => preset.name === cropType) ? cropType : ""} onChange={(name) => { const preset = cropPresets.find((item) => item.name === name); if (preset) handleSelectPresetCrop(preset.name, preset.emoji); }} allLabel="เลือกชนิดพืช" searchPlaceholder="ค้นหาผลไม้หรือพืชเศรษฐกิจ" />
                <div className="grid grid-cols-5 gap-2 mt-2">
                  <div className="col-span-1">
                    <input
                      type="text"
                      maxLength={2}
                      value={cropEmoji}
                      onChange={(e) => setCropEmoji(e.target.value)}
                      className="w-full text-center px-1 py-2 border border-border rounded-xl text-sm focus:outline-primary text-lg"
                      title="ไอคอน / อีโมจิพืช"
                      placeholder="🌱"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="ระบุชนิดพืชหากนอกเหนือรายการพรีเซ็ต"
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-primary"
                    />
                  </div>
                </div>
              </div>

              {/* อายุและจำนวนต้น */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">อายุพืช</label>
                  <div className="flex gap-1 items-center">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        value={ageYears}
                        onChange={(e) => setAgeYears(e.target.value)}
                        className="w-full text-right pr-6 py-2 border border-border rounded-xl text-sm focus:outline-primary"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">ปี</span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={ageMonths}
                        onChange={(e) => setAgeMonths(e.target.value)}
                        className="w-full text-right pr-6 py-2 border border-border rounded-xl text-sm focus:outline-primary"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">เดือน</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">จำนวนพืชรวมในแปลง</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={treeCount}
                      onChange={(e) => setTreeCount(e.target.value)}
                      className="w-full text-right pr-8 py-2 border border-border rounded-xl text-sm focus:outline-primary"
                    />
                    <span className="absolute right-2 top-2 text-xs text-muted-foreground">ต้น</span>
                  </div>
                </div>
              </div>

              {/* สรุปข้อมูลย่อก่อนบันทึก */}
              <div className="rounded-2xl bg-primary-soft/40 p-3 text-xs border border-primary/20 space-y-1.5">
                <p className="font-bold text-primary flex items-center gap-1">
                  <Check className="size-4" /> สรุปข้อมูลแปลงใหม่
                </p>
                <div className="grid grid-cols-2 gap-y-1 text-muted-foreground">
                  <span>พิกัดอ้างอิง:</span>
                  <span className="text-right text-foreground truncate font-medium">
                    {method === "walk" || method === "map"
                      ? `ขอบเขต GPS (${gpsCoords.length} จุด)`
                      : "จุดศูนย์กลาง GPS"}
                  </span>
                  <span>ขนาดพื้นที่:</span>
                  <span className="text-right text-foreground font-bold">
                    {thaiArea.rai} ไร่ {thaiArea.ngan} งาน {thaiArea.wa} ตร.ว. ({thaiArea.totalRai.toFixed(2)} ไร่)
                  </span>
                  <span>พืชที่ปลูก:</span>
                  <span className="text-right text-foreground font-medium">
                    {cropEmoji} {cropType}
                  </span>
                  <span>จำนวนประชากรพืช:</span>
                  <span className="text-right text-foreground font-medium">{treeCount} ต้น</span>
                </div>
              </div>

              {/* ปุ่มบันทึก */}
              <div className="flex gap-2 pt-2 border-t border-border mt-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-border font-semibold text-xs py-2.5 rounded-xl cursor-pointer hover:bg-muted"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleSavePlot}
                  className="flex-1 bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded-xl cursor-pointer hover:opacity-95"
                >
                  บันทึกแปลง
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
