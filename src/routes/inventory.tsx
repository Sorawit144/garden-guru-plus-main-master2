import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Boxes, CheckCircle2, ClipboardCheck, PackageCheck, Plus, ShoppingCart, Truck, UserRoundCog } from "lucide-react";
import { AppShell, Badge, Card, SectionTitle, baht } from "@/components/AppShell";
import { ProAccessGate } from "@/components/ProAccessGate";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import { getInventoryDaysRemaining, getInventoryStatus, getLocalDateKey, getSuggestedOrderQuantity, type InventoryItem, type PurchaseRequest } from "@/lib/dragonfly-data";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "คลังและการจัดซื้อ — EasyPlants" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const dragonfly = useDragonflyData();
  const { persona, state, dashboardFarms, activeDashboardFarm } = dragonfly;
  const [farmId, setFarmId] = useState(activeDashboardFarm.id);
  const [view, setView] = useState<"stock" | "requests" | "workflow">("stock");
  const [category, setCategory] = useState("ทั้งหมด");
  const [stockStatus, setStockStatus] = useState("ทั้งหมด");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestItemId, setRequestItemId] = useState("");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [neededBy, setNeededBy] = useState(getDateAfterDays(4));
  const [requestReason, setRequestReason] = useState("");
  const [adjustingItemId, setAdjustingItemId] = useState<string>();
  const [actualStock, setActualStock] = useState("");

  useEffect(() => setFarmId(activeDashboardFarm.id), [activeDashboardFarm.id]);

  const farmItems = useMemo(() => state.inventoryItems.filter((item) => item.farmId === farmId), [farmId, state.inventoryItems]);
  const filteredItems = farmItems.filter((item) => {
    const itemStatus = getInventoryStatus(item);
    return (category === "ทั้งหมด" || item.category === category) && (stockStatus === "ทั้งหมด" || itemStatus === stockStatus);
  });
  const farmRequests = state.purchaseRequests.filter((request) => request.farmId === farmId);
  const categories = ["ทั้งหมด", ...Array.from(new Set(farmItems.map((item) => item.category)))];
  const pendingCount = farmRequests.filter((request) => request.status === "Pending Approval").length;
  const orderingCount = farmRequests.filter((request) => ["Approved", "Ordered", "Partially Received"].includes(request.status)).length;
  const lowCount = farmItems.filter((item) => getInventoryStatus(item) === "order").length;
  const inventoryValue = farmItems.reduce((sum, item) => sum + item.onHand * item.unitCost, 0);
  const selectedRequestItem = state.inventoryItems.find((item) => item.id === requestItemId);

  if (persona.subscription !== "Farm Pro") {
    return <AppShell title="คลังและการจัดซื้อ" subtitle="ควบคุมสต็อกและใบขอซื้อ"><ProAccessGate feature="คลังและการจัดซื้อ" detail="ติดตามจุดสั่งซื้อ ใบขอซื้อ การอนุมัติ คำสั่งซื้อ และการรับสินค้าเข้าคลังสำหรับสวนที่ทำงานเป็นทีม" /></AppShell>;
  }

  const openRequestForm = (item?: InventoryItem) => {
    const selected = item ?? farmItems[0];
    setRequestItemId(selected?.id ?? "");
    setRequestQuantity(selected ? String(getSuggestedOrderQuantity(selected)) : "");
    setNeededBy(getDateAfterDays(selected?.leadTimeDays ?? 4));
    setRequestReason(selected ? buildRecommendationReason(selected) : "");
    setShowRequestForm(true);
    setView("requests");
  };

  return (
    <AppShell title="คลังและการจัดซื้อ" subtitle="สต็อก → ใบขอซื้อ → อนุมัติ → สั่งซื้อ → รับเข้าคลัง">
      <Card className="border-primary/25 bg-primary-soft/40">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><UserRoundCog className="size-5" /></span>
          <div>
            <p className="text-sm font-semibold text-primary">ใครจัดการข้อมูลในหน้านี้</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">หัวหน้าทีมสร้างคำขอได้ ผู้จัดการฟาร์มอนุมัติ ฝ่ายจัดซื้อออก PO และเจ้าหน้าที่คลังยืนยันรับของ ระบบจะเพิ่มยอดสต็อกเมื่อรับของแล้วเท่านั้น</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <SearchableSelect label="ฟาร์ม" options={dashboardFarms.map((farm) => ({ value: farm.id, label: `${farm.name} · ${farm.location}` }))} value={farmId} onChange={(value) => { setFarmId(value); dragonfly.setActiveDashboardFarm(value); }} searchPlaceholder="ค้นหาชื่อฟาร์มหรือพื้นที่" />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-muted-foreground">หมวดหมู่<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-xs font-semibold text-muted-foreground">สถานะสต็อก<select value={stockStatus} onChange={(event) => setStockStatus(event.target.value)} className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"><option value="ทั้งหมด">ทุกสถานะ</option><option value="order">ต้องสั่ง</option><option value="watch">เฝ้าดู</option><option value="ready">พร้อมใช้</option></select></label>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Card className="text-center"><p className="text-2xl font-bold text-destructive">{lowCount}</p><p className="text-[10px] text-muted-foreground">รายการต้องสั่ง</p></Card>
        <Card className="text-center"><p className="text-2xl font-bold text-primary">{pendingCount}</p><p className="text-[10px] text-muted-foreground">รออนุมัติ</p></Card>
        <Card className="text-center"><p className="text-2xl font-bold text-primary">{orderingCount}</p><p className="text-[10px] text-muted-foreground">กำลังจัดซื้อ</p></Card>
        <Card className="text-center"><p className="text-base font-bold text-foreground">{baht(inventoryValue)}</p><p className="text-[10px] text-muted-foreground">มูลค่าสต็อกคงเหลือ</p></Card>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {([ ["stock", "รายการสต็อก"], ["requests", "ใบขอซื้อ"], ["workflow", "สิทธิ์และขั้นตอน"] ] as const).map(([key, label]) => <button key={key} onClick={() => setView(key)} className={`min-h-11 rounded-lg border px-2 text-xs font-semibold ${view === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{label}</button>)}
      </div>

      {view === "stock" ? <>
        <SectionTitle action={<button onClick={() => openRequestForm()} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />สร้างคำขอซื้อ</button>}>รายการคงเหลือ · {filteredItems.length}</SectionTitle>
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const status = getInventoryStatus(item);
            const days = getInventoryDaysRemaining(item);
            const suggestion = getSuggestedOrderQuantity(item);
            const openRequest = farmRequests.find((request) => request.itemId === item.id && !["Received", "Rejected"].includes(request.status));
            return <Card key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.category} · {item.supplier}</p></div>
                <Badge tone={status === "order" ? "bad" : status === "watch" ? "warn" : "good"}>{status === "order" ? "ต้องสั่ง" : status === "watch" ? "เฝ้าดู" : "พร้อมใช้"}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/55 p-2"><p className="text-base font-bold">{item.onHand}</p><p className="text-[10px] text-muted-foreground">คงเหลือ ({item.unit})</p></div>
                <div className="rounded-lg bg-muted/55 p-2"><p className="text-base font-bold">{item.reorderPoint}</p><p className="text-[10px] text-muted-foreground">จุดสั่งซื้อ</p></div>
                <div className="rounded-lg bg-muted/55 p-2"><p className="text-base font-bold">{days ?? "-"}</p><p className="text-[10px] text-muted-foreground">ใช้ได้อีก (วัน)</p></div>
              </div>
              <p className="mt-3 rounded-lg bg-primary-soft/55 px-3 py-2 text-xs leading-relaxed text-muted-foreground"><strong className="text-primary">คำแนะนำจากกฎระบบ:</strong> {status === "order" ? `ควรสั่ง ${suggestion.toLocaleString("th-TH")} ${item.unit} เพื่อเติมถึงเป้าหมาย ${item.targetStock} ${item.unit}` : status === "watch" ? `ติดตามยอดทุกวัน ระยะเวลารอของ ${item.leadTimeDays} วัน` : `ยอดยังสูงกว่าจุดสั่งซื้อ ${item.reorderPoint} ${item.unit}`}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">ใช้เฉลี่ย {item.averageDailyUsage} {item.unit}/วัน · Lead time {item.leadTimeDays} วัน · อัปเดต {item.updatedAt}</p>
              {adjustingItemId === item.id ? <div className="mt-3 flex gap-2"><input type="number" min="0" value={actualStock} onChange={(event) => setActualStock(event.target.value)} placeholder={`ยอดนับจริง (${item.unit})`} className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs" /><button onClick={() => { const result = dragonfly.updateInventoryStock(item.id, Number(actualStock)); if (!result.ok) return toast.error("กรอกยอดนับจริงตั้งแต่ 0 ขึ้นไป"); setAdjustingItemId(undefined); toast.success("ปรับยอดนับจริงแล้ว"); }} className="rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">บันทึก</button></div> : null}
              <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => { setAdjustingItemId(item.id); setActualStock(String(item.onHand)); }} className="rounded-lg border border-border py-2 text-xs font-semibold">ปรับยอดนับจริง</button>{openRequest ? <button onClick={() => setView("requests")} className="rounded-lg bg-primary-soft py-2 text-xs font-semibold text-primary">{getPurchaseStatusLabel(openRequest.status)}</button> : <button onClick={() => openRequestForm(item)} className="rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">สร้างคำขอซื้อ</button>}</div>
            </Card>;
          })}
          {filteredItems.length === 0 ? <Card className="py-8 text-center text-sm text-muted-foreground">ไม่มีรายการสต็อกที่ตรงกับตัวกรอง</Card> : null}
        </div>
      </> : null}

      {view === "requests" ? <>
        <SectionTitle action={<button onClick={() => openRequestForm()} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" />ใบขอซื้อ</button>}>ใบขอซื้อและคำสั่งซื้อ</SectionTitle>
        {showRequestForm ? <Card className="space-y-3 border-primary/30 bg-primary-soft/35">
          <div><p className="text-sm font-semibold text-primary">สร้างใบขอซื้อ</p><p className="mt-1 text-xs text-muted-foreground">การสร้างใบขอซื้อยังไม่เพิ่มสต็อก ต้องผ่านอนุมัติ สั่งซื้อ และรับสินค้า</p></div>
          <SearchableSelect label="รายการวัสดุ" options={farmItems.map((item) => ({ value: item.id, label: `${item.name} · คงเหลือ ${item.onHand} ${item.unit}` }))} value={requestItemId} onChange={(value) => { const item = farmItems.find((candidate) => candidate.id === value); setRequestItemId(value); if (item) { setRequestQuantity(String(getSuggestedOrderQuantity(item))); setNeededBy(getDateAfterDays(item.leadTimeDays)); setRequestReason(buildRecommendationReason(item)); } }} searchPlaceholder="ค้นหาชื่อวัสดุหรือหมวดหมู่" />
          <div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-muted-foreground">จำนวน<input type="number" min="1" value={requestQuantity} onChange={(event) => setRequestQuantity(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm" /></label><label className="text-xs font-semibold text-muted-foreground">ต้องการใช้ภายใน<input type="date" min={getLocalDateKey()} value={neededBy} onChange={(event) => setNeededBy(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm" /></label></div>
          <textarea rows={3} value={requestReason} onChange={(event) => setRequestReason(event.target.value)} placeholder="เหตุผลและงานที่จะนำไปใช้" className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2"><button onClick={() => setShowRequestForm(false)} className="rounded-lg border border-border py-2.5 text-xs font-semibold">ยกเลิก</button><button onClick={() => { const quantity = Number(requestQuantity); if (!selectedRequestItem || !Number.isFinite(quantity) || quantity <= 0 || !neededBy) return toast.error("เลือกรายการ จำนวน และวันที่ต้องการใช้"); dragonfly.addPurchaseRequest({ farmId, itemId: selectedRequestItem.id, quantity, unit: selectedRequestItem.unit, requestedBy: persona.role, neededBy, reason: requestReason.trim() || "เติมสต็อกตามจุดสั่งซื้อ", supplier: selectedRequestItem.supplier }); setShowRequestForm(false); toast.success("ส่งใบขอซื้อให้ผู้จัดการอนุมัติแล้ว"); }} className="rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground">ส่งขออนุมัติ</button></div>
        </Card> : null}
        <div className="space-y-3">
          {farmRequests.map((request) => {
            const item = state.inventoryItems.find((candidate) => candidate.id === request.itemId);
            return <Card key={request.id}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold">{request.id} · {item?.name ?? request.itemId}</p><p className="mt-1 text-xs text-muted-foreground">{request.quantity.toLocaleString("th-TH")} {request.unit} · ต้องการ {formatDate(request.neededBy)}</p></div><Badge tone={getPurchaseStatusTone(request.status)}>{getPurchaseStatusLabel(request.status)}</Badge></div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{request.reason}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground"><span>ผู้ขอ: {request.requestedBy}</span><span>ผู้อนุมัติ: {request.approvedBy ?? "รอดำเนินการ"}</span><span>ผู้ขาย: {request.supplier ?? item?.supplier ?? "ยังไม่เลือก"}</span><span>PO: {request.orderNumber ?? "ยังไม่ออก"}</span></div>
              {request.status === "Pending Approval" ? <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => dragonfly.updatePurchaseRequestStatus(request.id, "Rejected")} className="rounded-lg border border-destructive/30 py-2 text-xs font-semibold text-destructive">ไม่อนุมัติ</button><button onClick={() => { dragonfly.updatePurchaseRequestStatus(request.id, "Approved", { approvedBy: persona.role }); toast.success("อนุมัติใบขอซื้อแล้ว"); }} className="rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">อนุมัติคำขอ</button></div> : null}
              {request.status === "Approved" ? <button onClick={() => { dragonfly.updatePurchaseRequestStatus(request.id, "Ordered", { supplier: item?.supplier, orderNumber: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` }); toast.success("ออกคำสั่งซื้อแล้ว"); }} className="mt-3 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">ออกคำสั่งซื้อ (PO)</button> : null}
              {request.status === "Ordered" ? <button onClick={() => { dragonfly.receivePurchaseRequest(request.id); toast.success(`รับสินค้าและเพิ่มสต็อก ${request.quantity} ${request.unit} แล้ว`); }} className="mt-3 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">ยืนยันรับสินค้าเข้าคลัง</button> : null}
            </Card>;
          })}
          {farmRequests.length === 0 ? <Card className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีใบขอซื้อของฟาร์มนี้</Card> : null}
        </div>
      </> : null}

      {view === "workflow" ? <>
        <SectionTitle>ผู้รับผิดชอบแต่ละขั้น</SectionTitle>
        <div className="space-y-3">
          {[
            { icon: ClipboardCheck, title: "1. ขอซื้อ", role: "หัวหน้าทีม / ผู้จัดการโซน", detail: "เลือกวัสดุ จำนวน วันที่ต้องใช้ และอ้างอิงงานหรือแผนผลิต" },
            { icon: CheckCircle2, title: "2. อนุมัติ", role: "ผู้จัดการฟาร์ม / ผู้มีอำนาจอนุมัติ", detail: "ตรวจงบประมาณ สต็อกคงเหลือ และความจำเป็นก่อนอนุมัติ" },
            { icon: ShoppingCart, title: "3. สั่งซื้อ", role: "ฝ่ายจัดซื้อ", detail: "เลือกผู้ขาย ออกเลข PO และติดตามกำหนดส่ง" },
            { icon: PackageCheck, title: "4. รับเข้าคลัง", role: "เจ้าหน้าที่คลัง / ผู้รับของ", detail: "ตรวจจำนวนและสภาพสินค้า แล้วจึงเพิ่มยอดคงเหลือในระบบ" },
          ].map((step) => <Card key={step.title} className="flex items-start gap-3"><step.icon className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{step.title}</p><p className="mt-1 text-xs font-semibold text-primary">{step.role}</p><p className="mt-1 text-xs text-muted-foreground">{step.detail}</p></div></Card>)}
        </div>
        <Card className="border-primary/25 bg-primary-soft/35"><p className="text-sm font-semibold text-primary">สิทธิ์ปรับแต่งได้ตามองค์กร</p><p className="mt-1 text-xs text-muted-foreground">ค่าเริ่มต้นแยกผู้ขอ ผู้อนุมัติ ผู้สั่งซื้อ และผู้รับของเพื่อลดความผิดพลาด องค์กรขนาดเล็กสามารถให้ผู้จัดการคนเดียวทำหลายขั้นได้ แต่ระบบควรเก็บ audit log ทุกครั้ง</p><Link to="/settings" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">จัดการ Role และสิทธิ์ <Truck className="size-3.5" /></Link></Card>
      </> : null}

      <Card className="flex items-start gap-3 bg-muted/50"><Boxes className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">Demo Mode</p><p className="mt-1 text-xs text-muted-foreground">ข้อมูลบันทึกใน Local Storage การใช้งานจริงต้องมีฐานข้อมูล สิทธิ์ฝั่งเซิร์ฟเวอร์ เลข PO ไม่ซ้ำ audit log และการเชื่อมบัญชี/ERP</p></div></Card>
    </AppShell>
  );
}

function buildRecommendationReason(item: InventoryItem) {
  const days = getInventoryDaysRemaining(item);
  return `คงเหลือ ${item.onHand} ${item.unit} ต่ำกว่าจุดสั่งซื้อ ${item.reorderPoint} ${item.unit}${days !== undefined ? ` และคาดว่าใช้ได้อีก ${days} วัน` : ""}; ระยะเวลารอของ ${item.leadTimeDays} วัน`;
}

function getDateAfterDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}

function getPurchaseStatusLabel(status: PurchaseRequest["status"]) {
  return ({ Draft: "ฉบับร่าง", "Pending Approval": "รออนุมัติ", Approved: "อนุมัติแล้ว", Ordered: "สั่งซื้อแล้ว", "Partially Received": "รับบางส่วน", Received: "รับเข้าคลังแล้ว", Rejected: "ไม่อนุมัติ" } as Record<string, string>)[status];
}

function getPurchaseStatusTone(status: PurchaseRequest["status"]): "good" | "warn" | "bad" | "info" | "muted" {
  if (status === "Received") return "good";
  if (status === "Rejected") return "bad";
  if (["Approved", "Ordered", "Partially Received"].includes(status)) return "info";
  if (status === "Pending Approval") return "warn";
  return "muted";
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
