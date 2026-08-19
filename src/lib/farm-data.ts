// ข้อมูลตัวอย่างสำหรับแอปจัดการสวน (mock data)

export type Plot = {
  id: string;
  /** Farm and zone ownership make operational filters and access scoping unambiguous. */
  farmId?: string;
  siteId?: string;
  name: string;
  crop: string;
  emoji: string;
  ageMonths: number;
  trees: number;
  area: number; // ไร่
  health: number; // 0-100
  gps: string;
  lastCare: string;
  history: { date: string; action: string; note: string }[];
};

export const plots: Plot[] = [
  {
    id: "p1",
    name: "แปลงทุเรียนหลังบ้าน",
    crop: "ทุเรียนหมอนทอง",
    emoji: "🥭",
    ageMonths: 62,
    trees: 120,
    area: 8,
    health: 88,
    gps: "13.7563° N, 100.5018° E",
    lastCare: "ใส่ปุ๋ยสูตร 8-24-24 เมื่อ 5 วันก่อน",
    history: [
      { date: "2 ส.ค. 2569", action: "ใส่ปุ๋ย", note: "สูตร 8-24-24 อัตรา 2 กก./ต้น" },
      { date: "28 ก.ค. 2569", action: "ฉีดพ่นยา", note: "ป้องกันเชื้อรารากเน่า" },
      { date: "20 ก.ค. 2569", action: "ตัดแต่งกิ่ง", note: "ตัดกิ่งน้ำค้างและกิ่งแห้ง" },
    ],
  },
  {
    id: "p2",
    name: "แปลงมังคุดริมคลอง",
    crop: "มังคุด",
    emoji: "🍇",
    ageMonths: 96,
    trees: 80,
    area: 5,
    health: 72,
    gps: "13.7601° N, 100.4972° E",
    lastCare: "รดน้ำเมื่อ 2 วันก่อน",
    history: [
      { date: "5 ส.ค. 2569", action: "รดน้ำ", note: "ระบบสปริงเกอร์ 45 นาที" },
      { date: "25 ก.ค. 2569", action: "ใส่ปุ๋ยคอก", note: "3 กก./ต้น" },
    ],
  },
  {
    id: "p3",
    name: "แปลงลำไยแปลงใหม่",
    crop: "ลำไยอีดอ",
    emoji: "🌰",
    ageMonths: 18,
    trees: 200,
    area: 12,
    health: 61,
    gps: "13.7712° N, 100.5130° E",
    lastCare: "พบใบเหลือง รอการวิเคราะห์",
    history: [
      { date: "6 ส.ค. 2569", action: "ตรวจโรค", note: "พบอาการขาดธาตุแมกนีเซียม" },
      { date: "1 ส.ค. 2569", action: "กำจัดวัชพืช", note: "ตัดหญ้ารอบโคนต้น" },
    ],
  },
];

export const todayTasks = [
  { id: "t1", title: "รดน้ำแปลงลำไย", time: "06:00", plot: "แปลงลำไยแปลงใหม่", type: "รดน้ำ", done: true },
  { id: "t2", title: "ฉีดพ่นป้องกันเพลี้ยไฟ", time: "07:30", plot: "แปลงทุเรียนหลังบ้าน", type: "ฉีดยา", done: false },
  { id: "t3", title: "ใส่ปุ๋ยทางใบ", time: "16:00", plot: "แปลงมังคุดริมคลอง", type: "ใส่ปุ๋ย", done: false },
];

export const notifications = [
  { id: "n1", type: "โรคระบาด", title: "เตือนโรครากเน่าโคนเน่าระบาดในพื้นที่", time: "10 นาทีที่แล้ว", level: "สูง" },
  { id: "n2", type: "ฝน", title: "คาดว่าจะมีฝนตกหนักช่วง 15:00-18:00", time: "1 ชม.ที่แล้ว", level: "กลาง" },
  { id: "n3", type: "ดินแห้ง", title: "ความชื้นดินแปลงลำไยต่ำกว่า 35%", time: "3 ชม.ที่แล้ว", level: "กลาง" },
  { id: "n4", type: "ใส่ปุ๋ย", title: "ถึงรอบใส่ปุ๋ยแปลงมังคุดริมคลอง", time: "เมื่อวาน", level: "ต่ำ" },
  { id: "n5", type: "ลมแรง", title: "ลมกระโชกแรง 35 กม./ชม. ควรค้ำกิ่ง", time: "เมื่อวาน", level: "กลาง" },
];

export const weather = {
  now: { temp: 32, condition: "มีเมฆบางส่วน", humidity: 74, wind: 12, uv: 8, rainChance: 65 },
  hourly: [
    { t: "12:00", temp: 33, rain: 10 },
    { t: "13:00", temp: 34, rain: 20 },
    { t: "14:00", temp: 34, rain: 40 },
    { t: "15:00", temp: 32, rain: 75 },
    { t: "16:00", temp: 30, rain: 80 },
    { t: "17:00", temp: 29, rain: 60 },
  ],
  daily: [
    { d: "วันนี้", hi: 34, lo: 26, rain: 65, icon: "🌦️" },
    { d: "พรุ่งนี้", hi: 33, lo: 26, rain: 80, icon: "🌧️" },
    { d: "อาทิตย์", hi: 35, lo: 27, rain: 20, icon: "⛅" },
    { d: "จันทร์", hi: 35, lo: 27, rain: 10, icon: "☀️" },
    { d: "อังคาร", hi: 34, lo: 26, rain: 30, icon: "⛅" },
  ],
};

export const recommendations = [
  {
    id: "r1",
    title: "วันนี้ยังไม่ต้องรดน้ำ",
    answer: "ไม่ควร",
    tone: "warn",
    reason: "คาดว่าฝนตก 65% ช่วงบ่าย และความชื้นดินอยู่ที่ 68% ซึ่งเพียงพอ",
    icon: "💧",
  },
  {
    id: "r2",
    title: "ควรใส่ปุ๋ยแปลงมังคุด",
    answer: "ควรทำ",
    tone: "good",
    reason: "ครบรอบ 21 วันหลังใส่ปุ๋ยครั้งล่าสุด และอยู่ในระยะสะสมอาหาร",
    icon: "🌿",
  },
  {
    id: "r3",
    title: "เลื่อนการฉีดพ่นสารออกไป",
    answer: "ไม่ควร",
    tone: "warn",
    reason: "ลม 12 กม./ชม. และมีโอกาสฝนตก ทำให้สารชะล้าง ควรฉีดพรุ่งนี้เช้า",
    icon: "🧴",
  },
  {
    id: "r4",
    title: "ทุเรียนใกล้เก็บเกี่ยว",
    answer: "อีก 12 วัน",
    tone: "info",
    reason: "อายุผล 108 วันหลังดอกบาน เก็บเกี่ยวที่ 120 วันเพื่อคุณภาพสูงสุด",
    icon: "🧺",
  },
];

export const calendarTasks = [
  { date: "7", day: "ศ", tasks: [{ title: "ฉีดพ่นป้องกันเพลี้ยไฟ", type: "ฉีดยา" }, { title: "ใส่ปุ๋ยทางใบ", type: "ใส่ปุ๋ย" }] },
  { date: "8", day: "ส", tasks: [{ title: "รดน้ำแปลงทุเรียน", type: "รดน้ำ" }] },
  { date: "9", day: "อา", tasks: [] },
  { date: "10", day: "จ", tasks: [{ title: "ใส่ปุ๋ยสูตร 8-24-24", type: "ใส่ปุ๋ย" }] },
  { date: "11", day: "อ", tasks: [{ title: "ตรวจโรคแปลงลำไย", type: "ฉีดยา" }] },
  { date: "12", day: "พ", tasks: [] },
  { date: "13", day: "พฤ", tasks: [{ title: "เริ่มเก็บเกี่ยวมังคุด", type: "เก็บเกี่ยว" }] },
];

export const transactions = [
  { id: "c1", date: "5 ส.ค.", title: "ขายทุเรียนล็อต 3", category: "รายได้", amount: 84000 },
  { id: "c2", date: "4 ส.ค.", title: "ค่าปุ๋ย 8-24-24 (10 กระสอบ)", category: "ปุ๋ย", amount: -12500 },
  { id: "c3", date: "2 ส.ค.", title: "ค่าแรงคนงาน 4 คน", category: "แรงงาน", amount: -4800 },
  { id: "c4", date: "1 ส.ค.", title: "ขายมังคุดคละเกรด", category: "รายได้", amount: 23500 },
  { id: "c5", date: "30 ก.ค.", title: "ค่าน้ำมันเครื่องสูบน้ำ", category: "พลังงาน", amount: -1800 },
  { id: "c6", date: "28 ก.ค.", title: "สารป้องกันเชื้อรา", category: "สารเคมี", amount: -3600 },
];

export const costBreakdown = [
  { name: "ปุ๋ย", value: 12500, color: "var(--chart-3)" },
  { name: "แรงงาน", value: 4800, color: "var(--chart-1)" },
  { name: "สารเคมี", value: 3600, color: "var(--chart-4)" },
  { name: "พลังงาน", value: 1800, color: "var(--chart-2)" },
];

export const monthlyFinance = [
  { month: "มี.ค.", income: 42000, cost: 18000 },
  { month: "เม.ย.", income: 58000, cost: 21000 },
  { month: "พ.ค.", income: 96000, cost: 27000 },
  { month: "มิ.ย.", income: 74000, cost: 19500 },
  { month: "ก.ค.", income: 88000, cost: 24500 },
  { month: "ส.ค.", income: 107500, cost: 22700 },
];

export const yieldForecast = [
  { plot: "แปลงทุเรียนหลังบ้าน", kg: 9600, pricePerKg: 120, confidence: 88 },
  { plot: "แปลงมังคุดริมคลอง", kg: 5200, pricePerKg: 45, confidence: 81 },
  { plot: "แปลงลำไยแปลงใหม่", kg: 3100, pricePerKg: 32, confidence: 64 },
];

export const yieldTrend = [
  { year: "2565", kg: 9800 },
  { year: "2566", kg: 11200 },
  { year: "2567", kg: 13400 },
  { year: "2568", kg: 15100 },
  { year: "2569*", kg: 17900 },
];

export const diagnoseResult = {
  disease: "โรคใบไหม้จากเชื้อรา Phytophthora",
  confidence: 92,
  severity: "ปานกลาง",
  pest: "พบร่องรอยเพลี้ยไฟเล็กน้อย",
  nutrient: "ขาดธาตุแมกนีเซียม (Mg) ระดับเริ่มต้น",
  treatment: [
    "ตัดแต่งใบและกิ่งที่เป็นโรคออก แล้วเผาทำลายนอกแปลง",
    "พ่นสารเมทาแลกซิล 25% WP อัตรา 40 กรัม/น้ำ 20 ลิตร ทุก 7 วัน 2 ครั้ง",
    "ฉีดพ่นแมกนีเซียมซัลเฟต 2% ทางใบ สัปดาห์ละครั้ง 3 สัปดาห์",
    "ลดการให้น้ำช่วงเย็นเพื่อลดความชื้นสะสมในทรงพุ่ม",
  ],
};

export const communityPosts = [
  {
    id: "cm1",
    author: "ลุงสมชาย สวนจันท์",
    avatar: "🧑‍🌾",
    time: "20 นาทีที่แล้ว",
    tag: "ถามตอบ",
    content: "ใบทุเรียนเป็นจุดสีน้ำตาลขอบเหลือง ควรใช้สารอะไรดีครับ อายุต้น 5 ปี",
    likes: 24,
    comments: 8,
  },
  {
    id: "cm2",
    author: "พี่นิดสวนมังคุด",
    avatar: "👩‍🌾",
    time: "2 ชม.ที่แล้ว",
    tag: "แชร์ความรู้",
    content: "เทคนิคทำมังคุดผิวมัน: คุมน้ำช่วงติดผลอ่อน + ให้แคลเซียมโบรอนทุก 10 วัน ได้ผลดีมากปีนี้",
    likes: 132,
    comments: 27,
  },
  {
    id: "cm3",
    author: "ข่าวเกษตรวันนี้",
    avatar: "📰",
    time: "5 ชม.ที่แล้ว",
    tag: "ข่าวเกษตร",
    content: "ราคาทุเรียนหมอนทองเกรดส่งออกขยับขึ้นเป็น 128 บาท/กก. จากความต้องการตลาดจีน",
    likes: 88,
    comments: 12,
  },
];

export const reports = [
  { id: "rp1", title: "สรุปรายเดือน สิงหาคม 2569", desc: "รายรับ-รายจ่าย ผลผลิต และงานที่ทำ", icon: "📅" },
  { id: "rp2", title: "รายงานต้นทุนต่อไร่", desc: "แยกตามแปลงและประเภทค่าใช้จ่าย", icon: "💰" },
  { id: "rp3", title: "รายงานสุขภาพพืชและโรค", desc: "ประวัติการวิเคราะห์ด้วย AI ทั้งหมด", icon: "🔬" },
  { id: "rp4", title: "รายงานคาดการณ์ผลผลิต", desc: "ปริมาณและรายได้ที่คาดว่าจะได้รับ", icon: "📈" },
];

export const assistantSuggestions = [
  "ทุเรียนใบเหลืองเกิดจากอะไร",
  "ควรใส่ปุ๋ยสูตรไหนช่วงติดผล",
  "วิธีป้องกันเพลี้ยไฟแบบปลอดภัย",
  "ราคามังคุดตอนนี้เป็นอย่างไร",
];

export const assistantReplies: Record<string, string> = {
  default:
    "จากข้อมูลแปลงของคุณ ผมแนะนำให้ตรวจความชื้นดินก่อนให้น้ำ และเน้นปุ๋ยที่มีฟอสฟอรัสสูงในช่วงสะสมอาหาร หากมีอาการผิดปกติที่ใบ ลองถ่ายรูปส่งในเมนู AI ตรวจโรคพืช เพื่อวิเคราะห์อย่างละเอียดครับ 🌱",
  "ทุเรียนใบเหลืองเกิดจากอะไร":
    "ใบเหลืองในทุเรียนมักเกิดจาก 3 สาเหตุหลักครับ\n\n1. **น้ำขังหรือรากเน่า** — ใบเหลืองทั้งต้น เริ่มจากใบล่าง ควรตรวจการระบายน้ำ\n2. **ขาดธาตุอาหาร** — ขาดไนโตรเจนใบเหลืองซีดทั้งใบ ขาดแมกนีเซียมเหลืองระหว่างเส้นใบ\n3. **โรครากเน่าโคนเน่า** — มียางไหลที่โคนต้นร่วมด้วย\n\nแนะนำให้พ่นปุ๋ยทางใบสูตร 20-20-20 + แมกนีเซียมซัลเฟต และตรวจโคนต้นครับ",
  "ควรใส่ปุ๋ยสูตรไหนช่วงติดผล":
    "ช่วงติดผลควรใช้ **สูตร 12-12-17+2MgO** หรือ **8-24-24** ครับ\n\n- ระยะผลอ่อน: 12-12-17 อัตรา 1-2 กก./ต้น\n- ระยะขยายผล: เสริมโพแทสเซียม 0-0-50 ทางใบ\n- ก่อนเก็บเกี่ยว 30 วัน: 13-13-21 เพื่อเพิ่มคุณภาพเนื้อและความหวาน\n\nควรให้น้ำตามทันทีหลังใส่ปุ๋ยเม็ดครับ",
  "วิธีป้องกันเพลี้ยไฟแบบปลอดภัย":
    "แนวทางปลอดภัยสำหรับเพลี้ยไฟครับ 🐛\n\n1. ติดกับดักกาวเหนียวสีน้ำเงินในทรงพุ่ม\n2. พ่นน้ำเปล่าแรงดันสูงช่วงเช้าเพื่อลดประชากร\n3. ใช้เชื้อราบิวเวอเรีย อัตรา 250 กรัม/น้ำ 20 ลิตร ทุก 5-7 วัน\n4. ปล่อยแมลงศัตรูธรรมชาติ เช่น ตัวห้ำ\n\nหลีกเลี่ยงการพ่นสารเคมีช่วงดอกบานเพื่อรักษาแมลงผสมเกสรครับ",
  "ราคามังคุดตอนนี้เป็นอย่างไร":
    "ราคามังคุดอ้างอิงล่าสุด (ข้อมูลตัวอย่าง)\n\n- เกรดส่งออก (มัน A): 68-75 บาท/กก.\n- เกรดคละ: 42-48 บาท/กก.\n- ตกไซซ์: 18-22 บาท/กก.\n\nแนวโน้มสัปดาห์นี้ทรงตัวถึงปรับขึ้นเล็กน้อย แนะนำทยอยเก็บเกี่ยวผลที่แก่จัดก่อนครับ",
};
// ---- แจ้งเตือนสภาพอากาศตามช่วงงาน (ก่อนปลูก / ก่อนใส่ปุ๋ย / ก่อนเก็บเกี่ยว) ----
export const stageAlerts = [
  {
    id: "s1",
    stage: "ก่อนปลูก",
    icon: "🌱",
    plot: "แปลงลำไยแปลงใหม่",
    when: "9–11 ส.ค.",
    verdict: "เหมาะสม",
    tone: "good" as const,
    detail: "ฝน 20% ดินชื้นพอดี อุณหภูมิ 27–34° เหมาะกับการลงกล้าและตั้งตัวของราก",
  },
  {
    id: "s2",
    stage: "ก่อนใส่ปุ๋ย",
    icon: "🌿",
    plot: "แปลงมังคุดริมคลอง",
    when: "พรุ่งนี้ 06:00",
    verdict: "ควรเลื่อน",
    tone: "warn" as const,
    detail: "ฝนหนัก 80% ปุ๋ยเม็ดจะถูกชะล้าง สูญเสียได้ถึง 30% แนะนำใส่วันอาทิตย์แทน",
  },
  {
    id: "s3",
    stage: "ก่อนเก็บเกี่ยว",
    icon: "🧺",
    plot: "แปลงทุเรียนหลังบ้าน",
    when: "อีก 12 วัน",
    verdict: "เฝ้าระวัง",
    tone: "warn" as const,
    detail: "ช่วงเก็บเกี่ยวมีโอกาสฝน 45% ควรเตรียมผ้าใบคลุมและวางแผนเก็บช่วงเช้า",
  },
];

// ---- น้ำท่วม & ภัยแล้ง ----
export const disasterStatus = {
  level: "เฝ้าระวังน้ำหลาก",
  waterLevel: 2.4, // เมตร
  waterLevelChange: +0.35,
  soilMoisture: 68,
  rain7d: 142, // มม.
  droughtIndex: 22, // 0-100 ยิ่งสูงยิ่งแล้ง
};

export const disasterAreas = [
  { id: "d1", name: "แปลงทุเรียนหลังบ้าน", status: "ปกติ", risk: 18, note: "ระบายน้ำดี ไม่มีน้ำขัง" },
  { id: "d2", name: "แปลงมังคุดริมคลอง", status: "เสี่ยงน้ำท่วม", risk: 74, note: "ระดับคลองสูงขึ้น 35 ซม. ใน 24 ชม." },
  { id: "d3", name: "แปลงลำไยแปลงใหม่", status: "เสี่ยงแล้ง", risk: 58, note: "ความชื้นดิน 31% ต่ำกว่าเกณฑ์" },
  { id: "d4", name: "พื้นที่รอบข้าง ต.บางกะปิ", status: "เฝ้าระวัง", risk: 46, note: "มีรายงานน้ำล้นตลิ่ง 2 จุดใกล้เคียง" },
];

export const damageRecords = [
  { id: "dr1", date: "3 ส.ค. 2569", event: "น้ำท่วมขัง 12 ชม.", plot: "แปลงมังคุดริมคลอง", area: 2.5, loss: 18000, photos: 6, status: "พร้อมยื่นเอกสาร" },
  { id: "dr2", date: "18 ก.ค. 2569", event: "ฝนทิ้งช่วง 21 วัน", plot: "แปลงลำไยแปลงใหม่", area: 4, loss: 9500, photos: 3, status: "บันทึกแล้ว" },
];

// ---- ราคาตลาด ----
export const marketPrices = [
  { id: "m1", product: "ทุเรียนหมอนทอง", name: "ตลาดกลางจันทบุรี", unit: "บาท/กก.", price: 135, change: 2, market: "ตลาดกลางจันทบุรี", province: "จันทบุรี", updated: "วันนี้ 07:30" },
  { id: "m2", product: "ทุเรียนหมอนทอง", name: "ตลาดไท", unit: "บาท/กก.", price: 152, change: 6, market: "ตลาดไท", province: "ปทุมธานี", updated: "วันนี้ 07:30" },
  { id: "m3", product: "ทุเรียนหมอนทอง", name: "ตลาดกลางผลไม้หนองคล้า", unit: "บาท/กก.", price: 140, change: -1, market: "ตลาดกลางผลไม้หนองคล้า", province: "จันทบุรี", updated: "วันนี้ 06:50" },
  { id: "m4", product: "ทุเรียนหมอนทอง", name: "ตลาดสี่มุมเมือง", unit: "บาท/กก.", price: 158, change: 3.2, market: "ตลาดสี่มุมเมือง", province: "ปทุมธานี", updated: "วันนี้ 08:00" },
  { id: "m5", product: "มังคุด", name: "ตลาดกลางจันทบุรี", unit: "บาท/กก.", price: 72, change: -2.8, market: "ตลาดกลางจันทบุรี", province: "จันทบุรี", updated: "วันนี้ 06:50" },
  { id: "m6", product: "มังคุด", name: "ตลาดไท", unit: "บาท/กก.", price: 78, change: 1.1, market: "ตลาดไท", province: "ปทุมธานี", updated: "วันนี้ 07:10" },
  { id: "m7", product: "ลำไยอีดอ", name: "ตลาดกลางลำพูน", unit: "บาท/กก.", price: 38, change: 3.1, market: "ตลาดกลางลำพูน", province: "ลำพูน", updated: "วันนี้ 08:00" },
  { id: "m8", product: "ลำไยอีดอ", name: "ตลาดเมืองใหม่", unit: "บาท/กก.", price: 37, change: 2.1, market: "ตลาดเมืองใหม่", province: "เชียงใหม่", updated: "วันนี้ 07:20" },
  { id: "m9", product: "ทุเรียนชะนี", name: "ตลาดกลางจันทบุรี", unit: "บาท/กก.", price: 112, change: 1.4, market: "ตลาดกลางจันทบุรี", province: "จันทบุรี", updated: "วันนี้ 07:30" },
  { id: "m10", product: "ทุเรียนชะนี", name: "ตลาดกลางระยอง", unit: "บาท/กก.", price: 108, change: -0.9, market: "ตลาดกลางระยอง", province: "ระยอง", updated: "วันนี้ 07:00" },
  { id: "m11", product: "ทุเรียนก้านยาว", name: "ตลาดไท", unit: "บาท/กก.", price: 185, change: 4.3, market: "ตลาดไท", province: "ปทุมธานี", updated: "วันนี้ 07:30" },
  { id: "m12", product: "ทุเรียนก้านยาว", name: "ตลาดกลางจันทบุรี", unit: "บาท/กก.", price: 178, change: 2.8, market: "ตลาดกลางจันทบุรี", province: "จันทบุรี", updated: "วันนี้ 07:30" },
  { id: "m13", product: "เงาะโรงเรียน", name: "ตลาดกลางระยอง", unit: "บาท/กก.", price: 31, change: -1.2, market: "ตลาดกลางระยอง", province: "ระยอง", updated: "วันนี้ 06:55" },
  { id: "m14", product: "เงาะโรงเรียน", name: "ตลาดกลางตราด", unit: "บาท/กก.", price: 33, change: 1.1, market: "ตลาดกลางตราด", province: "ตราด", updated: "วันนี้ 07:05" },
  { id: "m15", product: "มังคุด", name: "ตลาดกลางตราด", unit: "บาท/กก.", price: 75, change: 2.4, market: "ตลาดกลางตราด", province: "ตราด", updated: "วันนี้ 07:05" },
  { id: "m16", product: "ทุเรียนหมอนทอง", name: "ตลาดกลางระยอง", unit: "บาท/กก.", price: 146, change: 2.7, market: "ตลาดกลางระยอง", province: "ระยอง", updated: "วันนี้ 07:00" },
];

export const priceTrend = [
  { d: "1 ส.ค.", durian: 118, mangosteen: 68 },
  { d: "2 ส.ค.", durian: 120, mangosteen: 70 },
  { d: "3 ส.ค.", durian: 119, mangosteen: 74 },
  { d: "4 ส.ค.", durian: 123, mangosteen: 76 },
  { d: "5 ส.ค.", durian: 125, mangosteen: 73 },
  { d: "6 ส.ค.", durian: 124, mangosteen: 71 },
  { d: "7 ส.ค.", durian: 128, mangosteen: 72 },
];

// ---- ติดตามความสมบูรณ์รายสัปดาห์ ----
export const weeklyHealth = [
  { w: "สัปดาห์ 1", durian: 82, mangosteen: 78, longan: 70 },
  { w: "สัปดาห์ 2", durian: 84, mangosteen: 76, longan: 68 },
  { w: "สัปดาห์ 3", durian: 86, mangosteen: 75, longan: 65 },
  { w: "สัปดาห์ 4", durian: 87, mangosteen: 74, longan: 63 },
  { w: "สัปดาห์ 5", durian: 88, mangosteen: 72, longan: 61 },
];

export const weeklyChecks = [
  { id: "w1", plot: "แปลงทุเรียนหลังบ้าน", score: 88, trend: +1, status: "สมบูรณ์ดี", next: "ตรวจครั้งถัดไป 14 ส.ค.", issues: [] as string[] },
  { id: "w2", plot: "แปลงมังคุดริมคลอง", score: 72, trend: -2, status: "ควรเฝ้าระวัง", next: "ตรวจครั้งถัดไป 12 ส.ค.", issues: ["ใบเริ่มซีดที่ยอด", "ความชื้นดินสูงต่อเนื่อง"] },
  { id: "w3", plot: "แปลงลำไยแปลงใหม่", score: 61, trend: -2, status: "ต้องแก้ไข", next: "ตรวจด่วนภายใน 2 วัน", issues: ["ขาดแมกนีเซียม", "พบเพลี้ยไฟระยะเริ่มต้น"] },
];
