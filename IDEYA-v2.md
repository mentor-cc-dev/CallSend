# CALLSEND v2 — Qo'ng'iroqdan Savdoga: To'liq Web Platforma

> **Bir jumlada:** Do'konga qo'ng'iroq qilgan mijoz go'shakni qo'yishi bilan (o'zi rozilik bergan bo'lsa) katalog, narx va manzil yozilgan shaxsiy sahifa havolasini oladi. Operator esa mijoz sahifani ochganini, nimani ko'rganini va buyurtma berganini brauzerda real vaqtda ko'radi.

> **Asosiy tamoyil:** Hammasi brauzerda ishlaydi. Mobil ilova ham, Android ilova ham yo'q. Biznes ham, operator ham, mijoz ham faqat web-sahifa bilan ishlaydi.

---

## 0. v1 dan nima o'zgardi va nima uchun

| v1 dagi muammo | v2 dagi yechim |
|---|---|
| Android gateway Google Play'dan o'tmaydi, telefon fondagi xizmatni o'chirib qo'yadi | Android ilova **olib tashlandi**. Qo'ng'iroqlar bulutli ATS (virtual raqam) webhook'lari orqali olinadi, operator esa brauzerdan softphone orqali gaplashadi |
| Mijozning roziligisiz reklama SMS'i (huquqiy xavf, firibgarlik shubhasi) | **Rozilik avval olinadi:** IVR'da "1 ni bosing" yoki operator "Mijoz rozi" tugmasini bosadi. Rozilik logga yoziladi |
| Telegram bot mijozga birinchi bo'lib yoza olmaydi | Telegram **ikkinchi qadamda** ishlaydi: landingdagi "Telegramda davom etish" tugmasi botni ochadi, keyingi xabarlar bepul bot orqali boradi |
| Solo, Kompaniya, Enterprise va to'liq CRM bir vaqtda, amoCRM va Bitrix24 bilan to'g'ridan-to'g'ri raqobat | **Tor segmentdan boshlanadi.** CRM yengil, amoCRM va Bitrix24 bilan integratsiya bor ("ular bilan birga ishlaymiz, ularning o'rnini egallamaymiz") |
| Auto-Pilot `setTimeout` bilan, server qayta ishga tushsa SMS yo'qoladi | Redis + BullMQ navbati, qayta urinishlar va idempotentlik |
| Voronka qattiq `orderIndex` raqamlariga bog'langan | Hodisa → bosqich **qoidalar jadvali**, biznes o'zi sozlaydi |
| Login yo'q, tenantlar ajratilmagan, SQLite | Autentifikatsiya, RBAC, PostgreSQL RLS, audit log |
| Shaxsiy ma'lumotlarni lokalizatsiya qilish talabi hisobga olinmagan | Ma'lumotlar O'zbekiston hududidagi data-markazda saqlanadi |
| Raqamlar ("60–70%") manbasiz edi | Har bir taxmin **gipoteza** sifatida belgilangan va pilotda o'lchanadi (12-bo'lim) |

---

## 1. Muammo

Maishiy texnika, mebel, avtoqismlar va qurilish mollari do'konlariga, ko'chmas mulk agentliklariga kuniga o'nlab yoki yuzlab qo'ng'iroq keladi. Mijoz mahsulotni **ko'rmoqchi**: rasm, narx, rang, mavjudligi, manzil.

Odatda shunday suhbat bo'ladi:
- Mijoz: *"Rasmini ko'rsam bo'ladimi?"*
- Operator: *"Telegramdan yozing, tashlab beraman."*

**Natija:**
1. Mijozning bir qismi umuman yozmaydi va boshqa do'konga qo'ng'iroq qiladi.
2. Yozgan mijozga operator bir xil rasmlarni qo'lda qayta-qayta yuboradi.
3. Rahbar qo'ng'iroqlar qanchasi savdoga aylanganini bilmaydi.

> **Gipoteza H1:** "Telegramdan yozing" deyilgan mijozlarning sezilarli qismi qaytib yozmaydi.
> **Qanday o'lchanadi:** pilot do'konlarda 1 hafta davomida qo'ng'iroqlar soni va Telegramga yozganlar soni sanaladi. Bu raqam pilotgacha **taxmin**, fakt emas.

---

## 2. Maqsadli segment (aniq va tor)

### 2.1 Birinchi segment (MVP va pilot)
**Kirish qo'ng'iroqlari ko'p va mahsulotni ko'rsatish muhim bo'lgan kichik va o'rta do'konlar:**
- maishiy texnika va elektronika,
- mebel,
- avtoqismlar,
- qurilish va santexnika mollari.

**Mezonlar:** kuniga kamida 20 ta kirish qo'ng'iroq, 1–10 operator, hali kuchli CRM yo'q yoki amoCRM/Bitrix24 bor, lekin ular katalog yubormaydi.

### 2.2 Keyingi segmentlar (pilot muvaffaqiyatli bo'lgandan keyin)
- Ko'chmas mulk agentliklari (obyekt kartochkasi).
- Klinikalar va servis markazlari (narxlar ro'yxati, yozilish).
- Yetkazib berish xizmatlari.

### 2.3 Hozircha nimani qilmaymiz
- Yakka ustalar (Solo). Ular uchun to'lashga tayyorlik past va virtual raqam ulash ortiqcha murakkablik.
- To'liq CRM (hisob-faktura, ombor, buxgalteriya). Buning uchun 1C, MoySklad va boshqa tizimlar bilan integratsiya qilinadi.

---

## 3. Mahsulot: qanday ishlaydi

### 3.1 Qo'ng'iroqni olish (faqat web, ilovasiz)

Brauzer telefon qo'ng'iroqlarini o'qiy olmaydi, shuning uchun qo'ng'iroq **tarmoq tomonidan** olinadi. To'rt yo'l bor:

| Usul | Kim uchun | Qanday ishlaydi |
|---|---|---|
| **A. Bulutli ATS / virtual raqam** (asosiy) | Ko'pchilik bizneslar | Biznes bulutli ATS'da virtual raqam oladi. ATS har bir qo'ng'iroqda CallSend'ga webhook yuboradi (`ringing`, `answered`, `ended`, `missed`). Integratsiya adapter orqali qilinadi, har bir provayder uchun bitta adapter |
| **B. Mavjud raqamni yo'naltirish** | Eski raqamidan voz kechmaydigan bizneslar | Biznes o'zining eski raqamini virtual raqamga yo'naltiradi (call forwarding). Mijozlar eski raqamga qo'ng'iroq qilaveradi. *Yo'naltirish narxini har bir mobil operator bilan alohida tekshirish kerak* |
| **C. Brauzerdagi softphone** | Operatorlar | Operator qo'ng'iroqqa brauzerdan javob beradi (WebRTC/SIP, masalan JsSIP). Qo'ng'iroq kelishi bilan mijoz kartochkasi o'sha oynada ochiladi. Kompyuter, garnitura va internet yetarli |
| **D. CRM integratsiyasi** | amoCRM yoki Bitrix24 ishlatayotganlar | Telefoniyasi allaqachon CRM'ga ulangan bo'lsa, CallSend qo'ng'iroq hodisasini CRM'dan oladi va natijani (havola ochildi, buyurtma) CRM'dagi bitimga yozib qo'yadi |
| **E. Qo'lda kiritish** (zaxira yo'l) | ATS'siz kichik do'konlar, sinov davri | Operator raqamni web'dagi tezkor oynaga kiritadi va shablonni tanlaydi (≈5 soniya). Avtomatik emas, lekin hech qanday sozlashsiz ishlaydi |

> Qaysi bulutli ATS'lar O'zbekistonda webhook va WebRTC'ni qo'llab-quvvatlashi **ishlab chiqishdan oldin bitta-bitta tekshiriladi**. Birinchi adapter faqat shu tekshiruvdan o'tgan provayder uchun yoziladi.

### 3.2 Rozilik (Consent-First)

SMS faqat mijoz rozi bo'lsa yuboriladi. Bunda **ikkita yutuq** bor:
1. **Huquqiy:** reklama emas, mijozning o'zi so'ragan ma'lumot yuboriladi.
2. **Ishonch:** mijoz SMS kutayotgan bo'ladi, havolani firibgarlik deb o'ylamaydi, sahifani ochish ehtimoli oshadi.

Rozilik ikki yo'l bilan olinadi:
- **IVR orqali** (usul A/B): qo'ng'iroq boshida yoki kutish paytida *"Katalog va narxlarni SMS orqali olish uchun 1 ni bosing"*. DTMF signali webhook orqali keladi.
- **Operator orqali** (barcha usullarda): operator *"Rasmlarni SMS qilib yuboraymi?"* deb so'raydi va HUD'da **[Mijoz rozi]** tugmasini bosadi.

Har bir rozilik `ConsentLog` jadvaliga yoziladi: kim, qachon, qaysi usul bilan, qaysi qo'ng'iroq doirasida. Mijoz landingdagi "Boshqa xabar yubormang" tugmasi bilan rad etishi mumkin, shundan keyin unga hech narsa yuborilmaydi.

### 3.3 Xabar yuborish

**1-qadam: SMS (har doim yetib boradigan kanal)**
- Jo'natuvchi nomi (alpha-name) biznesning o'z nomi bo'ladi, notanish raqam emas.
- Matnning namunasi: *"Artel Markaz: so'ragan konditsioneringiz narxi va rasmlari: cs.uz/a/xY7z7"*
- Shablonlar SMS agregatorida oldindan **moderatsiyadan o'tkaziladi**. Onboarding paytida shablonlar avtomatik moderatsiyaga yuboriladi.
- Agregatorlar adapter orqali ulanadi (Eskiz va boshqalar, test uchun Mock).

**2-qadam: Telegram (bepul davomiy aloqa)**
- Landingda **"Telegramda davom etish"** tugmasi bor. U `t.me/bot?start=<token>` havolasini ochadi.
- Mijoz `/start` bosgach, bot uni taniydi (token → mijoz) va `telegramChatId` saqlanadi.
- Shu mijozga keyingi xabarlar SMS emas, **bot orqali** bepul yuboriladi.
- Bu Telegram qoidalariga to'liq mos keladi, chunki aloqani mijozning o'zi boshlaydi.

**Kelajakda:** WhatsApp Business Cloud API (xalqaro bozor uchun).

### 3.4 Mikro-landing (mijoz sahifasi)

- **Alohida, juda yengil sahifa:** server-side render qilingan HTML, minimal JS. Operator paneli bilan bitta bundle'da emas. Maqsad: 3G tarmoqda 1 soniyadan tez ochilishi.
- **Domen:** qisqa va doimiy domen. Enterprise tarifida biznesning o'z subdomeni (masalan `katalog.artel-markaz.uz`).
- **Tarkibi:**
  - biznes logotipi va nomi (mijoz kimdan kelganini darhol ko'radi),
  - operator tanlagan mahsulot yoki katalog bo'limi: rasmlar, narx, mavjudligi,
  - **[Buyurtma berish]**: ism va raqam allaqachon to'ldirilgan, bitta bosish yetarli,
  - **[Qayta qo'ng'iroq qiling]**: operatorga vazifa (callback task) yaratiladi,
  - **[Xaritada ko'rish]**: eng yaqin filial, Yandex yoki Google xarita orqali,
  - **[Telegramda davom etish]**,
  - **[Boshqa xabar yubormang]** (rad etish).
- **Havolaning muddati:** sozlanadi (standart 30 kun). Muddati o'tgach, faqat biznes kontaktlari ko'rinadi, shaxsiy ma'lumotlar ko'rsatilmaydi.
- **Xavfsizlik:** shortCode kamida 7 belgi, tasodifiy. Sahifada telefon raqami qisman yashirilib ko'rsatiladi (`+998 90 *** ** 67`).

### 3.5 Jonli radar

Operator ekranida, telefonda gaplashib turgan paytda yoki undan keyin, quyidagilar real vaqtda ko'rinadi:
- ✅ SMS yetkazildi (agregatordan delivery report),
- 👁️ **Mijoz sahifani ochdi** (qurilma turi bilan),
- 🖼️ qaysi mahsulotni ko'ryapti va qancha vaqt,
- 🗺️ xaritani bosdi / 💬 Telegramga o'tdi,
- 🛒 **Buyurtma berdi.**

Bu operatorga suhbat davomida *"Ko'ryapsizmi, oq rangi ham bor"* deb savdoni o'sha zahoti yopish imkonini beradi. Bu CallSend'ning **asosiy farqlovchi xususiyati**.

### 3.6 Operator HUD (brauzer)

- Qo'ng'iroq kelganda mijoz kartochkasi avtomatik ochiladi: ismi, oldingi qo'ng'iroqlari, buyurtmalari, ochiq bitimi.
- `[1] [2] [3]` tugmalari: shu operator yoki filial uchun eng ko'p ishlatiladigan shablonlar.
- **Katalog qidiruvi:** operator mahsulot nomini yozadi va bitta yoki bir nechta mahsulotni tanlab yuboradi. Landing aynan shu mahsulotlar bilan yaratiladi.
- **[Mijoz rozi]** → **[Yuborish]**: ikki bosish.
- Izoh yozish, callback vazifa qo'yish, mijozni boshqa filialga o'tkazish (lead transfer).
- Softphone (usul C) shu oynaga o'rnatilgan.

### 3.7 Auto-Pilot (qoidalar asosida)

Biznes qoidalarni o'zi sozlaydi. Masalan:
- *"Javobsiz qo'ng'iroq + IVR'da rozilik berilgan bo'lsa → 1 daqiqadan keyin 'Kechirasiz, band edik' shablonini yuborish va callback vazifa yaratish."*
- *"Javob berilgan qo'ng'iroq, lekin operator 10 daqiqa ichida hech narsa yubormagan bo'lsa → menejerga eslatma."*
- *"Bir mijozga 24 soat ichida 2 tadan ortiq SMS yuborilmasin"* (spam va xarajatdan himoya).

Rozilik bo'lmasa, Auto-Pilot **hech qachon** SMS yubormaydi.

---

## 4. Yengil CRM va integratsiyalar

### 4.1 O'zimizning yengil CRM (CRM'i yo'q bizneslar uchun)
- **Voronka:** Yangi murojaat → Havola ochildi → Muzokara → Buyurtma → Yutildi / Yo'qotildi.
- **Avtomatik o'tishlar qoidalar jadvali orqali**, bosqich raqamiga bog'lanmagan:

| Hodisa | Shart | Natija |
|---|---|---|
| `call.started` | Mijozning ochiq bitimi yo'q | Yangi bitim → "Yangi murojaat" bosqichi |
| `landing.opened` | Bitim "Yangi murojaat" bosqichida | → "Havola ochildi" |
| `order.created` | Bitim yakuniy bosqichda emas | → "Buyurtma" (bitim hech qachon **orqaga** surilmaydi) |

  Biznes bosqichlarni qayta nomlashi, qo'shishi yoki o'chirishi mumkin, qoidalar `stageId` orqali ishlaydi.
- **Mijoz 360°:** qo'ng'iroqlar, xabarlar, sahifa ochilishlari, buyurtmalar, izohlar, vazifalar va rozilik tarixi bitta vaqt chizig'ida.
- **Vazifalar:** callback eslatmalari, muddati o'tganlar alohida ko'rsatiladi.

### 4.2 Integratsiyalar (CRM'i bor bizneslar uchun)
- **amoCRM va Bitrix24:** CallSend ularning ichida widget yoki ilova sifatida ishlaydi. Havola ochilgani va buyurtmalar ularning bitimiga izoh yoki hodisa bo'lib yoziladi, kerak bo'lsa bitimning bosqichi ham o'zgartiriladi.
- **Katalog importi:** CSV/Excel, keyinroq MoySklad va 1C sinxronizatsiyasi.
- **Ochiq API va webhook'lar** (Enterprise).

> Pozitsiya: **"CRM'ingizni almashtirmang, unga katalog va radar qo'shing."** Bu amoCRM va Bitrix24 bilan to'g'ridan-to'g'ri raqobatdan qochish va ularning foydalanuvchilarini ham mijozga aylantirish imkonini beradi.

---

## 5. Foydalanuvchilar va rollar (RBAC)

| Rol | Huquqlar |
|---|---|
| **Platform Admin** | Tenantlar, tariflar, provayder balanslari, tizim holati, audit |
| **Platform Support** | Faqat o'qish, integratsiya loglari (tenant ruxsati bilan, vaqtinchalik kirish) |
| **Owner** (biznes egasi) | Barcha filiallar, billing, integratsiyalar, xodimlar, umumiy hisobotlar |
| **Branch Manager** | O'z filiali: operatorlar, katalog, shablonlar, filial hisobotlari |
| **Operator** | HUD, o'ziga biriktirilgan va filialidagi mijozlar, xabar yuborish, izoh va vazifalar |
| **Mijoz** | Login yo'q. Faqat o'z shortCode sahifasini ko'radi |

**Kirish:** telefon raqami + SMS OTP yoki email + parol, ixtiyoriy 2FA. JWT (qisqa muddatli) + refresh token.
**Ruxsat har bir so'rovda serverda tekshiriladi.** `organizationId` hech qachon frontend'dan olinmaydi, faqat tokendan olinadi.

---

## 6. Texnik arxitektura (100% web)

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Brauzer (web)                                 │
│  ┌────────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │ Operator HUD + CRM │  │ Mikro-landing     │  │ Admin panel      │  │
│  │ React + Vite (SPA) │  │ SSR HTML, minimal │  │ (React)          │  │
│  │ + WebRTC softphone │  │ JS, alohida servis│  │                  │  │
│  └─────────┬──────────┘  └────────┬──────────┘  └────────┬─────────┘  │
└────────────┼──────────────────────┼──────────────────────┼────────────┘
             │ HTTPS + WebSocket    │ HTTPS                │
             ▼                      ▼                      ▼
┌───────────────────────────────────────────────────────────────────────┐
│                 NestJS API (stateless, gorizontal kengayadi)          │
│  Auth/RBAC │ Telephony adapters │ Messaging adapters │ CRM │ Tracking │
│  Rules engine │ Billing │ Integrations (amoCRM, Bitrix24) │ Audit     │
│  Socket.io (Redis adapter: bir nechta instance uchun)                 │
└──────────┬─────────────────────────┬───────────────────────┬──────────┘
           ▼                         ▼                       ▼
┌────────────────────┐   ┌──────────────────────┐  ┌───────────────────┐
│ PostgreSQL 16      │   │ Redis + BullMQ       │  │ Obyekt saqlash    │
│ Prisma, RLS        │   │ SMS navbati, retry,  │  │ (mahsulot rasmlari│
│ (tenant ajratish)  │   │ kechiktirilgan       │  │  S3-mos) + CDN    │
│                    │   │ vazifalar, rate-limit│  │                   │
└────────────────────┘   └──────────────────────┘  └───────────────────┘
           ▲
           │ webhook'lar (imzo bilan tekshiriladi)
┌──────────┴─────────────────────────────────────────────────────────────┐
│ Tashqi: Bulutli ATS │ SMS agregatorlari │ Telegram Bot API │ amoCRM/B24 │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Ishonchlilik qoidalari
- **Webhook idempotentligi:** har bir ATS hodisasi `(provider, externalCallId, event)` kaliti bilan saqlanadi, takroriy hodisa e'tiborga olinmaydi.
- **Qo'ng'iroqlar `externalCallId` orqali bog'lanadi.** Raqam bo'yicha qidirilmaydi, shuning uchun bitta raqamdan parallel qo'ng'iroqlar chalkashmaydi.
- **Barcha yuborishlar navbat orqali:** `setTimeout` ishlatilmaydi. Qayta urinish (exponential backoff), dead-letter navbati, server qayta ishga tushsa ham vazifa yo'qolmaydi.
- **SMS balansi atomar yechiladi** (tranzaksiya ichida `balance >= cost` sharti bilan). Balans manfiyga tushmaydi.
- **Webhook imzosi** (HMAC yoki provayder tokeni) tekshiriladi. Imzosiz so'rov rad etiladi.

### 6.2 Xavfsizlik va ma'lumotlar
- **Tenant ajratish:** PostgreSQL Row-Level Security + har bir so'rovda `app.tenant_id` sozlanadi. Ilova darajasidagi xato ham boshqa tenant ma'lumotini ochib bermaydi.
- **Socket xonalari:** foydalanuvchi faqat tokenida ko'rsatilgan org va filial xonalariga qo'shiladi.
- **Rate limit:** public landing va order endpoint'lari uchun IP va shortCode bo'yicha.
- **Shaxsiy ma'lumotlar lokalizatsiyasi:** O'zbekiston fuqarolarining shaxsiy ma'lumotlari O'zbekiston hududidagi serverlarda saqlanadi (qonun talabi). Hosting shunga qarab tanlanadi.
- **Audit log:** kim qaysi mijoz ma'lumotini ko'rdi yoki o'zgartirdi, kim qaysi xabarni yubordi.
- **Ma'lumotlarni saqlash muddati** sozlanadi. Mijoz so'rovi bilan ma'lumotlari o'chiriladi.

### 6.3 Asosiy ma'lumotlar modeli (v1 ga qo'shimchalar)
- `ConsentLog`: customerId, method (`IVR` | `OPERATOR` | `TELEGRAM`), callLogId, userId, grantedAt, revokedAt.
- `CallLog.externalCallId` + `provider` (unikal indeks).
- `WebhookEvent`: idempotentlik va debug uchun xom hodisalar.
- `Product` / `CatalogItem`: rasmlar, narx, mavjudligi, filial bo'yicha.
- `MessageLog.items`: landingda ko'rsatiladigan aniq mahsulotlar.
- `AutomationRule`: trigger, conditions (JSON), action, isActive.
- `StageRule`: hodisa → stageId.
- `Integration`: tenant uchun ATS, SMS, CRM sozlamalari (shifrlangan secret'lar bilan).
- `AuditLog`, `Subscription`, `Invoice`, `UsageRecord`.

---

## 7. Biznes model

### 7.1 Tamoyillar
1. **Obuna** (oylik, operatorlar yoki filiallar soniga qarab) **+ SMS o'z tannarxi va shaffof marja bilan**.
2. **Telegram orqali yuborilgan xabarlar bepul**, bu mijozlarni Telegramga o'tkazishga qiziqtiradi va biznesning SMS xarajatini kamaytiradi.
3. **Sinov muddati:** 14 kun, cheklangan SMS bilan.

### 7.2 Tariflar (dastlabki tuzilma)

| Tarif | Kim uchun | Nimalar kiradi |
|---|---|---|
| **START** | 1 filial, 1–3 operator | HUD, qo'lda va ATS rejimi, landing, radar, yengil CRM, 1 ta ATS adapteri |
| **PRO** | 2–5 filial | + Auto-Pilot qoidalari, amoCRM/Bitrix24 integratsiyasi, katalog importi, kengaytirilgan hisobotlar |
| **ENTERPRISE** | Tarmoqlar | + Cheksiz filiallar, o'z domeni va alpha-name, API, SLA, alohida menejer |

> **Narxlar ataylab yozilmagan.** Ular quyidagilardan keyin belgilanadi:
> 1. SMS agregatoridan 1 ta SMS'ning haqiqiy tannarxi olinadi.
> 2. Bulutli ATS va virtual raqam narxi aniqlanadi (biznesning qo'shimcha xarajati).
> 3. Pilotda biznes bitta qo'shimcha savdodan qancha foyda ko'rishi o'lchanadi.
>
> **Qoida:** biznes uchun oylik to'lov pilotda o'lchangan qo'shimcha savdo foydasidan sezilarli darajada kam bo'lishi kerak. Aks holda tarif qayta ko'rib chiqiladi.

### 7.3 Unit-iqtisodiyot (pilotda hisoblanadi)
- Bitta mijozni jalb qilish narxi (CAC) va mijoz umrbod qiymati (LTV) solishtiriladi, maqsad LTV/CAC > 3.
- SMS bo'yicha yalpi marja va Telegramga o'tgan mijozlar ulushi kuzatiladi.
- Oylik churn (tark etish) kuzatiladi.

---

## 8. Bozorga chiqish (Go-to-Market)

1. **Pilot (3–5 do'kon, bepul):** birinchi segmentdan. Maqsad ishlashini va qiymatini isbotlash (12-bo'lim).
2. **Case study:** pilot raqamlari asosida ("Do'kon X: qo'ng'iroqlardan buyurtmaga konversiya N% dan M% ga o'sdi"), faqat haqiqiy raqamlar bilan.
3. **Hamkorlar:**
   - bulutli ATS provayderlari: ularning mijozlari uchun tayyor qo'shimcha xizmat,
   - amoCRM va Bitrix24 integratorlari: ular CallSend'ni o'z mijozlariga sotadi va komissiya oladi.
4. **To'g'ridan-to'g'ri savdo:** bozorlar va savdo markazlaridagi do'konlarga jonli demo. Demo chog'ida egasining o'z telefoniga SMS keladi va radar yonganini o'zi ko'radi.
5. **Onboarding 1 kun ichida:** virtual raqam ulash, katalog yuklash (Excel), shablonlarni moderatsiyaga yuborish. Buni CallSend jamoasi o'zi qilib beradi.

---

## 9. Raqobat va farqlanish

| | Oddiy "missed call SMS" xizmatlari | amoCRM / Bitrix24 | **CallSend** |
|---|---|---|---|
| Qo'ng'iroqdan keyin SMS | Bor | Integratsiya/widget orqali | Bor, **rozilik bilan** |
| Shaxsiy mahsulot sahifasi | Yo'q (faqat matn) | Asosiy funksiya emas | **Asosiy funksiya** |
| Jonli radar (suhbat paytida) | Yo'q | Yo'q | **Bor** |
| Telegramga o'tkazish | Yo'q | Alohida sozlanadi | **O'rnatilgan** |
| CRM | Yo'q | To'liq | Yengil + ular bilan integratsiya |
| Sozlash murakkabligi | Past | Yuqori | Past, onboarding'ni jamoa qiladi |

> Jadvaldagi raqobatchilar ma'lumotlari umumiy bilimga asoslangan. Har bir raqobatchining aniq funksiyalari bozorga chiqishdan oldin **alohida tekshiriladi**.

**Himoya qilsa bo'ladigan ustunliklar:** radar va landing tajribasi, mahalliy ATS va SMS integratsiyalari, segment uchun tayyor shablonlar va katalog, hamkorlar tarmog'i.

---

## 10. Xavflar va ularni kamaytirish

| Xavf | Ehtimol | Ta'sir | Kamaytirish |
|---|---|---|---|
| SMS agregatori havolali shablonni rad etadi | O'rta | Yuqori | Pilotgacha sinab ko'riladi. Bir nechta agregator adapteri. Biznesning o'z domeni va nomi |
| Bulutli ATS'da webhook yoki WebRTC yo'q | O'rta | Yuqori | Ishlab chiqishdan oldin provayderlar tekshiriladi. Zaxira yo'llar: E (qo'lda) va D (CRM orqali) |
| Biznes virtual raqamga o'tishni xohlamaydi | O'rta | O'rta | Call forwarding (usul B), qo'lda rejim (E) |
| Mijozlar havolani ochmaydi | O'rta | Yuqori | Rozilik, biznes nomi alpha-name sifatida, qisqa va tushunarli matn. Pilotda A/B test |
| Huquqiy talablar (reklama, shaxsiy ma'lumotlar) | Past–O'rta | Yuqori | Rozilik logi, O'zbekistonda hosting, yurist konsultatsiyasi |
| Yirik CRM'lar shu funksiyani qo'shadi | O'rta | O'rta | Ular bilan integratsiya, hamkorlik, tor segmentdagi chuqur tajriba |
| Biznes to'lashga tayyor emas | O'rta | Yuqori | Narx pilotda o'lchangan foydaga bog'lanadi. Agar foyda bo'lmasa, g'oya qayta ko'rib chiqiladi |

---

## 11. Asosiy ko'rsatkichlar (KPI)

**Mahsulot voronkasi (har bir biznes uchun hisobotda):**
1. Kirish qo'ng'iroqlari
2. → Rozilik olinganlar (%)
3. → SMS yetkazilganlar (%)
4. → **Sahifani ochganlar (%)**
5. → Harakat qilganlar: buyurtma, callback, xarita, Telegram (%)
6. → **Buyurtma / savdo (%)**
7. → Telegramga o'tganlar (%)

**Biznes ko'rsatkichlari:** MRR, churn, LTV/CAC, SMS yalpi marjasi, onboarding vaqti, faol operatorlar soni.

**Operator ko'rsatkichlari:** qo'ng'iroqdan xabar yuborishgacha bo'lgan vaqt, operatorlar bo'yicha konversiya.

---

## 12. Validatsiya rejasi (eng muhim bo'lim)

G'oya qog'ozda emas, **raqamlarda** isbotlanadi. Ishlab chiqish shu bosqichlarga bo'ysunadi:

### 0-bosqich: Texnik tekshiruv (1–2 hafta, kod yozishdan oldin)
- [ ] Kamida 1 ta bulutli ATS: webhook (ringing/ended/missed, DTMF) va WebRTC ishlaydi.
- [ ] Kamida 1 ta SMS agregatori: havolali shablon moderatsiyadan o'tadi, tannarx ma'lum.
- [ ] Yurist: rozilik bilan yuborilgan SMS va ma'lumotlarni saqlash talablari tasdiqlandi.

**Agar shulardan biri o'tmasa,** yo'l 3.1 dagi zaxira usullarga o'zgartiriladi yoki g'oya qayta ko'rib chiqiladi.

### 1-bosqich: Concierge pilot (2–4 hafta, 3–5 do'kon)
- Minimal MVP: qo'lda rejim + 1 ta ATS adapteri + landing + radar + rozilik.
- **Avval baseline:** 1 hafta CallSend'siz, qo'ng'iroqlar va savdolar sanaladi.
- Keyin 2–3 hafta CallSend bilan.

**Muvaffaqiyat mezonlari (gipotezalar, pilotdan keyin aniqlashtiriladi):**

| Ko'rsatkich | Maqsad |
|---|---|
| Rozilik bergan mijozlar | ≥ 50% |
| SMS'ni ochganlar (rozilik berganlar ichida) | ≥ 40% |
| Qo'ng'iroqdan savdoga konversiya | Baseline'ga nisbatan sezilarli o'sish |
| Operatorlar har kuni ishlatadi | Pilot do'konlarining ≥ 80% ida |
| Pilotdan keyin pul to'lashga rozi | Do'konlarning ≥ 3 tasi |

### 2-bosqich: Pullik beta (2–3 oy, 20–30 biznes)
- Auth, RBAC, RLS, navbat, billing, amoCRM/Bitrix24 integratsiyasi.
- Narx, churn va CAC o'lchanadi.

### 3-bosqich: Masshtablash
- Qo'shimcha ATS va SMS adapterlari, keyingi segmentlar, hamkorlar dasturi, Enterprise.

---

## 13. Roadmap

| Bosqich | Tarkibi |
|---|---|
| **MVP (pilot uchun)** | Qo'lda rejim, 1 ta ATS adapteri, rozilik, SMS (1 ta agregator), SSR landing, radar, HUD, yengil voronka, auth (oddiy) |
| **Beta** | RBAC + RLS, BullMQ navbati, webhook idempotentligi, katalog (Excel import), qoidalar dvigateli, Telegram bot, billing, audit log, O'zbekistonda hosting |
| **v1.0** | WebRTC softphone, amoCRM va Bitrix24 integratsiyalari, kengaytirilgan hisobotlar, bir nechta filial, lead transfer |
| **v1.x** | Qo'shimcha ATS va SMS adapterlari, o'z domeni va alpha-name, ochiq API, MoySklad/1C sinxronizatsiyasi |
| **Kelajak** | Qo'ng'iroq yozuvidan mahsulotni avtomatik aniqlash (AI) va operatorga mos kartochkani tavsiya qilish, WhatsApp Business, xalqaro bozorlar |

---

## 14. Joriy kod bazasidan v2 ga o'tish

| Qism | Holat | Kerakli o'zgarish |
|---|---|---|
| `apps/android-gateway` | Endi kerak emas | O'chiriladi yoki arxivlanadi |
| `apps/server` telephony | Android formatiga bog'langan, raqam bo'yicha qidiradi | ATS adapter interfeysi, `externalCallId`, idempotentlik, imzo tekshiruvi |
| `apps/server` messages | `setTimeout`, faqat SMS, rozilik yo'q | BullMQ, `ConsentLog` tekshiruvi, atomar balans, Telegram kanali |
| `apps/server` tracking | Bosqich qattiq `orderIndex` ga bog'langan | `StageRule` jadvali, bitim orqaga surilmasligi, rate-limit |
| `apps/server` umumiy | Auth va RBAC yo'q, SQLite | JWT + RBAC guard'lar, PostgreSQL + RLS, audit |
| `apps/server` gateway | Istalgan xonaga qo'shilish mumkin | Socket auth, xonalar tokendan olinadi, Redis adapter |
| `apps/web` MicroLanding | SPA ichida, umumiy bundle | Alohida SSR servis |
| `apps/web` OperatorHud | `[1][2][3]`, simulyator | Rozilik tugmasi, katalog qidiruvi, softphone, qo'lda kiritish oynasi |

---

> **Yakuniy tamoyil:** CallSend'ning muvaffaqiyati funksiyalar soniga emas, bitta raqamga bog'liq: **qo'ng'iroq qilgan mijozlarning qancha qismi bizning havolamiz orqali xarid qildi.** Har bir qaror shu raqamni oshiradimi yoki yo'qmi, shu nuqtai nazardan qabul qilinadi.
