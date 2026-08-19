import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Sun, Wind, RefreshCw, Compass } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { stageAlerts } from "@/lib/farm-data";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { usePlots } from "@/hooks/usePlots";
import { SearchableSelect } from "@/components/SearchableSelect";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "สภาพอากาศสวน — สวนอัจฉริยะ" },
      { name: "description", content: "อุณหภูมิ ฝน ความชื้น ลม ค่า UV และการแจ้งเตือนฝนสำหรับพื้นที่สวนของคุณ" },
      { property: "og:title", content: "สภาพอากาศสวน — สวนอัจฉริยะ" },
      { property: "og:description", content: "พยากรณ์อากาศรายชั่วโมงและ 5 วัน พร้อมเตือนฝนตกหนัก" },
    ],
  }),
  component: WeatherPage,
});

// ฟังก์ชันแกะพิกัด Latitude, Longitude จากสตริง GPS
function parseCoordinates(gpsStr: string) {
  const match = gpsStr.match(/(-?\d+\.\d+).*?,\s*(-?\d+\.\d+)/);
  if (match && match[1] && match[2]) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
    };
  }
  return { lat: 12.6086, lng: 102.1035 }; // พิกัดจันทบุรีตั้งต้น
}

function WeatherPage() {
  const dragonfly = useDragonflyData();
  const { plots } = usePlots();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plotFilter, setPlotFilter] = useState("");
  const [siteId, setSiteId] = useState("ทั้งหมด");
  const [forecastRange, setForecastRange] = useState("5d");
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number }>();

  const selectedSite = dragonfly.state.sites.find((site) => site.id === siteId);
  const scopedPlots = useMemo(() => siteId === "ทั้งหมด" ? plots : plots.filter((plot) => selectedSite?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix))), [plots, selectedSite, siteId]);
  const plotOptions = useMemo(() => scopedPlots.map((plot) => ({ value: plot.id, label: `${plot.id} · ${plot.name} · ${plot.crop}` })), [scopedPlots]);
  const selectedPlot = useMemo(() => plots.find((plot) => plot.id === plotFilter.split(" · ")[0]), [plots, plotFilter]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setCurrentPosition({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: false, timeout: 5_000, maximumAge: 10 * 60_000 }
    );
  }, []);

  useEffect(() => {
    if (!scopedPlots.length || scopedPlots.some((plot) => plot.id === plotFilter)) return;
    if (!currentPosition) {
      setPlotFilter(scopedPlots[0]?.id ?? "");
      return;
    }
    const closest = scopedPlots.reduce((best, plot) => distanceKm(parseCoordinates(plot.gps), currentPosition) < distanceKm(parseCoordinates(best.gps), currentPosition) ? plot : best, scopedPlots[0]!);
    setPlotFilter(closest.id);
  }, [currentPosition, plotFilter, scopedPlots]);

  // เลือกพิกัดอิงตามแปลงแรกของผู้ใช้ (หรือจันทบุรี)
  const coords = useMemo(() => {
    if (selectedPlot) {
      return parseCoordinates(selectedPlot.gps);
    }
    if (plots && plots.length > 0 && plots[0]) {
      return parseCoordinates(plots[0].gps);
    }
    return { lat: 12.6086, lng: 102.1035 };
  }, [plots, selectedPlot]);

  const activePlotName = useMemo(() => {
    if (selectedPlot) {
      return selectedPlot.name;
    }
    if (plots && plots.length > 0 && plots[0]) {
      return plots[0].name;
    }
    return "พื้นที่แปลงหลัก (จันทบุรี)";
  }, [plots, selectedPlot]);

  useEffect(() => {
    if (dragonfly.isDemoMode) {
      setWeatherData({
        ...dragonfly.state.weather,
        emoji: dragonfly.state.weather.rainChance > 50 ? "🌧️" : "⛅",
      });
      setLoading(false);
      return;
    }

    let active = true;
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
        );
        const data = await res.json();
        if (!active) return;

        const current = data.current;
        const weatherCode = current.weather_code;

        // แมปโมดูล Weather Code ของ Open-Meteo กับคำไทยและอีโมจิ
        const codeMap: Record<number, { text: string; emoji: string }> = {
          0: { text: "แดดจัด ฟ้าใส", emoji: "☀️" },
          1: { text: "ฟ้าโปร่ง", emoji: "🌤️" },
          2: { text: "มีเมฆบางส่วน", emoji: "⛅" },
          3: { text: "มีเมฆครึ้ม", emoji: "☁️" },
          45: { text: "มีหมอกหนา", emoji: "🌫️" },
          48: { text: "มีหมอกและน้ำค้างแข็ง", emoji: "🌫️" },
          51: { text: "ฝนตกปรอยๆ", emoji: "🌧️" },
          53: { text: "ฝนตกปรอยๆ", emoji: "🌧️" },
          55: { text: "ฝนตกปรอยๆ หนาแน่น", emoji: "🌧️" },
          61: { text: "ฝนตกเบาบาง", emoji: "🌧️" },
          63: { text: "ฝนตกปานกลาง", emoji: "🌧️" },
          65: { text: "ฝนตกหนัก", emoji: "🌧️" },
          80: { text: "ฝนไล่ช้างตกเบา", emoji: "🌦️" },
          81: { text: "ฝนไล่ช้างตกปานกลาง", emoji: "🌦️" },
          82: { text: "ฝนไล่ช้างตกหนัก", emoji: "🌦️" },
          95: { text: "พายุฝนฟ้าคะนอง", emoji: "⛈️" },
          96: { text: "พายุฟ้าคะนองพร้อมลูกเห็บตก", emoji: "⛈️" },
          99: { text: "พายุฟ้าคะนองพร้อมลูกเห็บตกหนัก", emoji: "⛈️" },
        };

        const currentInfo = codeMap[weatherCode] || { text: "มีเมฆบางส่วน", emoji: "⛅" };

        // ดึง 6 ชั่วโมงถัดไป
        const hourly = [];
        const now = new Date();
        const currentHourIndex = data.hourly.time.findIndex((t: string) => {
          const d = new Date(t);
          return d.getHours() === now.getHours() && d.getDate() === now.getDate();
        }) || 0;

        for (let i = 0; i < 6; i++) {
          const idx = currentHourIndex + i;
          if (data.hourly.time[idx]) {
            const timeStr = new Date(data.hourly.time[idx]).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            });
            hourly.push({
              t: timeStr,
              temp: Math.round(data.hourly.temperature_2m[idx]),
              rain: data.hourly.precipitation_probability[idx] || 0,
            });
          }
        }

        // ดึงพยากรณ์ล่วงหน้า 5 วัน
        const daily = [];
        const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์"];
        for (let i = 0; i < 5; i++) {
          if (data.daily.time[i]) {
            const dateObj = new Date(data.daily.time[i]);
            const isToday = i === 0;
            const isTomorrow = (d: Date) => {
              const tom = new Date();
              tom.setDate(tom.getDate() + 1);
              return d.getDate() === tom.getDate() && d.getMonth() === tom.getMonth();
            };
            const dayLabel = isToday ? "วันนี้" : isTomorrow(dateObj) ? "พรุ่งนี้" : days[dateObj.getDay()];
            const code = data.daily.weather_code[i];
            const info = codeMap[code] || { text: "มีเมฆบางส่วน", emoji: "⛅" };

            daily.push({
              d: dayLabel,
              hi: Math.round(data.daily.temperature_2m_max[i]),
              lo: Math.round(data.daily.temperature_2m_min[i]),
              rain: data.daily.precipitation_probability_max[i] || 0,
              icon: info.emoji,
            });
          }
        }

        setWeatherData({
          temp: Math.round(current.temperature_2m),
          condition: currentInfo.text,
          emoji: currentInfo.emoji,
          humidity: current.relative_humidity_2m,
          wind: current.wind_speed_10m,
          uv: current.uv_index || 0,
          rainChance: hourly[0]?.rain || 0,
          hourly,
          daily,
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch weather: ", err);
        setLoading(false);
      }
    };

    fetchWeather();
    return () => {
      active = false;
    };
  }, [coords, dragonfly.isDemoMode, dragonfly.state.weather]);

  if (loading || !weatherData) {
    return (
      <AppShell title="สภาพอากาศ" subtitle={dragonfly.isDemoMode ? "กำลังโหลดข้อมูลอากาศตัวอย่าง..." : "กำลังโหลดข้อมูลสภาพอากาศจริง..."}>
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <RefreshCw className="size-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">เชื่อมต่อดาวเทียมตรวจพยากรณ์อากาศ...</p>
        </div>
      </AppShell>
    );
  }

  const w = weatherData;

  return (
    <AppShell
      title="สภาพอากาศ"
      subtitle={dragonfly.isDemoMode ? `Demo weather · อิงตาม ${activePlotName}` : `อิงตามแปลง: ${activePlotName}`}
    >
      <Card className="space-y-3 border-primary/25 bg-primary-soft/45 p-4">
        <label className="block text-xs font-semibold text-primary">ฟาร์มที่กำลังดู<select value={dragonfly.activeDashboardFarm.id} onChange={(event) => setActiveFarmAndReset(event.target.value, dragonfly.setActiveDashboardFarm, setSiteId, setPlotFilter)} className="mt-1.5 block w-full rounded-lg border border-primary/20 bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary">{dragonfly.dashboardFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name} · {farm.location}</option>)}</select></label>
        <label className="block text-xs font-semibold text-primary">โซน<select value={siteId} onChange={(event) => { setSiteId(event.target.value); setPlotFilter(""); }} className="mt-1.5 block w-full rounded-lg border border-primary/20 bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"><option value="ทั้งหมด">ทุกโซนในฟาร์ม</option>{dragonfly.state.sites.map((site) => <option key={site.id} value={site.id}>{site.code} · {site.name}</option>)}</select></label>
        <SearchableSelect label="แปลง/จุดตรวจอากาศ" options={plotOptions} value={plotFilter} onChange={setPlotFilter} allLabel="กำลังเลือกจุดตรวจ" searchPlaceholder="ค้นหารหัส ชื่อแปลง หรือพืช" />
        <label className="block text-xs font-semibold text-primary">ช่วงพยากรณ์<select value={forecastRange} onChange={(event) => setForecastRange(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-primary/20 bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary"><option value="24h">24 ชั่วโมงข้างหน้า</option><option value="5d">5 วันข้างหน้า</option><option value="7d">7 วันข้างหน้า</option></select></label>
        <p className="text-[11px] text-muted-foreground">{currentPosition ? "เลือกแปลงที่ใกล้หมุดปัจจุบันที่สุดเป็นค่าเริ่มต้น" : "ไม่พบสิทธิ์ตำแหน่ง จึงใช้จุดตรวจหลักของขอบเขตที่เลือก"} · {dragonfly.isDemoMode ? "Demo Mode ใช้ชุดพยากรณ์จำลอง" : "API Mode ใช้พิกัด GPS ของแปลงที่เลือก"}</p>
      </Card>
      <Card className="bg-primary border-0 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-5xl font-bold">{w.temp}°</p>
            <p className="mt-1 text-sm text-primary-foreground/85">{w.condition}</p>
          </div>
          <span className="text-6xl">{w.emoji}</span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { l: "ความชื้น", v: `${w.humidity}%` },
            { l: "ลม", v: `${Math.round(w.wind)} กม/ชม` },
            { l: "ดัชนี UV", v: `${Math.round(w.uv)}` },
            { l: "ฝนวันนี้", v: `${w.rainChance}%` },
          ].map((i) => (
            <div key={i.l} className="rounded-xl bg-white/15 py-2">
              <p className="text-sm font-bold">{i.v}</p>
              <p className="text-[10px] text-primary-foreground/80">{i.l}</p>
            </div>
          ))}
        </div>
      </Card>

      {w.rainChance > 50 ? (
        <Card className="flex items-start gap-3 border-primary/30 bg-primary/10">
          <span className="text-xl">⛈️</span>
          <div>
            <p className="text-sm font-semibold">แจ้งเตือนฝน</p>
            <p className="text-xs text-muted-foreground">
              มีโอกาสเกิดฝนตกสูง ({w.rainChance}%) ในพื้นที่สวนของคุณ ควรงดฉีดพ่นเคมีภัณฑ์เพราะจะโดนน้ำฝนชะล้าง
            </p>
          </div>
        </Card>
      ) : (
        <Card className="flex items-start gap-3 border-emerald-500/30 bg-emerald-500/10">
          <span className="text-xl">☀️</span>
          <div>
            <p className="text-sm font-semibold">สภาพอากาศเหมาะสม</p>
            <p className="text-xs text-muted-foreground">
              ท้องฟ้าแจ่มใส ลมสงบ เหมาะสมกับการใส่ปุ๋ย รดน้ำ และฉีดบำรุงทางใบ
            </p>
          </div>
        </Card>
      )}

      {dragonfly.isDemoMode ? (
        <Card className="border-warning/40 bg-warning/10">
          <p className="text-sm font-semibold">ข้อมูลตัวอย่างสำหรับ Demo Mode</p>
          <p className="mt-1 text-xs text-muted-foreground">
            หน้านี้ไม่เรียก weather API ภายนอกใน Demo Mode เพื่อให้แอปรันได้โดยไม่มี infrastructure หรือ internet dependency
          </p>
        </Card>
      ) : null}

      <SectionTitle>เตือนก่อนลงมือทำงาน</SectionTitle>
      <div className="space-y-3">
        {stageAlerts.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-lg">
                {a.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{a.stage}</p>
                  <Badge tone={a.tone}>{a.verdict}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.plot} · {a.when}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>{forecastRange === "24h" ? "รายชั่วโมง 24 ชั่วโมงข้างหน้า" : "รายชั่วโมง"}</SectionTitle>
      <Card>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {w.hourly.slice(0, forecastRange === "24h" ? 6 : 6).map((h: any, idx: number) => (
            <div key={idx} className="min-w-16 rounded-xl bg-muted/60 px-3 py-2 text-center">
              <p className="text-[11px] text-muted-foreground">{h.t}</p>
              <p className="text-sm font-semibold">{h.temp}°</p>
              <p className="text-[11px] text-primary">ฝน {h.rain}%</p>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>พยากรณ์ {forecastRange === "24h" ? "วันนี้" : forecastRange === "7d" ? "7 วัน" : "5 วัน"}</SectionTitle>
      <Card className="space-y-3">
        {w.daily.slice(0, forecastRange === "24h" ? 1 : forecastRange === "7d" ? 7 : 5).map((d: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="w-20 text-sm">{d.d}</span>
            <span className="text-lg">{d.icon}</span>
            <span className="flex-1 text-xs text-primary">ฝน {d.rain}%</span>
            <span className="text-sm font-medium">
              {d.hi}° <span className="text-muted-foreground">{d.lo}°</span>
            </span>
          </div>
        ))}
      </Card>

      <SectionTitle>ผลต่อการทำสวน</SectionTitle>
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <Droplets className="size-5 text-primary" />
          <p className="text-sm">
            {w.rainChance > 50
              ? "งดรดน้ำในวันนี้ ประหยัดน้ำและพลังงานเครื่องสูบได้ทันที"
              : "ควรเปิดระบบสปริงเกอร์รดน้ำช่วงเช้า/เย็น ตามปกติ"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Wind className="size-5 text-primary" />
          <p className="text-sm">
            {w.wind > 15
              ? `ลมแรงประมาณ ${Math.round(w.wind)} กม/ชม หลีกเลี่ยงการฉีดพ่นยาเพื่อกันละอองฟุ้งกระจาย`
              : `ลมสงบโชยอ่อน (${Math.round(w.wind)} กม/ชม) ฉีดพ่นบำรุงพืชทางใบได้เหมาะสม`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Sun className="size-5 text-primary" />
          <p className="text-sm">
            {w.uv > 6
              ? `UV ระดับสูง (${Math.round(w.uv)}) เกษตรกรควรสวมหมวกและทำกิจกรรมในร่มหลังเวลา 10:00 น.`
              : `UV ระดับต่ำถึงปานกลาง ทำงานกลางแจ้งได้ยาวขึ้น`}
          </p>
        </div>
      </Card>
    </AppShell>
  );
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function setActiveFarmAndReset(farmId: string, setFarm: (farmId: string) => void, setSite: (siteId: string) => void, setPlot: (plotId: string) => void) {
  setFarm(farmId);
  setSite("ทั้งหมด");
  setPlot("");
}
