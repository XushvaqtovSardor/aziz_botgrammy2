# Kino Bot - To'liq Loyiha Arxitekturasi

## Texnologiyalar
- **Backend**: NestJS 11.x
- **ORM**: Prisma 7.1.0 + PostgreSQL
- **Bot**: Telegraf 4.16.3
- **Deployment**: Digital Ocean + Docker
- **Database**: PostgreSQL (Neon)

## Loyiha Strukturasi

```
src/
├── modules/
│   ├── admin/              # Admin panel
│   │   ├── admin.module.ts
│   │   ├── admin.service.ts
│   │   ├── controllers/
│   │   │   ├── field.controller.ts       # Field boshqaruvi
│   │   │   ├── content.controller.ts     # Kino/Serial CRUD
│   │   │   ├── payment.controller.ts     # Payment tasdiqlash
│   │   │   ├── broadcast.controller.ts   # Xabar yuborish
│   │   │   └── stats.controller.ts       # Statistika
│   │   ├── guards/
│   │   │   ├── admin.guard.ts           # Admin tekshirish
│   │   │   ├── role.guard.ts            # Role-based access
│   │   │   └── superadmin.guard.ts      # SuperAdmin only
│   │   └── decorators/
│   │       └── roles.decorator.ts
│   │
│   ├── user/               # User panel
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   ├── user.update.ts               # Telegram handlers
│   │   └── middlewares/
│   │       ├── subscription.middleware.ts
│   │       └── premium.middleware.ts
│   │
│   ├── content/            # Kino va Serial
│   │   ├── content.module.ts
│   │   ├── movie.service.ts
│   │   ├── serial.service.ts
│   │   ├── episode.service.ts
│   │   └── watch-history.service.ts
│   │
│   ├── field/              # Field boshqaruvi
│   │   ├── field.module.ts
│   │   ├── field.service.ts
│   │   └── database-channel.service.ts
│   │
│   ├── payment/            # Premium va to'lovlar
│   │   ├── payment.module.ts
│   │   ├── payment.service.ts
│   │   └── premium.service.ts
│   │
│   ├── channel/            # Majburiy kanallar
│   │   ├── channel.module.ts
│   │   ├── channel.service.ts
│   │   └── subscription-checker.service.ts
│   │
│   ├── broadcast/          # Broadcast xabarlari
│   │   ├── broadcast.module.ts
│   │   └── broadcast.service.ts
│   │
│   ├── language/           # Multi-language
│   │   ├── language.module.ts
│   │   ├── language.service.ts
│   │   └── translations/
│   │       ├── uz.json
│   │       ├── ru.json
│   │       └── en.json
│   │
│   └── statistics/         # Statistika
│       ├── statistics.module.ts
│       └── statistics.service.ts
│
├── shared/
│   ├── guards/
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   └── utils/
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── app.module.ts
└── main.ts
```

## Database Schema

### Enums
- `AdminRole`: SUPERADMIN, MANAGER, ADMIN
- `Language`: UZ, RU, EN
- `ContentType`: MOVIE, SERIAL
- `BroadcastType`: AD, NOTIFICATION
- `PaymentStatus`: PENDING, APPROVED, REJECTED

### Models
1. **User** - Foydalanuvchilar
2. **Admin** - Admin foydalanuvchilar (role-based)
3. **Field** - Kontent kanallari
4. **DatabaseChannel** - Video saqlash kanali
5. **MandatoryChannel** - Majburiy obuna kanallari
6. **Movie** - Kinolar
7. **Serial** - Seriallar
8. **Episode** - Serial qismlari
9. **WatchHistory** - Ko'rish tarixi
10. **Payment** - To'lovlar
11. **PremiumSettings** - Premium sozlamalari
12. **BotSettings** - Bot sozlamalari
13. **Broadcast** - Broadcast xabarlari

## Admin Rollari

### SuperAdmin
- Premium bilan ishlash
- Payment tasdiqlash/rad etish
- Yangi admin qo'shish
- Barcha funksiyalar

### Manager
- Kino/Serial yaratish, tahrirlash, o'chirish
- Field boshqaruvi
- Majburiy kanallar
- Broadcast yuborish
- Statistika

### Admin
- Kino/Serial yaratish, tahrirlash
- Faqat o'z yaragan kontentni ko'rish
- Statistika

## User Paneli Funksiyalari

### 1. Kino Qidirish
- Kod orqali qidirish
- Kino ma'lumotlarini ko'rsatish
- Share link orqali do'stlarga ulashish
- Video tomosha qilish

### 2. Til O'zgartirish
- O'zbek tili
- Rus tili
- Ingliz tili

### 3. Premium Obuna
- To'lov ma'lumotlarini ko'rish
- Chek yuklash
- Tasdiqlash kutish

### 4. Bot Haqida
- Bot ma'lumotlari
- Support kontakti

## Admin Panel Funksiyalari

### 1. Field Qo'shish
- Yangi kanal qo'shish
- Kanal link va ID
- CRUD operatsiyalari

### 2. Database Kanal
- Video saqlash kanali sozlash
- Kanal ID va link

### 3. Kino Yuklash
1. Kod kiritish (avtomatik band kod tekshirish)
2. Nom
3. Rasm (poster)
4. Janr (optional)
5. Til (optional)
6. Sifat (optional)
7. Description (optional)
8. Video yuklash
9. Field tanlash
10. Asosiy kanalga yuborish

### 4. Serial Yuklash
**Yangi Serial:**
1. Asosiy yoki yangi kanal tanlash
2. Kod (band kod tekshirish)
3. Nom, janr, description
4. Poster rasm
5. Asosiy kanalga yuborish
6. Qismlarni yuklash boshlash

**Mavjud Serialga Qism Qo'shish:**
1. Serial kod kiritish
2. Keyingi qism raqami
3. Qism nomi, description
4. Video yuklash
5. Database kanalga yuborish

### 5. Majburiy Kanallar
- Kanal qo'shish
- Link, ID, nom
- Tartib raqami
- CRUD operatsiyalari

### 6. Kinolarni Tahrirlash
- Ro'yxatni ko'rish (kod + nom)
- Tanlash va tahrirlash
- Rasm, nom, janr, description o'zgartirish
- Video almashtirish
- O'chirish (faqat ruxsat bor adminlar)

### 7. Yangi Admin Qo'shish
- Username kiritish
- Role tanlash (SuperAdmin, Manager, Admin)
- Huquqlar berish

### 8. Statistika
- Jami foydalanuvchilar
- Jami kinolar/seriallar
- Eng ko'p ko'rilganlar (TOP 10)
- Oxirgi hafta/oy active userlar
- Yangi foydalanuvchilar

### 9. Premium Panel (faqat SuperAdmin)
- Narx belgilash
- Karta ma'lumotlari
- To'lov kanali
- Pending paymentlarni ko'rish
- Tasdiqlash/Rad etish

### 10. Broadcast
- Xabar turi (Reklama/Xabarnoma)
- Matn yozish
- Media yuklash (optional)
- Yuborish

### 11. Userlarni Bloklash
- Username orqali
- Ro'yxatdan qidirish
- Block qilish
- Ogohlantirish (3 marta)

### 12. Yo'riqnoma
- Admin uchun qo'llanma
- Barcha buyruqlar tushuntirilgan

## Environment Variables

```env
# Bot
BOT_TOKEN=your_bot_token

# Database
DATABASE_URL=postgresql://...

# SuperAdmin
SUPERADMIN_CHAT_IDS=123456,789012

# Server
PORT=3000
NODE_ENV=production
```

## Deployment (Digital Ocean)

### 1. Docker Compose
```yaml
version: '3.8'
services:
  bot:
    build: .
    environment:
      - DATABASE_URL
      - BOT_TOKEN
    restart: always
    
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD
    restart: always
```

### 2. Deployment Steps
1. Digital Ocean Droplet yaratish
2. Docker o'rnatish
3. Repository clone qilish
4. Environment variables sozlash
5. Docker Compose build va run
6. Nginx reverse proxy (optional)

## Keyingi Qadamlar

1. ✅ Database schema yaratildi
2. ⏳ Language service yaratish
3. ⏳ Admin guards va role-based access
4. ⏳ User panel handlers
5. ⏳ Admin panel controllers
6. ⏳ Payment system
7. ⏳ Broadcast system
8. ⏳ Statistics dashboard
9. ⏳ Docker va deployment konfiguratsiyasi

---

**Loyiha juda katta va murakkab. Har bir modul alohida qilib qurish kerak.**
