import { useState, useEffect } from "react";
import { plots as initialPlots, type Plot } from "@/lib/farm-data";
import { useDragonflyData } from "@/hooks/useDragonflyData";

export function usePlots() {
  const dragonfly = useDragonflyData();
  const [plots, setPlots] = useState<Plot[]>(initialPlots);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (dragonfly.isDemoMode) {
      setPlots(dragonfly.state.plots);
      setIsLoaded(true);
      return;
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("garden_guru_plots");
      if (stored) {
        try {
          setPlots(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored plots", e);
        }
      } else {
        localStorage.setItem("garden_guru_plots", JSON.stringify(initialPlots));
      }
      setIsLoaded(true);
    }
  }, [dragonfly.isDemoMode, dragonfly.state.plots]);

  const addPlot = (newPlot: Omit<Plot, "id" | "health" | "lastCare" | "history">, structure?: { newFarm?: { id: string; name: string; location: string }; newSite?: { id: string; farmId?: string; code: string; name: string } }) => {
    if (dragonfly.isDemoMode) {
      dragonfly.addPlot(newPlot, structure);
      return;
    }

    const fullPlot: Plot = {
      ...newPlot,
      id: "p_" + Date.now(),
      health: 100, // Default to 100% health for new plots
      lastCare: "เพิ่งเพิ่มแปลงใหม่วันนี้",
      history: [
        {
          date: new Date().toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          action: "สร้างแปลงใหม่",
          note: "สร้างแปลงพิกัดจาก GPS สำเร็จ",
        },
      ],
    };

    let currentPlots = plots;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("garden_guru_plots");
      if (stored) {
        try {
          currentPlots = JSON.parse(stored);
        } catch (e) {}
      }
    }

    const updated = [...currentPlots, fullPlot];
    setPlots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("garden_guru_plots", JSON.stringify(updated));
      window.dispatchEvent(new Event("plots_updated"));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleUpdate = () => {
      const stored = localStorage.getItem("garden_guru_plots");
      if (stored) {
        try {
          setPlots(JSON.parse(stored));
        } catch (e) {}
      }
    };
    window.addEventListener("plots_updated", handleUpdate);
    return () => window.removeEventListener("plots_updated", handleUpdate);
  }, []);

  return { plots, addPlot, isLoaded };
}
