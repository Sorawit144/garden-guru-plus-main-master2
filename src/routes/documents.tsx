import { createFileRoute } from "@tanstack/react-router";
import { FileText, FolderCog, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, Badge, Card, SectionTitle } from "@/components/AppShell";
import { ProAccessGate } from "@/components/ProAccessGate";
import { SearchableSelect } from "@/components/SearchableSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDragonflyData } from "@/hooks/useDragonflyData";
import type { DocumentCategory, FarmDocument } from "@/lib/dragonfly-data";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "ศูนย์เอกสาร — EasyPlants" },
      {
        name: "description",
        content: "จัดเก็บ อนุมัติ และเชื่อมเอกสารกับสวน แปลง งาน และล็อตผลผลิต",
      },
    ],
  }),
  component: DocumentsPage,
});

const categories: DocumentCategory[] = [
  "การผลิต",
  "สารเคมีและ PHI",
  "QA และ Compliance",
  "ใบรับรอง",
  "การขายและส่งออก",
  "ภัยพิบัติ",
  "รายงานจากระบบ",
];

function DocumentsPage() {
  const { persona, state, dashboardFarms, addDocument, addDocumentType, updateDocumentStatus } =
    useDragonflyData();
  const [view, setView] = useState<"documents" | "types">("documents");
  const [showForm, setShowForm] = useState(false);
  const [farmFilter, setFarmFilter] = useState("ทั้งหมด");
  const [categoryFilter, setCategoryFilter] = useState("ทั้งหมด");
  const [typeFilter, setTypeFilter] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState("");
  const [farmId, setFarmId] = useState("FARM-PRIMARY");
  const [siteId, setSiteId] = useState("");
  const [plotId, setPlotId] = useState("");
  const [lotId, setLotId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState("");
  const [fileName, setFileName] = useState("");
  const [notes, setNotes] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeCategory, setNewTypeCategory] = useState<DocumentCategory>("การผลิต");
  const [requiredFor, setRequiredFor] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [tracksExpiry, setTracksExpiry] = useState(false);
  const canManage = ["owner", "commercial", "export"].includes(persona.id);

  const effectiveStatus = (document: FarmDocument) =>
    document.expiresAt && document.expiresAt < new Date().toISOString().slice(0, 10)
      ? "Expired"
      : document.status;
  const filteredDocuments = useMemo(
    () =>
      state.documents.filter((document) => {
        const text =
          `${document.title} ${document.documentNumber ?? ""} ${document.lotId ?? ""} ${document.fileName ?? ""}`.toLocaleLowerCase(
            "th-TH",
          );
        return (
          (farmFilter === "ทั้งหมด" || document.farmId === farmFilter) &&
          (categoryFilter === "ทั้งหมด" || document.category === categoryFilter) &&
          (typeFilter === "ทั้งหมด" || document.typeId === typeFilter) &&
          (statusFilter === "ทั้งหมด" || effectiveStatus(document) === statusFilter) &&
          text.includes(query.trim().toLocaleLowerCase("th-TH"))
        );
      }),
    [categoryFilter, farmFilter, query, state.documents, statusFilter, typeFilter],
  );
  const selectedType = state.documentTypes.find((type) => type.id === typeId);
  const sites = Array.from(
    new Map([
      ...state.sites
        .filter((site) => (site.farmId ?? "FARM-PRIMARY") === farmId)
        .map(
          (site) =>
            [
              site.id,
              { id: site.id, code: site.code, name: site.name, plotPrefixes: site.plotPrefixes },
            ] as const,
        ),
      ...state.traceability
        .filter((lot) => lot.farmId === farmId && lot.siteId)
        .map(
          (lot) =>
            [
              lot.siteId!,
              {
                id: lot.siteId!,
                code: lot.siteId!,
                name: lot.siteName ?? lot.siteId!,
                plotPrefixes: [] as string[],
              },
            ] as const,
        ),
    ]).values(),
  );
  const plots = Array.from(
    new Map([
      ...state.plots
        .filter(
          (plot) =>
            (plot.farmId ?? "FARM-PRIMARY") === farmId &&
            (!siteId ||
              plot.siteId === siteId ||
              sites
                .find((site) => site.id === siteId)
                ?.plotPrefixes.some((prefix) => plot.id.startsWith(prefix))),
        )
        .map((plot) => [plot.id, { id: plot.id, name: plot.name }] as const),
      ...state.traceability
        .filter((lot) => lot.farmId === farmId && (!siteId || lot.siteId === siteId))
        .map((lot) => [lot.plot, { id: lot.plot, name: `${lot.plot} · ${lot.crop}` }] as const),
    ]).values(),
  );
  const lots = state.traceability.filter(
    (lot) =>
      (lot.farmId ?? "FARM-PRIMARY") === farmId &&
      (!siteId || lot.siteId === siteId) &&
      (!plotId || lot.plot === plotId),
  );
  const pendingCount = state.documents.filter(
    (document) => effectiveStatus(document) === "Pending Review",
  ).length;
  const expiredCount = state.documents.filter(
    (document) => effectiveStatus(document) === "Expired",
  ).length;

  if (persona.subscription !== "Farm Pro")
    return (
      <AppShell title="ศูนย์เอกสาร" subtitle="ไฟล์ หลักฐาน Compliance และรายงาน">
        <ProAccessGate
          feature="ศูนย์เอกสารองค์กร"
          detail="จัดเก็บไฟล์ เชื่อมเอกสารกับล็อต ควบคุมสิทธิ์ อนุมัติ และติดตามวันหมดอายุ"
        />
      </AppShell>
    );

  return (
    <AppShell title="ศูนย์เอกสาร" subtitle="เอกสารต้นฉบับ · หลักฐาน · รายงานที่สร้างจากระบบ">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Card>
          <p className="text-lg font-bold text-primary">{state.documents.length}</p>
          <p className="text-[10px] text-muted-foreground">เอกสารทั้งหมด</p>
        </Card>
        <Card>
          <p className="text-lg font-bold text-primary">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground">รอตรวจ</p>
        </Card>
        <Card>
          <p className="text-lg font-bold text-destructive">{expiredCount}</p>
          <p className="text-[10px] text-muted-foreground">หมดอายุ</p>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["documents", "เอกสารทั้งหมด"],
            ["types", "ประเภทเอกสาร"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`min-h-11 rounded-lg border text-xs font-semibold ${view === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {message ? (
        <Card className="border-primary/25 bg-primary-soft/45 text-xs text-primary">{message}</Card>
      ) : null}

      {view === "documents" ? (
        <>
          <SectionTitle
            action={
              canManage ? (
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setFormError("");
                    setShowForm(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                >
                  <Plus className="size-3.5" />
                  ลงเอกสาร
                </button>
              ) : undefined
            }
          >
            ค้นหาและติดตาม
          </SectionTitle>
          <Card className="space-y-3">
            <label className="block text-xs font-medium text-muted-foreground">
              ค้นหา
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ชื่อ เลขที่เอกสาร Lot หรือชื่อไฟล์"
                className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <SearchableSelect
              label="สวน/ฟาร์ม"
              options={[
                "ทั้งหมด",
                ...dashboardFarms.map((farm) => ({
                  value: farm.id,
                  label: `${farm.name} · ${farm.location}`,
                })),
              ]}
              value={farmFilter}
              onChange={setFarmFilter}
              allLabel="ทุกสวน"
              searchPlaceholder="ค้นหาสวน"
            />
            <SearchableSelect
              label="หมวดหมู่"
              options={["ทั้งหมด", ...categories]}
              value={categoryFilter}
              onChange={setCategoryFilter}
              allLabel="ทุกหมวดหมู่"
              searchPlaceholder="ค้นหาหมวดหมู่"
            />
            <SearchableSelect
              label="ประเภทเอกสาร"
              options={[
                "ทั้งหมด",
                ...state.documentTypes
                  .filter(
                    (type) => categoryFilter === "ทั้งหมด" || type.category === categoryFilter,
                  )
                  .map((type) => ({ value: type.id, label: type.name })),
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              allLabel="ทุกประเภท"
              searchPlaceholder="ค้นหาประเภทเอกสาร"
            />
            <SearchableSelect
              label="สถานะ"
              options={[
                { value: "ทั้งหมด", label: "ทุกสถานะ" },
                { value: "Draft", label: "ฉบับร่าง" },
                { value: "Pending Review", label: "รอตรวจ" },
                { value: "Approved", label: "อนุมัติแล้ว" },
                { value: "Rejected", label: "ไม่ผ่าน" },
                { value: "Expired", label: "หมดอายุ" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              allLabel="ทุกสถานะ"
              searchPlaceholder="ค้นหาสถานะ"
            />
            <p className="text-xs text-muted-foreground">พบ {filteredDocuments.length} เอกสาร</p>
          </Card>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-h-[90dvh] w-[94vw] max-w-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ลงทะเบียนเอกสารใหม่</DialogTitle>
                <DialogDescription>
                  Demo Mode เก็บชื่อไฟล์และข้อมูลกำกับ ยังไม่ได้อัปโหลดไฟล์ไปพื้นที่จัดเก็บจริง
                </DialogDescription>
              </DialogHeader>
              <label className="block text-xs font-medium text-muted-foreground">
                ชื่อเอกสาร
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <SearchableSelect
                label="ประเภทเอกสาร"
                options={state.documentTypes.map((type) => ({
                  value: type.id,
                  label: `${type.name} · ${type.category}`,
                }))}
                value={typeId}
                onChange={setTypeId}
                searchPlaceholder="ค้นหาประเภทเอกสาร"
              />
              <SearchableSelect
                label="สวน/ฟาร์ม"
                options={dashboardFarms.map((farm) => ({ value: farm.id, label: farm.name }))}
                value={farmId}
                onChange={(value) => {
                  setFarmId(value);
                  setSiteId("");
                  setPlotId("");
                  setLotId("");
                }}
                searchPlaceholder="ค้นหาสวน"
              />
              <SearchableSelect
                label="โซน"
                options={[
                  { value: "", label: "ไม่ระบุโซน" },
                  ...sites.map((site) => ({
                    value: site.id,
                    label: `${site.code} · ${site.name}`,
                  })),
                ]}
                value={siteId}
                onChange={(value) => {
                  setSiteId(value);
                  setPlotId("");
                  setLotId("");
                }}
                allLabel="ไม่ระบุโซน"
                searchPlaceholder="ค้นหาโซน"
              />
              <SearchableSelect
                label="แปลง"
                options={[
                  { value: "", label: "ไม่ระบุแปลง" },
                  ...plots.map((plot) => ({ value: plot.id, label: `${plot.id} · ${plot.name}` })),
                ]}
                value={plotId}
                onChange={(value) => {
                  setPlotId(value);
                  setLotId("");
                }}
                allLabel="ไม่ระบุแปลง"
                searchPlaceholder="ค้นหาแปลง"
              />
              <SearchableSelect
                label="Lot ที่เกี่ยวข้อง"
                options={[
                  { value: "", label: "ไม่ผูกกับ Lot" },
                  ...lots.map((lot) => ({ value: lot.lotId, label: `${lot.lotId} · ${lot.crop}` })),
                ]}
                value={lotId}
                onChange={setLotId}
                allLabel="ไม่ผูกกับ Lot"
                searchPlaceholder="ค้นหา Lot"
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted-foreground">
                  เลขที่เอกสาร
                  <input
                    value={documentNumber}
                    onChange={(event) => setDocumentNumber(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-2 text-xs"
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  วันที่ออก
                  <input
                    type="date"
                    value={issuedAt}
                    onChange={(event) => setIssuedAt(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-2 text-xs"
                  />
                </label>
              </div>
              {selectedType?.tracksExpiry ? (
                <label className="block text-xs text-muted-foreground">
                  วันหมดอายุ
                  <input
                    type="date"
                    min={issuedAt}
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-2 text-xs"
                  />
                </label>
              ) : null}
              <label className="block rounded-lg border border-dashed border-primary/40 bg-card p-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Upload className="size-4 text-primary" />
                  เลือกไฟล์หลักฐาน
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                  onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
                  className="mt-2 block w-full text-xs"
                />
                {fileName ? <span className="mt-1 block text-primary">{fileName}</span> : null}
              </label>
              <label className="block text-xs text-muted-foreground">
                หมายเหตุ
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs"
                />
              </label>
              {formError ? (
                <p className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                  {formError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (!title.trim() || !selectedType || !issuedAt) {
                    setFormError("กรอกชื่อ เลือกประเภทเอกสาร และวันที่ออกให้ครบ");
                    return;
                  }
                  addDocument({
                    title: title.trim(),
                    typeId: selectedType.id,
                    category: selectedType.category,
                    source: "upload",
                    farmId,
                    siteId: siteId || undefined,
                    plotId: plotId || undefined,
                    lotId: lotId || undefined,
                    documentNumber: documentNumber.trim() || undefined,
                    issuedAt,
                    expiresAt: expiresAt || undefined,
                    fileName: fileName || undefined,
                    status: selectedType.requiresApproval ? "Pending Review" : "Approved",
                    uploadedBy: persona.role,
                    notes: notes.trim() || undefined,
                  });
                  setMessage(
                    `ลงทะเบียน “${title.trim()}” แล้ว${selectedType.requiresApproval ? " และส่งให้ผู้มีสิทธิ์ตรวจ" : ""}`,
                  );
                  setTitle("");
                  setTypeId("");
                  setDocumentNumber("");
                  setExpiresAt("");
                  setFileName("");
                  setNotes("");
                  setShowForm(false);
                }}
                className="min-h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
              >
                บันทึกเอกสาร
              </button>
            </DialogContent>
          </Dialog>
          <SectionTitle>รายการเอกสาร</SectionTitle>
          <div className="space-y-3">
            {filteredDocuments.map((document) => {
              const status = effectiveStatus(document);
              const type = state.documentTypes.find((item) => item.id === document.typeId);
              return (
                <Card key={document.id}>
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <FileText className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{document.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {type?.name ?? document.category} ·{" "}
                            {document.documentNumber ?? document.id}
                          </p>
                        </div>
                        <DocumentStatus status={status} />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        สวน{" "}
                        {dashboardFarms.find((farm) => farm.id === document.farmId)?.name ??
                          "ไม่ระบุ"}
                        {document.plotId ? ` · แปลง ${document.plotId}` : ""}
                        {document.lotId ? ` · Lot ${document.lotId}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        ออก {formatDate(document.issuedAt)}
                        {document.expiresAt ? ` · หมดอายุ ${formatDate(document.expiresAt)}` : ""} ·
                        โดย {document.uploadedBy}
                      </p>
                      {document.fileName ? (
                        <button
                          onClick={() =>
                            setMessage(
                              `เปิดไฟล์ตัวอย่าง: ${document.fileName} · ระบบจริงจะตรวจสิทธิ์และเปิดไฟล์จาก Object Storage`,
                            )
                          }
                          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary"
                        >
                          <FileText className="size-3.5" />
                          {document.fileName}
                        </button>
                      ) : (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          รายการข้อมูลจากระบบ · ไม่มีไฟล์แนบ
                        </p>
                      )}
                      {status === "Pending Review" && canManage ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => updateDocumentStatus(document.id, "Rejected")}
                            className="rounded-lg border border-border py-2 text-xs font-semibold"
                          >
                            ไม่ผ่าน
                          </button>
                          <button
                            onClick={() => {
                              updateDocumentStatus(document.id, "Approved", persona.role);
                              setMessage(`อนุมัติ ${document.title} แล้ว`);
                            }}
                            className="rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground"
                          >
                            อนุมัติ
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
            {filteredDocuments.length === 0 ? (
              <Card className="py-8 text-center text-sm text-muted-foreground">
                ไม่พบเอกสารตามตัวกรอง
              </Card>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <SectionTitle>ประเภทเอกสารขององค์กร</SectionTitle>
          <Card className="space-y-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              หมวดหมู่หลักใช้ร่วมกันทั้งระบบ ส่วนประเภทเอกสารปรับตามขั้นตอนของบริษัทได้
              เพื่อกำหนดการอนุมัติ วันหมดอายุ และจุดที่ต้องใช้เอกสาร
            </p>
            {canManage ? (
              <>
                <label className="block text-xs text-muted-foreground">
                  ชื่อประเภทเอกสาร
                  <input
                    value={newTypeName}
                    onChange={(event) => setNewTypeName(event.target.value)}
                    placeholder="เช่น แบบตรวจสวน QA-A01"
                    className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                  />
                </label>
                <SearchableSelect
                  label="หมวดหมู่"
                  options={categories}
                  value={newTypeCategory}
                  onChange={(value) => setNewTypeCategory(value as DocumentCategory)}
                  searchPlaceholder="ค้นหาหมวดหมู่"
                />
                <label className="block text-xs text-muted-foreground">
                  ใช้กับขั้นตอนใด
                  <input
                    value={requiredFor}
                    onChange={(event) => setRequiredFor(event.target.value)}
                    placeholder="เช่น ล็อตก่อนส่งออก"
                    className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(event) => setRequiresApproval(event.target.checked)}
                  />
                  ต้องมีผู้อนุมัติ
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={tracksExpiry}
                    onChange={(event) => setTracksExpiry(event.target.checked)}
                  />
                  ติดตามวันหมดอายุ
                </label>
                <button
                  onClick={() => {
                    const result = addDocumentType({
                      name: newTypeName,
                      category: newTypeCategory,
                      requiredFor: requiredFor.trim() || "กำหนดโดยองค์กร",
                      requiresApproval,
                      tracksExpiry,
                    });
                    setMessage(
                      result.ok
                        ? `สร้างประเภทเอกสาร “${result.documentType.name}” แล้ว`
                        : result.reason,
                    );
                    if (result.ok) {
                      setNewTypeName("");
                      setRequiredFor("");
                    }
                  }}
                  className="min-h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
                >
                  <FolderCog className="mr-1.5 inline size-4" />
                  สร้างประเภทเอกสาร
                </button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                เฉพาะ Owner/Admin หรือผู้จัดการที่ได้รับสิทธิ์เท่านั้นที่สร้างประเภทเอกสารได้
              </p>
            )}
          </Card>
          <div className="space-y-2">
            {state.documentTypes.map((type) => (
              <Card key={type.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{type.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {type.category} · ใช้กับ {type.requiredFor}
                    </p>
                    <p className="mt-1 text-[11px] text-primary">
                      {type.requiresApproval ? "ต้องอนุมัติ" : "ไม่ต้องอนุมัติ"}
                      {type.tracksExpiry ? " · ติดตามวันหมดอายุ" : ""}
                    </p>
                  </div>
                  <Badge tone={type.builtIn ? "muted" : "info"}>
                    {type.builtIn ? "มาตรฐานระบบ" : "องค์กรกำหนด"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}

function DocumentStatus({ status }: { status: FarmDocument["status"] }) {
  const labels: Record<FarmDocument["status"], string> = {
    Draft: "ฉบับร่าง",
    "Pending Review": "รอตรวจ",
    Approved: "อนุมัติแล้ว",
    Rejected: "ไม่ผ่าน",
    Expired: "หมดอายุ",
  };
  return (
    <Badge
      tone={
        status === "Approved"
          ? "good"
          : status === "Rejected" || status === "Expired"
            ? "bad"
            : "warn"
      }
    >
      {labels[status]}
    </Badge>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
