import type { DemoPersonaId } from "@/lib/dragonfly-data";

export type GuidedTutorialRoute = string;

export type GuidedTutorialStep = {
  id: string;
  route: GuidedTutorialRoute;
  target: string;
  title: string;
  description: string;
  instruction: string;
};

export type GuidedTutorial = {
  id: string;
  title: string;
  summary: string;
  steps: GuidedTutorialStep[];
  category?: string;
  requiresPro?: boolean;
};

export type GuidedTutorialSession = {
  tourId: string;
  stepIndex: number;
  active: boolean;
};

const STORAGE_KEY = "easyplants_guided_tutorial";
export const GUIDED_TUTORIAL_EVENT = "easyplants_guided_tutorial_updated";

const personalFarmTour: GuidedTutorial = {
  id: "personal-farm-basics",
  title: "เริ่มจัดการสวนของคุณ",
  summary: "เรียนรู้ขอบเขตสวน สุขภาพแปลง การเพิ่มแปลง และการสร้างงานส่วนตัว",
  steps: [
    { id: "tour-farm-scope", route: "/", target: "dashboard-farm", title: "เลือกสวนที่กำลังดู", description: "ข้อมูลทั้งหมดในแดชบอร์ดจะอิงจากสวนที่เลือกตรงนี้", instruction: "ลองกดรายการสวนเพื่อดูตัวเลือก หรือกดถัดไป" },
    { id: "tour-farm-health", route: "/", target: "dashboard-health", title: "ตรวจสุขภาพสวน", description: "คะแนนนี้สรุปสุขภาพของแปลงในสวนที่เลือก เพื่อช่วยหาเรื่องที่ควรตรวจต่อ", instruction: "ดูคะแนนและแถบสุขภาพ แล้วกดถัดไป" },
    { id: "tour-add-plot", route: "/plots", target: "plots-add-gps", title: "เพิ่มแปลงเพาะปลูก", description: "สร้างแปลงจากตำแหน่ง GPS เลือกสวน โซน ชนิดพืช และบันทึกขอบเขต", instruction: "กดปุ่มนี้เมื่อต้องการสร้างแปลงจริง หรือกดถัดไป" },
    { id: "tour-create-task", route: "/calendar", target: "calendar-create-task", title: "สร้างงานดูแลสวน", description: "งานที่สร้างจากปฏิทินจะเป็นข้อมูลกลาง และเข้า Care Log เมื่อปิดงานแล้ว", instruction: "กดสร้างงานเพื่อเปิดแบบฟอร์ม หรือกดเสร็จสิ้น" },
  ],
};

const managerTour: GuidedTutorial = {
  id: "manager-operations",
  title: "เริ่มบริหารงานสวนและทีม",
  summary: "เรียนรู้ขอบเขตฟาร์ม ภาพรวมสุขภาพ การสร้างงานทีม และการจัดการบุคลากร",
  steps: [
    ...personalFarmTour.steps.slice(0, 2),
    { id: "tour-create-team-task", route: "/calendar", target: "calendar-create-task", title: "สร้างและมอบหมายงานทีม", description: "ผู้จัดการสร้าง Task กลาง เลือกแปลง ทีม หรือพนักงาน และติดตามจนหัวหน้าตรวจรับ", instruction: "กดสร้างงานเพื่อดูแบบฟอร์มงานทีม หรือกดถัดไป" },
    { id: "tour-manage-team", route: "/workers", target: "workers-members", title: "จัดการสมาชิกและทีม", description: "เชิญสมาชิก เปลี่ยนบทบาท ย้ายทีม และกำหนดฟาร์ม โซน หรือแปลงประจำได้จากส่วนนี้", instruction: "กดเชิญสมาชิกเพื่อดูแบบฟอร์ม หรือกดเสร็จสิ้น" },
  ],
};

const employeeTour: GuidedTutorial = {
  id: "employee-daily-work",
  title: "เริ่มทำงานประจำวัน",
  summary: "เรียนรู้การเช็กอิน ดูงานที่ได้รับมอบหมาย และส่งงานให้หัวหน้าตรวจรับ",
  steps: [
    { id: "tour-employee-checkin", route: "/my-work", target: "employee-checkin", title: "เช็กอินก่อนเริ่มงาน", description: "บันทึกเวลาและพื้นที่ปฏิบัติงานก่อนเริ่มทำงานที่ได้รับมอบหมาย", instruction: "กดเช็กอินที่เขตงาน หรือกดถัดไป" },
    { id: "tour-employee-filters", route: "/my-work", target: "employee-work-filters", title: "เลือกงานที่ต้องดู", description: "แยกงานวันนี้ งานค้าง และสถานะ เพื่อไม่ให้รายการงานจำนวนมากปะปนกัน", instruction: "ลองเลือกงานวันนี้หรือสถานะ แล้วกดถัดไป" },
    { id: "tour-employee-queue", route: "/my-work", target: "employee-task-queue", title: "ทำงานและส่งตรวจ", description: "กดเริ่มงาน เมื่อเสร็จให้ส่งตรวจ หัวหน้างานจะเป็นผู้อนุมัติปิดงาน", instruction: "เปิดงานที่รับผิดชอบ แล้วกดเสร็จสิ้นการฝึกสอน" },
  ],
};

const featureTutorials: GuidedTutorial[] = [
  { id: "feature-dashboard", category: "เริ่มต้นและข้อมูลสวน", title: "แดชบอร์ดสวน", summary: "อ่านสุขภาพสวน งานเร่งด่วน และสรุปข้อมูลของพื้นที่ที่กำลังเลือก", steps: [
    { id: "feature-dashboard-1", route: "/", target: "app-shell-header", title: "เริ่มจากภาพรวมสวน", description: "แดชบอร์ดรวมข้อมูลของสวนหรือองค์กรตามพื้นที่ทำงานที่เลือกไว้ด้านบน", instruction: "ตรวจชื่อพื้นที่ทำงานเหนือหัวข้อ" },
    { id: "feature-dashboard-2", route: "/", target: "dashboard-health", title: "ดูสุขภาพแปลง", description: "คะแนนสุขภาพช่วยให้คุณรู้ว่าแปลงไหนต้องการการดูแลเร่งด่วน", instruction: "เลื่อนดูแถบสุขภาพและข้อเสนอแนะ" },
    { id: "feature-dashboard-3", route: "/", target: "dashboard-urgent", title: "งานที่ต้องทำวันนี้", description: "รายการงานและ Todo ที่ครบกำหนดจะแสดงที่นี่เพื่อให้ไม่พลาดสิ่งที่สำคัญ", instruction: "ดูงานเร่งด่วนแล้วกดเสร็จสิ้น" }
  ]},
  { id: "feature-workspace", category: "เริ่มต้นและข้อมูลสวน", title: "สลับสวนของฉันและองค์กร", summary: "สลับขอบเขตข้อมูลโดยไม่ต้องเปลี่ยนหน้า", steps: [
    { id: "feature-workspace-1", route: "/", target: "app-shell-header", title: "เลือกพื้นที่ทำงาน", description: "พื้นที่ทำงานกำหนดว่าคุณกำลังดูข้อมูลส่วนตัวหรือขององค์กร", instruction: "กดที่ชื่อพื้นที่ทำงานด้านบน" },
    { id: "feature-workspace-2", route: "/", target: "app-shell-header", title: "เข้าใจขอบเขตข้อมูล", description: "เมื่อเปลี่ยนพื้นที่ ข้อมูล งาน และแปลงที่เห็นก็จะเปลี่ยนตามบริบทของพื้นที่นั้น", instruction: "สังเกตความแตกต่างแล้วกดเสร็จสิ้น" }
  ]},
  { id: "feature-profile", category: "เริ่มต้นและข้อมูลสวน", title: "โปรไฟล์ฟาร์มและบทบาท", summary: "กำหนดระดับความรู้ ขนาดการดำเนินงาน และบทบาทตัวอย่างที่ระบบนำไปปรับหน้าจอ", steps: [
    { id: "feature-profile-1", route: "/onboarding", target: "app-shell-header", title: "ตั้งค่าโปรไฟล์", description: "โปรไฟล์ช่วยกำหนดคำอธิบายและเส้นทางที่เหมาะกับคุณ", instruction: "ตรวจระดับความรู้และประสบการณ์ของคุณ" },
    { id: "feature-profile-2", route: "/onboarding", target: "app-shell-header", title: "ปรับความซับซ้อนหน้าจอ", description: "คุณสามารถเลือกความซับซ้อนของเครื่องมือได้ตามความถนัด", instruction: "เลือกรูปแบบที่ต้องการแล้วบันทึก" }
  ]},
  { id: "feature-menu", category: "เริ่มต้นและข้อมูลสวน", title: "เมนูรวมตามสิทธิ์", summary: "ดูทุกฟีเจอร์ในหน้าเดียว พร้อมป้ายว่าเหมาะกับบทบาทใดและสถานะสิทธิ์", steps: [
    { id: "feature-menu-1", route: "/more", target: "app-shell-header", title: "รวมทุกเครื่องมือ", description: "หน้านี้รวมทุกเมนูในระบบ จัดกลุ่มตามประเภทการใช้งาน", instruction: "เลื่อนดูหมวดหมู่เครื่องมือต่างๆ" },
    { id: "feature-menu-2", route: "/more", target: "app-shell-header", title: "คำแนะนำฟีเจอร์", description: "ใต้แต่ละเมนูจะมีป้ายบอกว่าเหมาะกับใครบ้าง เพื่อให้ใช้เครื่องมือได้ตรงกับงาน", instruction: "สังเกตป้ายแนะนำแล้วกดเสร็จสิ้น" }
  ]},
  { id: "feature-academy", category: "เริ่มต้นและข้อมูลสวน", title: "EasyPlants Academy", summary: "ค้นหาและเริ่มบทเรียนแบบโต้ตอบสำหรับทุกฟีเจอร์ของระบบ", steps: [
    { id: "feature-academy-1", route: "/academy", target: "app-shell-header", title: "ค้นหาบทเรียน", description: "คุณสามารถเรียนรู้การใช้งานฟีเจอร์ต่างๆ แบบโต้ตอบได้", instruction: "ลองค้นหาชื่อฟีเจอร์ที่คุณสนใจ" },
    { id: "feature-academy-2", route: "/academy", target: "app-shell-header", title: "เริ่มเรียนรู้", description: "เมื่อเลือกบทเรียน ระบบจะพาคุณไปยังหน้าจริงพร้อมไฮไลต์ขั้นตอน", instruction: "เลือกบทเรียนหนึ่งเพื่อทดลอง" }
  ]},
  { id: "feature-plots", category: "เริ่มต้นและข้อมูลสวน", title: "จัดการแปลง", summary: "สร้างแปลงจาก GPS กำหนดสวน โซน ชนิดพืช และดูสุขภาพแปลง", steps: [
    { id: "feature-plots-1", route: "/plots", target: "app-shell-header", title: "ดูรายการแปลง", description: "แปลงเป็นศูนย์กลางการจัดการ ข้อมูลทุกอย่างจะอิงตามแปลง", instruction: "เลื่อนดูแปลงที่คุณมีในระบบ" },
    { id: "feature-plots-2", route: "/plots", target: "plots-add-gps", title: "สร้างแปลงใหม่", description: "คุณสามารถเพิ่มแปลงใหม่ได้โดยใช้วิธีปักหมุดหรือวาดขอบเขต GPS", instruction: "ลองกดปุ่มสร้างแปลง" }
  ]},
  { id: "feature-diagnose", category: "เริ่มต้นและข้อมูลสวน", title: "ตรวจโรคพืช", summary: "บันทึกอาการ ตรวจความเสี่ยง และเก็บผลตรวจตามสวน โซน หรือแปลง", steps: [
    { id: "feature-diagnose-1", route: "/diagnose", target: "app-shell-header", title: "บันทึกอาการ", description: "เลือกลักษณะอาการที่คุณพบในแปลง เพื่อบันทึกประวัติไว้", instruction: "ลองเลือกอาการที่พบบ่อย" },
    { id: "feature-diagnose-2", route: "/diagnose", target: "app-shell-header", title: "ผลตรวจและการเฝ้าระวัง", description: "ระบบจะวิเคราะห์และแนะนำการเฝ้าระวังสำหรับอาการที่คุณบันทึก", instruction: "ตรวจสอบผลแล้วกดเสร็จสิ้น" }
  ]},
  { id: "feature-ai-assistant", category: "เริ่มต้นและข้อมูลสวน", title: "ผู้ช่วย AI", summary: "ขอคำแนะนำจากข้อมูลสวน พร้อมบอกชัดว่าเป็นข้อมูลระบบหรือประมาณการ AI", steps: [
    { id: "feature-ai-1", route: "/assistant", target: "app-shell-header", title: "ผู้ช่วย AI ส่วนตัว", description: "พิมพ์คำถามเรื่องการดูแลสวน หรือเรื่องปัญหาที่พบ", instruction: "ลองพิมพ์คำถามหรือเลือกจากคำถามแนะนำ" },
    { id: "feature-ai-2", route: "/assistant", target: "app-shell-header", title: "คำตอบมีบริบท", description: "AI จะตอบโดยอิงข้อมูลแปลง สภาพอากาศ และประวัติในระบบ", instruction: "รอรับคำตอบแล้วนำไปปฏิบัติ" }
  ]},
  { id: "feature-crop-calendar", category: "วางแผนและดูแลงาน", title: "ปฏิทินพืช AI", summary: "สร้างรอบปลูกและดูช่วงดูแล เก็บเกี่ยว และงานที่ระบบแนะนำ", steps: [
    { id: "feature-crop-cal-1", route: "/crop-calendar", target: "app-shell-header", title: "วงจรการผลิต", description: "รอบปลูกช่วยบอกระยะต่างๆ ของพืช ตั้งแต่ปลูกจนถึงเก็บเกี่ยว", instruction: "เลือกแปลงที่ต้องการดูรอบปลูก" },
    { id: "feature-crop-cal-2", route: "/crop-calendar", target: "app-shell-header", title: "งานแนะนำตามระยะ", description: "ระบบจะแทรกคำแนะนำและงานดูแลในแต่ละช่วงเวลาให้คุณ", instruction: "เลื่อนดูไทม์ไลน์งานดูแล" }
  ]},
  { id: "feature-calendar", category: "วางแผนและดูแลงาน", title: "ปฏิทินงาน", summary: "สร้างงานส่วนตัวหรือมอบหมายงานทีม แล้วติดตามจนส่งตรวจและปิดงาน", steps: [
    { id: "feature-calendar-1", route: "/calendar", target: "app-shell-header", title: "ดูปฏิทินงาน", description: "ปฏิทินรวมงานทั้งหมดของคุณไว้ในที่เดียว ทั้งแบบวัน สัปดาห์ และเดือน", instruction: "สลับมุมมองปฏิทินตามที่ถนัด" },
    { id: "feature-calendar-2", route: "/calendar", target: "calendar-create-task", title: "สร้างและมอบหมาย", description: "คุณสามารถมอบหมายงานให้ทีม หรือสร้างงานส่วนตัวได้ที่นี่", instruction: "ลองกดสร้างงานแล้วตรวจสอบ" }
  ]},
  { id: "feature-my-work", category: "วางแผนและดูแลงาน", title: "งานของฉัน", summary: "พนักงานเช็กอิน รับงาน ส่งตรวจ และเจ้าของสวนติดตาม Todo ส่วนตัว", steps: [
    { id: "feature-my-work-1", route: "/my-work", target: "employee-checkin", title: "เช็กอินเข้าทำงาน", description: "บันทึกเวลาและสถานที่เพื่อเริ่มวันทำงานอย่างเป็นทางการ", instruction: "ทดลองกดเช็กอินเริ่มงาน" },
    { id: "feature-my-work-2", route: "/my-work", target: "employee-task-queue", title: "ดูรายการงานที่ได้รับมอบหมาย", description: "งานที่คุณต้องทำจะแสดงพร้อมรายละเอียดและพื้นที่เป้าหมาย", instruction: "ลองเลือกงานแล้วกดส่งตรวจเมื่อเสร็จ" }
  ]},
  { id: "feature-monitor", category: "วางแผนและดูแลงาน", title: "เฝ้าระวังรายสัปดาห์", summary: "ตรวจความสมบูรณ์ ความเสี่ยง และบันทึกผลตรวจตามพื้นที่", steps: [
    { id: "feature-monitor-1", route: "/monitor", target: "app-shell-header", title: "สำรวจพื้นที่", description: "การเดินตรวจแปลงสม่ำเสมอช่วยลดความเสียหายจากโรคและแมลง", instruction: "เลือกพื้นที่ที่จะเดินตรวจ" },
    { id: "feature-monitor-2", route: "/monitor", target: "app-shell-header", title: "บันทึกข้อมูล", description: "บันทึกสิ่งที่พบเห็น เช่น แมลงศัตรู หรือความผิดปกติของต้นพืช", instruction: "กรอกข้อมูลและบันทึกรายงาน" }
  ]},
  { id: "feature-recommend", category: "วางแผนและดูแลงาน", title: "คำแนะนำ AI", summary: "ดูคำแนะนำรดน้ำ ใส่ปุ๋ย ป้องกันโรค และเก็บเกี่ยวตามข้อมูลสวนจริง", steps: [
    { id: "feature-recommend-1", route: "/recommend", target: "recommendation-filters", title: "เลือกขอบเขตคำแนะนำ", description: "คำแนะนำ AI จะแม่นยำขึ้นเมื่อระบุสวน โซน หรือแปลงที่ต้องการ ระบบจะกรองเฉพาะข้อมูลที่เกี่ยวข้องกับพื้นที่นั้น", instruction: "เลือกสวนหรือแปลงที่ต้องการดูคำแนะนำ แล้วกดถัดไป" },
    { id: "feature-recommend-2", route: "/recommend", target: "app-shell-header", title: "อ่านคำแนะนำแต่ละรายการ", description: "แต่ละการ์ดจะบอกชื่องาน เหตุผล และสิ่งที่ควรทำ โดยอิงจากข้อมูลอากาศ ความชื้นดิน และระยะการผลิตของแปลงที่เลือก", instruction: "เลื่อนดูรายการคำแนะนำ สังเกตหัวข้อ เหตุผล และคำว่า 'แนะนำ:' ก่อนกดถัดไป" },
    { id: "feature-recommend-3", route: "/recommend", target: "app-shell-header", title: "ตรวจแหล่งที่มาของข้อมูล", description: "ป้ายสีในแต่ละการ์ดบอกว่าข้อมูลมาจากไหน: สีเขียว = ข้อมูลผู้ใช้หรือระบบจริง / สีเหลือง = AI ประมาณการ / สีฟ้า = ข้อมูลจำลอง ควรนำสีเขียวไปใช้ก่อนเสมอ", instruction: "หาป้ายสีมุมบนขวาของแต่ละการ์ด แล้วสังเกตความต่างของแหล่งข้อมูล" },
    { id: "feature-recommend-4", route: "/recommend", target: "app-shell-header", title: "ดูปัจจัยที่ระบบใช้คิด", description: "ส่วน 'ปัจจัยที่ระบบใช้ประกอบคำแนะนำ' แสดงค่าดิบที่ AI นำมาวิเคราะห์ เช่น ความชื้นดิน โอกาสฝน ระยะการผลิต และการเปลี่ยนแปลง NDVI จากภาพดาวเทียม", instruction: "เลื่อนลงหาส่วน 'ปัจจัย' แล้วอ่านค่าแต่ละรายการเพื่อเข้าใจที่มาของคำแนะนำ" },
    { id: "feature-recommend-5", route: "/recommend", target: "app-shell-header", title: "นำคำแนะนำไปสร้างงาน", description: "เมื่อเห็นคำแนะนำที่ต้องการทำ ให้ไปสร้างงานจากปฏิทินงาน เลือกแปลง กำหนดวัน และมอบหมายให้ทีมหรือตัวเอง เพื่อให้งานเข้า Care Log โดยอัตโนมัติ", instruction: "จดหรือจำคำแนะนำที่สำคัญ แล้วกดเสร็จสิ้น เพื่อไปสร้างงานในปฏิทิน" },
  ]},
  { id: "feature-weather", category: "วางแผนและดูแลงาน", title: "สภาพอากาศ", summary: "ดูพยากรณ์และความเสี่ยงจากจุดตรวจหรือแปลงที่เลือก", steps: [
    { id: "feature-weather-1", route: "/weather", target: "app-shell-header", title: "ดูสภาพอากาศปัจจุบัน", description: "ตรวจสอบอากาศเพื่อใช้วางแผนการทำงานภาคสนาม", instruction: "ดูพยากรณ์ล่วงหน้า" },
    { id: "feature-weather-2", route: "/weather", target: "app-shell-header", title: "เช็กความเสี่ยง", description: "หากมีแนวโน้มฝนตกหนักหรือพายุ ระบบจะแจ้งเตือนความเสี่ยง", instruction: "ตรวจสอบข้อมูลการแจ้งเตือน" }
  ]},
  { id: "feature-market", category: "การเงินและผลผลิต", title: "ราคาตลาด", summary: "เทียบราคาผลผลิตจากทุกจังหวัดและตลาดในระบบ พร้อมประเมินรายได้", steps: [
    { id: "feature-market-1", route: "/market", target: "app-shell-header", title: "ราคากลางวันนี้", description: "เปรียบเทียบราคาผลผลิตพืชชนิดเดียวกันจากหลายแหล่ง", instruction: "เลือกพืชที่ต้องการดูราคา" },
    { id: "feature-market-2", route: "/market", target: "app-shell-header", title: "ประเมินรายได้ล่วงหน้า", description: "ใส่ปริมาณผลผลิตคาดหวังเพื่อดูกรอบรายได้ที่เป็นไปได้", instruction: "ทดลองคำนวณและดูส่วนต่าง" }
  ]},
  { id: "feature-costs", category: "การเงินและผลผลิต", title: "ต้นทุน รายรับ และรายจ่าย", summary: "บันทึกรายการจริงและดูผลกำไรตามสวน แปลง หรือรอบปลูก", steps: [
    { id: "feature-costs-1", route: "/costs", target: "app-shell-header", title: "บันทึกกระแสเงินสด", description: "เก็บบันทึกรายรับและรายจ่ายจากการทำฟาร์มเพื่อดูผลกำไรที่แท้จริง", instruction: "ลองกดบันทึกรายการใหม่" },
    { id: "feature-costs-2", route: "/costs", target: "app-shell-header", title: "ดูสรุปกำไรขาดทุน", description: "ระบบแยกต้นทุนทางตรงและทางอ้อมตามแปลง เพื่อวิเคราะห์จุดคุ้มทุน", instruction: "อ่านรายงานสรุปค่าใช้จ่าย" }
  ]},
  { id: "feature-yield", category: "การเงินและผลผลิต", title: "คาดการณ์ผลผลิต", summary: "ดูผลผลิตและยอดขายคาดการณ์ตามปี ช่วงเวลา และช่องทางขาย", steps: [
    { id: "feature-yield-1", route: "/yield", target: "app-shell-header", title: "คาดการณ์ปริมาณ", description: "วิเคราะห์ปริมาณการเก็บเกี่ยวจากรอบปลูกและข้อมูลย้อนหลัง", instruction: "เลือกแปลงหรือฟาร์ม" },
    { id: "feature-yield-2", route: "/yield", target: "app-shell-header", title: "วางแผนการขาย", description: "จัดสรรผลผลิตตามช่องทางต่างๆ เพื่อรักษาราคาเฉลี่ย", instruction: "ลองตั้งสัดส่วนขายปลีกและส่ง" }
  ]},
  { id: "feature-disaster", category: "การเงินและผลผลิต", title: "น้ำท่วมและภัยแล้ง", summary: "เฝ้าระวังเหตุเสี่ยงตามพื้นที่และเก็บหลักฐานเพื่อการติดตาม", steps: [
    { id: "feature-disaster-1", route: "/disaster", target: "app-shell-header", title: "ติดตามภัยพิบัติ", description: "แจ้งและเฝ้าระวังสถานการณ์น้ำท่วม ภัยแล้ง หรือพายุ", instruction: "ระบุพื้นที่เสี่ยง" },
    { id: "feature-disaster-2", route: "/disaster", target: "app-shell-header", title: "เก็บบันทึกความเสียหาย", description: "ถ่ายรูปและบันทึกข้อมูลเพื่อใช้เป็นหลักฐานขอเคลมหรือประเมินซ่อมแซม", instruction: "ดูวิธีการบันทึกข้อมูล" }
  ]},
  { id: "feature-team", category: "องค์กรและทีม", title: "งานและทีม", summary: "ผู้จัดการวางแผนงานทีม กำหนดผู้รับผิดชอบ และติดตามการอนุมัติ", requiresPro: true, steps: [
    { id: "feature-team-1", route: "/farm-pro", target: "app-shell-header", title: "แผนปฏิบัติการ", description: "จัดการงานทีมและจัดสรรทรัพยากรบุคคลอย่างมีประสิทธิภาพ", instruction: "เลือกทีมที่ต้องการจัดการ" },
    { id: "feature-team-2", route: "/farm-pro", target: "app-shell-header", title: "ติดตามความคืบหน้า", description: "ดูสถานะงานว่ากำลังดำเนินการ ล่าช้า หรือส่งตรวจรับแล้ว", instruction: "ตรวจเช็กงานที่ค้างอยู่" }
  ]},
  { id: "feature-workers", category: "องค์กรและทีม", title: "สมาชิกและทีม", summary: "เชิญสมาชิก กำหนดตำแหน่ง ย้ายทีม และตั้งขอบเขตพื้นที่รับผิดชอบ", requiresPro: true, steps: [
    { id: "feature-workers-1", route: "/workers", target: "app-shell-header", title: "จัดการทีมงาน", description: "เชิญพนักงาน จัดตำแหน่ง และกำหนดสิทธิ์การเข้าถึง", instruction: "กดเชิญสมาชิกใหม่" },
    { id: "feature-workers-2", route: "/workers", target: "app-shell-header", title: "จัดสรรพื้นที่", description: "กำหนดโซนและแปลงให้แต่ละบุคคลเพื่อสร้างความรับผิดชอบชัดเจน", instruction: "ระบุความรับผิดชอบให้พนักงาน" }
  ]},
  { id: "feature-operations", category: "องค์กรและทีม", title: "ศูนย์ปฏิบัติการ 360", summary: "ดูฟาร์ม โซน งาน สต็อก และ compliance ในมุมควบคุมเดียว", requiresPro: true, steps: [
    { id: "feature-operations-1", route: "/operations", target: "app-shell-header", title: "ภาพรวมองค์กร", description: "ศูนย์รวมข้อมูลทุกด้านสำหรับการจัดการระดับผู้จัดการหรือเจ้าของ", instruction: "เลือกฟาร์มเพื่อดูสรุป" },
    { id: "feature-operations-2", route: "/operations", target: "app-shell-header", title: "ตัวชี้วัดประสิทธิภาพ", description: "วิเคราะห์จุดที่ทำได้ดี และจุดที่ต้องปรับปรุงจากการทำงานของทีม", instruction: "ดูดัชนีชี้วัดหลัก (KPIs)" }
  ]},
  { id: "feature-inventory", category: "องค์กรและทีม", title: "คลังและการจัดซื้อ", summary: "ควบคุมสต็อก ใบขอซื้อ การอนุมัติ PO และการรับสินค้า", requiresPro: true, steps: [
    { id: "feature-inventory-1", route: "/inventory", target: "app-shell-header", title: "ตรวจเช็กสต็อก", description: "รายการพัสดุ ปุ๋ย และเคมีภัณฑ์ทั้งหมดจะถูกบันทึกที่นี่", instruction: "ดูยอดคงเหลือที่ต้องสั่งเพิ่ม" },
    { id: "feature-inventory-2", route: "/inventory", target: "app-shell-header", title: "สร้างใบขอซื้อ", description: "เมื่อของใกล้หมด ระบบจะเตือนให้ทำเรื่องสั่งซื้อ", instruction: "ลองสร้างใบขอซื้อ (PR)" }
  ]},
  { id: "feature-machinery", category: "องค์กรและทีม", title: "เครื่องจักรและการบำรุง", summary: "บันทึกทะเบียน ตรวจเช็ก แจ้งซ่อม และติดตามประวัติอุปกรณ์", requiresPro: true, steps: [
    { id: "feature-machinery-1", route: "/machinery", target: "app-shell-header", title: "ทะเบียนเครื่องจักร", description: "บันทึกเครื่องมือ รถไถ และอุปกรณ์ทั้งหมดในระบบ", instruction: "ดูรายชื่อเครื่องจักรที่มี" },
    { id: "feature-machinery-2", route: "/machinery", target: "app-shell-header", title: "ซ่อมบำรุง", description: "แจ้งซ่อมหรือกำหนดรอบบำรุงรักษาเพื่อยืดอายุการใช้งาน", instruction: "สร้างตารางซ่อมบำรุง" }
  ]},
  { id: "feature-traceability", category: "องค์กรและทีม", title: "ตรวจสอบย้อนกลับ", summary: "ค้นหา Lot และดูเส้นทางการผลิตจากแปลง งาน เอกสาร และการเก็บเกี่ยว", requiresPro: true, steps: [
    { id: "feature-traceability-1", route: "/traceability", target: "app-shell-header", title: "เส้นทางผลผลิต", description: "ติดตามล็อตสินค้าย้อนกลับไปยังแปลง งาน และเอกสารต่างๆ", instruction: "กรอกรหัสล็อต (Lot Number)" },
    { id: "feature-traceability-2", route: "/traceability", target: "app-shell-header", title: "ตรวจความถูกต้อง", description: "ดูบันทึกสารเคมีและการเก็บเกี่ยวเพื่อยืนยันมาตรฐานความปลอดภัย", instruction: "ดูประวัติของล็อตนั้นๆ" }
  ]},
  { id: "feature-documents", category: "องค์กรและทีม", title: "ศูนย์เอกสาร", summary: "เก็บ PHI, QA, ใบรับรอง และเอกสารตามประเภทที่องค์กรกำหนด", requiresPro: true, steps: [
    { id: "feature-documents-1", route: "/documents", target: "app-shell-header", title: "จัดเก็บเอกสาร", description: "ใช้รวบรวมเอกสารต่างๆ เช่น ใบรับรอง GAP หรือใบรับสินค้า", instruction: "ดูหมวดหมู่เอกสาร" },
    { id: "feature-documents-2", route: "/documents", target: "app-shell-header", title: "อัปโหลดและอ้างอิง", description: "สามารถอัปโหลดไฟล์ใหม่และผูกกับแปลงหรือพนักงานได้", instruction: "กดปุ่มเพื่อเตรียมเพิ่มไฟล์" }
  ]},
  { id: "feature-reports", category: "องค์กรและทีม", title: "รายงาน", summary: "สร้างรายงาน PDF หรือ Excel จากข้อมูลที่เลือกตามสวน แปลง และช่วงเวลา", requiresPro: true, steps: [
    { id: "feature-reports-1", route: "/reports", target: "app-shell-header", title: "สร้างรายงานสรุป", description: "ประมวลผลข้อมูลการทำฟาร์มในรูปแบบที่พร้อมใช้งานหรือนำเสนอ", instruction: "เลือกประเภทรายงาน" },
    { id: "feature-reports-2", route: "/reports", target: "app-shell-header", title: "ตั้งค่าตัวกรองและส่งออก", description: "ปรับแต่งระยะเวลา ข้อมูลที่ใช้ และเลือกออกเป็น PDF หรือ Excel", instruction: "ลองตั้งค่าแล้วกด Export" }
  ]},
  { id: "feature-iot", category: "เทคโนโลยีและระบบ", title: "IoT และ Automation", summary: "ดูอุปกรณ์ สถานะข้อมูล กฎแจ้งเตือน และการทำงานอัตโนมัติ", requiresPro: true, steps: [
    { id: "feature-iot-1", route: "/iot", target: "app-shell-header", title: "สถานะเซ็นเซอร์", description: "เช็กการทำงานของอุปกรณ์ IoT และดูข้อมูลแบบเรียลไทม์", instruction: "เลือกดูเซ็นเซอร์ตัวใดตัวหนึ่ง" },
    { id: "feature-iot-2", route: "/iot", target: "app-shell-header", title: "ตั้งค่าการแจ้งเตือน", description: "สร้างเงื่อนไขให้ระบบเตือนเมื่อค่าผิดปกติ เช่น ความชื้นต่ำเกินไป", instruction: "กำหนดค่า Threshold" }
  ]},
  { id: "feature-iot-guide", category: "เทคโนโลยีและระบบ", title: "คู่มืออุปกรณ์ IoT", summary: "เรียนรู้การติดตั้ง ใช้งาน และบำรุงรักษาอุปกรณ์สำหรับสวน", requiresPro: true, steps: [
    { id: "feature-iot-guide-1", route: "/iot-guide", target: "app-shell-header", title: "คู่มือการติดตั้ง", description: "ทำความเข้าใจวิธีติดตั้งและเปิดใช้งานเซ็นเซอร์หรือฮาร์ดแวร์", instruction: "เลือกประเภทอุปกรณ์ที่ติดตั้ง" },
    { id: "feature-iot-guide-2", route: "/iot-guide", target: "app-shell-header", title: "การแก้ไขปัญหา", description: "หาวิธีแก้ไขเมื่ออุปกรณ์มีปัญหาหรือไม่ส่งข้อมูล", instruction: "อ่านบทความวิเคราะห์ปัญหา" }
  ]},
  { id: "feature-notifications", category: "เทคโนโลยีและระบบ", title: "การแจ้งเตือน", summary: "รวมงาน โรค ฝน ดินแห้ง และเหตุการณ์สำคัญที่ต้องติดตาม", steps: [
    { id: "feature-notifications-1", route: "/notifications", target: "app-shell-header", title: "กล่องจดหมายแจ้งเตือน", description: "รวมข้อความเตือนทุกประเภทตั้งแต่งานถึงอากาศ", instruction: "เลื่อนดูข้อความล่าสุด" },
    { id: "feature-notifications-2", route: "/notifications", target: "app-shell-header", title: "จัดลำดับความสำคัญ", description: "สามารถกรองเฉพาะเรื่องด่วน หรือทำเครื่องหมายอ่านแล้ว", instruction: "ลองจัดเรียงข้อความ" }
  ]},
  { id: "feature-community", category: "เทคโนโลยีและระบบ", title: "ชุมชนชาวสวน", summary: "ถามตอบและแลกเปลี่ยนความรู้ โดยควบคุมข้อมูลที่เปิดเผยตามบทบาท", steps: [
    { id: "feature-community-1", route: "/community", target: "app-shell-header", title: "แลกเปลี่ยนความรู้", description: "พูดคุย ปรึกษา และแบ่งปันข้อมูลกับเกษตรกรคนอื่นๆ", instruction: "ดูกระทู้ที่น่าสนใจ" },
    { id: "feature-community-2", route: "/community", target: "app-shell-header", title: "ตั้งคำถาม", description: "หากมีข้อสงสัย สามารถตั้งโพสต์ถามเพื่อขอคำแนะนำ", instruction: "ลองกดตั้งกระทู้ใหม่" }
  ]},
  { id: "feature-settings", category: "เทคโนโลยีและระบบ", title: "ตั้งค่าระบบ", summary: "ดู Data Mode รีเซ็ตข้อมูลสาธิต และกำหนดการใช้งานพื้นฐาน", steps: [
    { id: "feature-settings-1", route: "/settings", target: "app-shell-header", title: "ตั้งค่าโปรไฟล์และภาษา", description: "จัดการข้อมูลส่วนตัวและการแสดงผลหลักของระบบ", instruction: "ตรวจเช็กข้อมูลส่วนตัว" },
    { id: "feature-settings-2", route: "/settings", target: "app-shell-header", title: "จัดการข้อมูล Demo", description: "ในกรณีที่ใช้โหมดทดลอง คุณสามารถรีเซ็ตข้อมูลเพื่อกลับไปสถานะเริ่มต้นได้", instruction: "ดูปุ่มรีเซ็ต Demo Data" }
  ]}
];

export function getGuidedTutorial(personaId: DemoPersonaId) {
  if (personaId === "employee") return employeeTour;
  if (personaId === "commercial" || personaId === "export") return managerTour;
  return personalFarmTour;
}

export function getFeatureTutorials() {
  return featureTutorials;
}

export function getGuidedTutorialSession(): GuidedTutorialSession | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const session = JSON.parse(stored) as GuidedTutorialSession;
    return session.active ? session : null;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveSession(session: GuidedTutorialSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(GUIDED_TUTORIAL_EVENT));
}

export function startGuidedTutorial(tourId: string, personaId: DemoPersonaId) {
  const tour = findGuidedTutorial(tourId, personaId) ?? getGuidedTutorial(personaId);
  saveSession({ tourId: tour.id, stepIndex: 0, active: true });
}

export function updateGuidedTutorialStep(session: GuidedTutorialSession, stepIndex: number) {
  saveSession({ ...session, stepIndex });
}

export function stopGuidedTutorial() {
  saveSession(null);
}

export function findGuidedTutorial(tourId: string, personaId: DemoPersonaId) {
  const personaTour = getGuidedTutorial(personaId);
  if (personaTour.id === tourId) return personaTour;
  return featureTutorials.find((tutorial) => tutorial.id === tourId) ?? null;
}
