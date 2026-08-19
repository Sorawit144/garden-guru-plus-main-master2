import { createFileRoute } from "@tanstack/react-router";
import { Send, Mic, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { BrandMark } from "@/components/BrandMark";
import { usePlots } from "@/hooks/usePlots";
import { assistantSuggestions } from "@/lib/farm-data";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Farm Assistant — สวนอัจฉริยะ" },
      {
        name: "description",
        content: "ถามตอบเรื่องการดูแลพืช ปุ๋ย และสารเคมี กับผู้ช่วย AI ภาษาไทย",
      },
      { property: "og:title", content: "AI Farm Assistant — สวนอัจฉริยะ" },
      { property: "og:description", content: "ผู้ช่วย AI ตอบคำถามการเกษตรเป็นภาษาไทยตลอด 24 ชม." },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "ai"; text: string };

// ฐานข้อมูลความรู้เกษตรภาษาไทย (ไม่ใช้ IoT)
const KNOWLEDGE_BASE: { keywords: string[]; answer: (ctx: FarmContext) => string }[] = [
  {
    keywords: ["แปลง", "มีกี่แปลง", "สวน", "ไร่", "ทั้งหมด"],
    answer: (ctx) =>
      ctx.plots.length === 0
        ? "ยังไม่มีข้อมูลแปลงในระบบครับ กรุณาเพิ่มแปลงก่อนในเมนูแปลงของฉัน 🌱"
        : `สวนของคุณมีทั้งหมด ${ctx.plots.length} แปลง รวมพื้นที่ ${ctx.totalArea} ไร่ และต้นพืชรวม ${ctx.totalTrees} ต้นครับ\n\nรายละเอียด:\n${ctx.plots.map((p) => `• ${p.emoji} ${p.name} (${p.crop}) — ${p.area} ไร่ สุขภาพ ${p.health}%`).join("\n")}`,
  },
  {
    keywords: ["สุขภาพ", "สภาพ", "พืช", "แข็งแรง", "สุขภาวะ"],
    answer: (ctx) => {
      if (ctx.plots.length === 0) return "ยังไม่มีข้อมูลแปลงในระบบครับ";
      const weak = ctx.plots.filter((p) => p.health < 70);
      if (weak.length === 0) {
        return `พืชในสวนทุกแปลงมีสุขภาพดีครับ 💪 ค่าเฉลี่ยสุขภาพรวม ${ctx.avgHealth}% — ยังคงรักษาความสม่ำเสมอในการดูแลต่อไปนะครับ`;
      }
      return `พบแปลงที่ต้องเฝ้าระวัง ${weak.length} แปลงครับ:\n${weak.map((p) => `• ${p.name} สุขภาพ ${p.health}% — ควรตรวจสอบอาการเพิ่มเติม`).join("\n")}\n\nแนะนำให้ใช้ระบบ AI ตรวจโรคพืชในเมนูวินิจฉัยครับ 🔍`;
    },
  },
  {
    keywords: ["กำไร", "รายได้", "รายจ่าย", "บัญชี", "ต้นทุน", "เงิน", "รายการ"],
    answer: (ctx) =>
      ctx.income === 0 && ctx.cost === 0
        ? "ยังไม่มีข้อมูลบัญชีในระบบครับ ลองเพิ่มรายรับ-รายจ่ายในเมนูบัญชีต้นทุนก่อนนะครับ"
        : `ยอดสรุปบัญชีปัจจุบัน:\n💚 รายรับรวม: ${ctx.income.toLocaleString("th-TH")} บาท\n❌ รายจ่ายรวม: ${ctx.cost.toLocaleString("th-TH")} บาท\n📊 กำไรสุทธิ: ${(ctx.income - ctx.cost).toLocaleString("th-TH")} บาท\n\nสามารถดูรายละเอียดได้ในเมนูบัญชีต้นทุนครับ`,
  },
  {
    keywords: ["ทุเรียน", "หมอนทอง", "โต", "ออกผล", "ขาย"],
    answer: () =>
      "ทุเรียนหมอนทองจะเริ่มออกดอกเมื่ออายุ 3-4 ปี และให้ผลผลิตเต็มที่ตั้งแต่ปีที่ 5 ขึ้นไปครับ\n\n📌 จุดสังเกตช่วงเก็บเกี่ยว:\n• ก้านผลเริ่มหดตัวและเป็นสีน้ำตาล\n• รอยแยกระหว่างพูขยายชัด\n• เคาะผลได้ยินเสียงทึบ\n\n🕐 ระยะเวลาก่อนเก็บ: 90-100 วัน หลังดอกบาน",
  },
  {
    keywords: ["มังคุด", "ยางใน", "ผลแตก", "แห้ง"],
    answer: () =>
      "ปัญหาหลักของมังคุดที่พบบ่อยคือเนื้อในแข็งและยางไหล เกิดจากความชื้นดินไม่สม่ำเสมอครับ\n\n✅ วิธีป้องกัน:\n• ให้น้ำสม่ำเสมอ โดยเฉพาะช่วง 4-6 สัปดาห์ก่อนเก็บเกี่ยว\n• ฉีดพ่น Calcium Chloride 0.5% ทุก 2 สัปดาห์\n• คลุมโคนต้นด้วยฟางเพื่อรักษาความชื้น\n• หลีกเลี่ยงปุ๋ยไนโตรเจนสูงในช่วงออกผล",
  },
  {
    keywords: ["ลำไย", "ใบเหลือง", "ขาดธาตุ", "แมกนีเซียม"],
    answer: () =>
      "ใบเหลืองในลำไยมักเกิดจากการขาดธาตุ Magnesium ครับ\n\n💊 วิธีแก้ไข:\n• พ่น Epsom Salt (MgSO₄) ความเข้มข้น 1-2% ทางใบทุก 2 สัปดาห์\n• ใส่ปูนโดโลไมต์เพื่อปรับ pH ดินให้อยู่ที่ 5.5-6.5\n• ตรวจวิเคราะห์ดินเพื่อยืนยันค่าธาตุอาหาร\n• งดการรดน้ำมากเกินไปจนดินแฉะ",
  },
  {
    keywords: ["ปุ๋ย", "ใส่", "สูตร", "อัตรา", "เมื่อไหร่"],
    answer: () =>
      "การใส่ปุ๋ยที่ถูกต้องช่วยเพิ่มผลผลิตได้มากครับ ขึ้นอยู่กับระยะการเจริญเติบโต:\n\n🌱 ระยะแตกใบอ่อน: ปุ๋ยสูตร N สูง เช่น 46-0-0 หรือ 21-0-0\n🌸 ระยะออกดอก: ปุ๋ยสูตร P สูง เช่น 0-46-0 หรือ 8-24-24\n🍈 ระยะติดผล-อ้วน: ปุ๋ยสูตร K สูง เช่น 0-0-60 หรือ 13-13-21\n🏁 หลังเก็บเกี่ยว: ปุ๋ยอินทรีย์ + สูตรบำรุงต้น\n\n📏 อัตราทั่วไป: 0.5-1 กก./ต้น/ครั้ง ขึ้นกับขนาดต้น",
  },
  {
    keywords: ["ฝน", "รด", "น้ำ", "ชลประทาน", "สปริงเกอร์", "ช่วงไหน"],
    answer: () =>
      "การให้น้ำที่เหมาะสมสำคัญมากครับ:\n\n⏰ เวลาที่ดีที่สุด: ช่วงเช้า 6:00-8:00 น. หรือเย็น 17:00-18:30 น.\n💧 ปริมาณ: 50-100 ลิตร/ต้น/ครั้ง (ต้นโต)\n📅 ความถี่: ทุก 2-3 วัน ช่วงแล้ง, ทุก 5-7 วัน ช่วงมีฝน\n🚫 หลีกเลี่ยง: รดตอนกลางวันแดดจัด น้ำจะระเหยและใบอาจไหม้",
  },
  {
    keywords: ["โรค", "เชื้อรา", "แมลง", "ศัตรู", "ยา", "ฉีด"],
    answer: () =>
      "การจัดการโรคและแมลงศัตรูพืชแบบ IPM:\n\n🔍 ขั้นตอนที่ 1: ตรวจสวนทุกสัปดาห์ สังเกตอาการผิดปกติ\n📸 ขั้นตอนที่ 2: ถ่ายรูปและใช้ระบบ AI ตรวจโรคในแอปนี้\n🌿 ขั้นตอนที่ 3: เริ่มด้วยสารชีวภัณฑ์ก่อน (Trichoderma, Bacillus)\n💊 ขั้นตอนที่ 4: ใช้สารเคมีเมื่อจำเป็น ตามคำแนะนำบนฉลาก\n⚠️ สำคัญ: ปฏิบัติตาม PHI (ระยะหยุดยา) ก่อนเก็บเกี่ยวเสมอ",
  },
  {
    keywords: ["ราคา", "ตลาด", "ขาย", "กิโล", "บาท"],
    answer: () =>
      "ราคาผลไม้อ้างอิงตลาดล่าสุด (ปีปัจจุบัน):\n\n🥇 ทุเรียนหมอนทอง A: 180-220 บาท/กก.\n🥭 มังคุดชั้น 1: 65-80 บาท/กก.\n🍈 ลำไยอ่อนสด: 25-40 บาท/กก.\n\n💡 เคล็ดลับ: ขายตรงกับโรงงานหรือผู้ส่งออกได้ราคาสูงกว่าพ่อค้าคนกลาง 15-25%\nติดตามราคาจริงได้ที่เว็บ ACFS หรือแอปตลาดเกษตรกร",
  },
  {
    keywords: ["สวัสดี", "หวัดดี", "ดีใจ", "ยังไง", "เป็นยังไง"],
    answer: (ctx) =>
      `สวัสดีครับ! 🌱 ผมคือผู้ช่วยเกษตรอัจฉริยะ พร้อมช่วยดูแลสวนของคุณเสมอครับ\n${ctx.plots.length > 0 ? `\nขณะนี้ผมมีข้อมูลสวนของคุณ ${ctx.plots.length} แปลง รวม ${ctx.totalArea} ไร่ — พร้อมตอบคำถามได้เลยครับ! 😊` : "\nลองถามผมเรื่องการดูแลพืช ปุ๋ย โรค หรือราคาตลาดได้เลยนะครับ"}`,
  },
];

type FarmContext = {
  plots: any[];
  totalArea: number;
  totalTrees: number;
  avgHealth: number;
  income: number;
  cost: number;
};

function buildContext(plots: any[], transactions: any[]): FarmContext {
  return {
    plots,
    totalArea: plots.reduce((s, p) => s + p.area, 0),
    totalTrees: plots.reduce((s, p) => s + p.trees, 0),
    avgHealth:
      plots.length > 0 ? Math.round(plots.reduce((s, p) => s + p.health, 0) / plots.length) : 0,
    income: transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    cost: Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
  };
}

function getBotReply(text: string, ctx: FarmContext): string {
  const lower = text.toLowerCase();
  for (const kb of KNOWLEDGE_BASE) {
    if (kb.keywords.some((kw) => lower.includes(kw))) {
      return kb.answer(ctx);
    }
  }
  // context-aware fallback
  if (ctx.plots.length > 0) {
    const plotNames = ctx.plots.map((p) => p.name).join(", ");
    return `ขอบคุณที่ถามนะครับ 🌿 ขณะนี้ผมดูแลแปลง "${plotNames}" ของคุณอยู่ครับ\n\nลองถามเรื่องเหล่านี้ได้เลย:\n• ข้อมูลแปลงและไร่\n• การใส่ปุ๋ยแต่ละระยะ\n• การป้องกันโรคและแมลง\n• การให้น้ำที่เหมาะสม\n• สรุปบัญชีรายรับ-รายจ่าย`;
  }
  return "สวัสดีครับ! ผมพร้อมช่วยตอบทุกคำถามการเกษตรครับ 🌱\nลองถามเรื่อง ปุ๋ย โรคพืช การให้น้ำ หรือราคาตลาดได้เลยครับ";
}

function AssistantPage() {
  const { plots } = usePlots();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("garden_guru_transactions");
      if (stored) {
        try {
          setTransactions(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  // Build initial greeting with real context
  useEffect(() => {
    const ctx = buildContext(plots, transactions);
    setMessages([
      {
        role: "ai",
        text:
          plots.length > 0
            ? `สวัสดีครับ ผมคือผู้ช่วยเกษตรอัจฉริยะ 🌱\nผมเห็นสวนของคุณ ${plots.length} แปลง รวม ${ctx.totalArea} ไร่ พืชสุขภาพเฉลี่ย ${ctx.avgHealth}% ครับ\nถามได้เลยนะครับ เรื่องปุ๋ย โรค น้ำ หรือบัญชีรายรับ-รายจ่าย`
            : "สวัสดีครับ ผมคือผู้ช่วยเกษตรอัจฉริยะ 🌱\nถามได้เลยครับ เรื่องโรคพืช ปุ๋ย การให้น้ำ หรือราคาผลผลิต",
      },
    ]);
  }, [plots, transactions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    setTimeout(() => {
      const ctx = buildContext(plots, transactions);
      const reply = getBotReply(q, ctx);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
      setLoading(false);
    }, 700);
  };

  const clearChat = () => {
    const ctx = buildContext(plots, transactions);
    setMessages([
      {
        role: "ai",
        text: `เริ่มการสนทนาใหม่แล้วครับ 🌱\n${plots.length > 0 ? `สวนของคุณมี ${plots.length} แปลง รวม ${ctx.totalArea} ไร่ ถามได้เลยครับ` : "ถามได้เลยครับ เรื่องการเกษตรทุกชนิด"}`,
      },
    ]);
  };

  return (
    <AppShell title="ผู้ช่วย AI เกษตร" subtitle="ถามตอบภาษาไทย ตลอด 24 ชั่วโมง">
      {/* header action */}
      <div className="flex justify-end">
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50"
        >
          <RefreshCw className="size-3" /> เคลียร์แชท
        </button>
      </div>

      {/* messages */}
      <div className="space-y-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-2"}>
            {m.role === "ai" && <BrandMark size="sm" className="rounded-full" />}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
                m.role === "user"
                  ? "bg-primary rounded-br-sm text-primary-foreground"
                  : "rounded-bl-sm bg-muted text-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <BrandMark size="sm" className="rounded-full" />
            <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-3">
              <div className="flex gap-1">
                <span
                  className="size-2 rounded-full bg-primary/40 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="size-2 rounded-full bg-primary/40 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="size-2 rounded-full bg-primary/40 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* quick suggestions */}
      <div className="flex flex-wrap gap-2 pt-1 pb-2">
        {assistantSuggestions.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 cursor-pointer hover:border-primary/50 hover:text-primary transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="fixed right-0 bottom-20 left-0 z-20 mx-auto flex w-full max-w-md gap-2 px-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์คำถามของคุณ…"
          className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm shadow-[var(--shadow-card)] outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          aria-label="ส่งข้อความ"
          className="bg-primary flex size-12 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-card)] cursor-pointer"
        >
          <Send className="size-5" />
        </button>
      </form>
      <div className="h-16" />
    </AppShell>
  );
}
