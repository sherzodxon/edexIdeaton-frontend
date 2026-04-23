export interface School {
  id: number;
  name: string;
  total_points: number;
  entry_count?: number;
}

export interface Criterion {
  id: number;
  mezon: string;
  mazmuni: string;
  max: number;
}

export interface ScoreEntry {
  id: number;
  school_id: number;
  school_name: string;
  criterion_id: number;
  criterion_name: string;
  points: number;
  max_points: number;
  admin_note: string | null;
  revoked: boolean;
  created_at: string;
  revoked_at: string | null;
}

export const CRITERIA: Criterion[] = [
  { id: 1, mezon: "Berilgan muammoni tushunish darajasi", mazmuni: "Jamoa tashkilotchilar tomonidan berilgan muammoni to'g'ri anglagani, uning mazmuni, qamrovi va muammodan ta'sirlanayotgan auditoriyani aniq tushuntirib bera olishi.", max: 8 },
  { id: 2, mezon: "Muammoni tahlil qilish sifati", mazmuni: "Muammoning sabab va oqibatlari, mavjud holat, foydalanuvchi ehtiyoji hamda asosiy to'siqlar dalillarga tayangan holda mantiqan tahlil qilingan bo'lishi.", max: 8 },
  { id: 3, mezon: "Yechimning aniqligi va mantiqiyligi", mazmuni: "Taklif etilgan g'oya berilgan muammoni bevosita hal qilishga xizmat qilishi, ichki jihatdan izchil, tushunarli va asoslangan bo'lishi.", max: 10 },
  { id: 4, mezon: "Yangilik va kreativ yondashuv", mazmuni: "G'oyada noodatiy yondashuv, mahalliy sharoitga mos innovatsion fikr yoki original format mavjud bo'lishi.", max: 7 },
  { id: 5, mezon: "Realizatsiya bosqichlari", mazmuni: "Loyihani amaliyotga joriy etish bosqichlari, vaqt ketma-ketligi va ish jarayoni bosqichma-bosqich ko'rsatilgan bo'lishi.", max: 10 },
  { id: 6, mezon: "Resurs va hamkorlik rejasi", mazmuni: "Loyihani amalga oshirish uchun zarur resurslar, texnik vositalar, jamoa roli, hamkor tashkilotlar yoki mutaxassislar ishtiroki aniq ko'rsatilishi.", max: 7 },
  { id: 7, mezon: "Amalga oshirish imkoniyati", mazmuni: "Taklif etilgan g'oyaning mavjud sharoitda joriy etilishi, vaqt, joy, kadr va tashkiliy imkoniyatlar nuqtai nazaridan real ekani asoslangan bo'lishi.", max: 5 },
  { id: 8, mezon: "Monetizatsiya yoki moliyaviy barqarorlik", mazmuni: "Loyiha daromad manbasi, o'zini oqlash usuli, homiylik, obuna, reklama, komissiya yoki boshqa moliyaviy model bilan asoslangan bo'lishi.", max: 5 },
  { id: 9, mezon: "Taqdimot sifati", mazmuni: "Nutq ravonligi, slaydlar tartibi, asosiy fikrlarni yetkazish sifati, vaqtni to'g'ri taqsimlash va vizual materiallar sifati.", max: 10 },
  { id: 10, mezon: "Savol-javob va jamoaviy himoya", mazmuni: "Hakamlar savollariga aniq, ishonchli va mantiqli javob berish, jamoa a'zolarining tayyorgarligi, mavzuni chuqur tushungani va o'zaro muvofiqligi.", max: 30 },
];

export const TOTAL_MAX = CRITERIA.reduce((sum, c) => sum + c.max, 0); // 100
