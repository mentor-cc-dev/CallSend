# CALLSEND — Universal "Call-to-Messenger" Conversational Commerce & CRM B2B SaaS Platformasi

> **Biznes shiori:** *"Qo‘ng‘iroq qilgan har bir mijozni 1 soniyada sodiq xaridorga aylantiring!"*

---

## 1. Bozordagi Muammo va Asosiy Kontseptsiya

### 1.1 Haqiqiy Bozor Muammosi (Pain Point)
Bugungi kunda onlayn do‘konlar, maishiy texnika markazlari, servis ustaxonalari, klinikalar, rieltorlar va yetkazib berish xizmatlariga har kuni yuzlab mijozlar telefon qiladi. 
Suhbat davomida odatda quyidagi holat yuz beradi:
* Xaridor: *"Konditsioneringiz rasmlari va narxlarini ko‘rsam bo‘ladimi?"*
* Sotuvchi/Operator: *"Bizga Telegramdan yozing yoki raqamimizni saqlab oling, tashlab beramiz..."*

**Natijada nima bo‘ladi?**
1. **Mijozlarning 60–70% qismi qaytib yozmaydi:** Yoshi kattalar, shoshayotgan odamlar yoki raqam saqlashga erinadigan xaridorlar raqobatdosh bizneslarga ketib qoladi.
2. **Konversiyaning keskin pasayishi:** Har bir qo‘shimcha harakat (raqamni kontaktga saqlash, Telegramdan qidirish, yozish) savdoni 2–3 baravar kamaytiradi.
3. **Operatorlarning behuda vaqti:** Sotuvchi kuniga 30–50 ta kontaktni qo‘lda saqlab, bir xil rasmlarni qayta-qayta yuborishga soatlab vaqt sarflaydi.
4. **Analitika va nazoratning yo‘qligi:** Rahbariyat nechta qo‘ng‘iroq bo‘lgani, ulardan qanchasiga ma’lumot ketgani va nechtasi xarid bilan yakunlanganini umuman bilmaydi.

---

### 1.2 CallSend Qanday Yechim Beradi?
**CallSend** — bu kiruvchi qo‘ng‘iroqni ushlab, xaridor go‘shakni qo‘yishi bilanoq unga avtomatik (yoki operatorning bitta tugmani bosishi bilan) interaktiv katalog, fotosuratlar, narxlar va filial lokatsiyasini yetkazib beruvchi aqlli ekotizimdir.

* **Telegram orqali (agar mijoz avval bot bilan muloqot qilgan bo‘lsa):** Rasmiy Telegram boti orqali interaktiv WebApp va kartochkalar boradi.
* **SMS orqali (100% kafolatlangan kanal):** `clls.nd/xY7z` ko‘rinishidagi unikal dinamik havola (Micro-Landing) boradi.
* **Xaridor havolani ochishi bilan:** Operator kompyuterida **JONLI RADAR** miltillab yonadi: *"Jamshid Karimov havolani ochdi (iPhone, Safari)!"* Operator telefonda turiboq savdoni yopadi.

---

## 2. Foydalanuvchi Rollari va Tizim Arxitekturasi (RBAC)

Platforma 3 ta asosiy sathdan iborat:

### 2.1 Global Sath (Platform Super-Admin & Support)
* **Super Admin:** Barcha tenantlar, billing, SMS provayderlarining umumiy balansi va serverlar salomatligini nazorat qiladi.
* **Platform Support:** Texnik nosozliklarni bartaraf etish, integratsiya loglarini tahlil qilish.

### 2.2 Tenant Sathi — 2 xil yo‘nalish:
#### A) "Solo" Rejim (Yakka usta, hunarmand, shaxsiy sotuvchi):
* Bitta foydalanuvchi barcha huquqlarga ega (Katalog, integratsiya, statistika).
* **Auto-Pilot funksiyasi:** Usta telefonda gaplashib turganida qo‘llari band bo‘lsa ham, go‘shak qo‘yilishi bilanoq tizim 2 soniya ichida avtomatik narxlar ro‘yxati, xizmat turlari va manzilini mijozga yuboradi.
* Biznes o‘sganda bir tugma bilan "Kompaniya" rejimiga kengayish (upgrade) imkoniyati.

#### B) "Kompaniya" Rejimi (Multi-Branch / Filiallar tarmog‘i):
* **Company Owner (Kompaniya rahbari):** Barcha filiallar, umumiy savdo voronkasi, xodimlar KPI-si, SMS limitlarini filiallar bo‘yicha taqsimlash va hisobotlar.
* **Branch Manager (Filial boshlig‘i):** O‘z filialining operatorlari, mahsulotlar qoldig‘i, lokatsiyasi va o‘z filialining konversiyasini nazorat qilish.
* **Branch Operator (Sotuvchi/Kassir):** Minimalistik va juda tezkor interfeys (**Operator Quick HUD**):
  - Kiruvchi qo‘ng‘iroq tushganda avtomatik profil ochilishi.
  - Klaviaturadagi `[1]`, `[2]`, `[3]` tugmalari orqali 1 soniyada kerakli taklifni jo‘natish.
  - Jonli radar orqali mijoz sahifani ko‘rayotganini real-vaqtda kuzatish.
  - Filiallararo mijozni o‘tkazish (Lead Transfer).

### 2.3 Mijoz Sathi (Tashqi Foydalanuvchi):
* Hech qanday ro‘yxatdan o‘tish yoki parol kiritish talab etilmaydi.
* SMS dagi unikal token xaridorning telefon raqamini allaqachon taniydi.
* Sahifa 1 soniyadan kam vaqtda (ultra-yengil < 40KB) ochiladi.
* Bitta bosish bilan Telegram botga o‘tish, Yandex xaritada marshrut chizish yoki buyurtma tasdiqlash.

---

## 3. Conversational CRM: Savdo Voronkasi va Mijoz 360°

CallSend shunchaki xabar yuboruvchi emas, balki **qo‘ng‘iroqdan boshlanuvchi to‘liq CRM tizimidir**:

### 3.1 Avtomatlashtirilgan Kanban Savdo Voronkasi (Pipeline)
Mijozning harakatiga qarab tizim bitimlarni avtomatik tarzda bosqichma-bosqich suradi:
```
[1. Yangi Lead] ────────► [2. Havola Ochildi] ────────► [3. Muzokarada]
(Kiruvchi qo'ng'iroq       (Xaridor havolani bosgan      (Operator shartlarni
 tushishi bilan ochiladi)   zahoti AVTOMATIK o'tadi!)     kelishmoqda)
                                                               │
                                                               ▼
[6. Yo'qotildi (LOST)] ◄── [5. Yutildi (WON)] ◄────── [4. Buyurtma / To'lov]
```

### 3.2 Mijoz 360° Profili (Unified Dossier Drawer)
Mijoz haqidagi barcha ma’lumotlar yagona xronologik vaqt chizig‘ida jamlanadi:
* 📞 Barcha kiruvchi va chiquvchi qo‘ng‘iroqlar tarixi (davomiyligi, statusi).
* ✉️ Yuborilgan barcha SMS va Telegram xabarlari.
* 👁️ Mijoz sahifani aynan qachon va qaysi qurilmadan ochgani.
* 📝 Operatorlar tomonidan yozilgan ichki izohlar (Notes).
* 🛍️ Xaridor bergan barcha buyurtmalar va uning umumiy qiymati (Customer LTV).
* ⏰ Qayta qo‘ng‘iroq qilish bo‘yicha eslatmalar (Callback Tasks).

---

## 4. Texnologik Arxitektura va Tizim Tuzilmasi

```
                               ┌──────────────────────────────────────────────────┐
                               │           Client / Frontend Layer                │
                               ├─────────────────┬────────────────┬───────────────┤
                               │ Operator HUD &  │ Customer Micro-│ Android Call  │
                               │  CRM Dashboard  │    Landing     │    Gateway    │
                               │ (React+Tailwind)│ (Ultra-fast)   │ (Kotlin/Jetp.)│
                               └────────┬────────┴────────┬───────┴───────┬───────┘
                                        │                 │               │
                                        ▼                 ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    API Gateway & Application Core Layer                         │
│                    NestJS (TypeScript) + Socket.io Cluster                      │
│                                                                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│   │ Telephony    │  │ CRM Pipeline │  │ Notification │  │ Tracking & Radar │    │
│   │ Ingestion    │  │ & Customer360│  │ Dispatcher   │  │ Analytics        │    │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘    │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Data Layer: PostgreSQL 16+ & Prisma ORM                      │
│       Multi-Tenancy Row-Level Security (RLS) + High-Performance Indexing        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Qo‘ng‘iroqni Ushlash (Call Interception)
1. **Kichik biznes uchun (Android Gateway App):**
   - Native Kotlin ilovasi telefonda doimiy fon xizmati (`ForegroundService`) sifatida ishlaydi.
   - `CallScreeningService` yoki `PhoneStateReceiver` orqali kiruvchi raqamni sekundiga ushlaydi.
   - Dual-SIM qo‘llab-quvvatlaydi.
   - Aloqa yo‘qolganda ma’lumotlarni lokal Room bazasida saqlab, internet kelganda sinxronlaydi.
2. **O‘rta va yirik biznes uchun (SIP / Virtual PBX):**
   - Asterisk (AMI/ARI) va Bulutli ATS-lar (Zadarma, OnlinePBX, Uztelecom, Beeline PBX) bilan webhook integratsiyasi.

### 4.2 Xabarlar Shlyuzi (Adapter Pattern)
- O‘zbekiston bo‘yicha: **Eskiz.uz**, **PlayMobile**.
- Xalqaro bozorlar: **Twilio**, **Infobip**.
- Lokal testlar va namoyishlar uchun: **Mock Sandbox Provider**.

---

## 5. Monetizatsiya va Biznes Model (B2B SaaS Pricing)

Platforma obuna (Subscription) + Tranzaksion model asosida daromad keltiradi:

| Tarif Rejasi | Mo‘ljallangan Auditoriya | Narxi (oylik) | Imkoniyatlari |
|---|---|---|---|
| **SOLO START** | Yakka ustalar, shaxsiy sotuvchilar, sartaroshlar | **99,000 so‘m** | 1 ta Android telefon, Auto-Pilot, 200 ta bepul SMS, asosiy statistika |
| **BUSINESS PRO** | Do‘konlar, kafelar, kichik servis markazlari | **299,000 so‘m** | 3 ta filial, Operator HUD, CRM Kanban voronkasi, Mijoz 360°, 1000 ta SMS |
| **ENTERPRISE** | Yirik do‘konlar tarmoqlari, yetkazib berish xizmatlari | **699,000 so‘m+** | Cheksiz filiallar, ATS/PBX integratsiyasi, API ulanish, maxsus SMS nom |

* **Qo‘shimcha daromad:** Har bir yuborilgan SMS paketidan marja (optom olinib, ustiga qo‘yib sotiladi).

---

## 6. Kelajakdagi Rivojlanish Bosqichlari (Roadmap)

1. **1-Bosqich (Bajarildi):**
   - Core Backend (NestJS + Prisma + WebSockets).
   - Operator Tezkor Sotuv (HUD) va Mijoz Micro-Landingi.
   - To‘liq CRM Kanban Pipeline va Mijoz 360° kartochkasi.
   - Android Native Call Gateway arxitekturasi va E2E testlar.

2. **2-Bosqich (Kelgusi Qadamlar):**
   - **AI Voice Summary (Aqlli Ovozli Xulosa):** Suhbat yozuvini eshitib, mijoz aynan qaysi mahsulotni so‘raganini avtomatik aniqlash va mos kartochkani operatorga tavsiya qilish.
   - **WhatsApp Business Cloud API & Instagram Direct:** Xalqaro bozorlar uchun SMS o‘rniga WhatsApp orqali to‘g‘ridan-to‘g‘ri interaktiv katalog jo‘natish.
   - **Buxgalteriya Integratsiyasi:** 1C, MoySklad, Jowi va iiko bilan sinxronizatsiya.
   - **Android APK Build:** Google Play do‘koniga chiqarish yoki korporativ APK sifatida tarqatish.

---

> **Loyiha Muallifi va Jamoasi:** CallSend Engineering Team  
> **Litsenziya:** Proprietary B2B SaaS Solution
