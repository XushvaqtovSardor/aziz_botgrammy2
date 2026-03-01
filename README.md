# 🎬 Aziz Kino Bot

![Deploy Status](https://github.com/XushvaqtovSardor/aziz_botgrammy2/actions/workflows/deploy.yml/badge.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![Docker](https://img.shields.io/badge/docker-enabled-blue)

Telegram bot for managing and sharing movies and TV series with premium subscriptions and payment integration.

## ✨ Features

- 🎬 **Movie Management** - Upload, organize, and share movies
- 📺 **Series Management** - Manage TV series with episodes
- 📁 **Field Channels** - Organize content by categories
- 💎 **Premium Subscriptions** - Monthly, quarterly, semi-annual, and annual plans
- 💳 **Payment Integration** - Payme and Click payment gateways
- 👥 **Admin Panel** - Multi-level admin system with roles
- 📊 **Analytics** - View statistics and user engagement
- 🔔 **Broadcasting** - Send messages to all users
- 📤 **Share Functionality** - Inline queries and share buttons
- 🔍 **Search** - Find movies by code
- ⚡ **Fast Performance** - Optimized with caching and database indexing
- 🐳 **Docker Ready** - One-click deployment with Docker Compose
- 🚀 **Auto Deploy** - GitHub Actions integration for CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm (Package Manager)
- PostgreSQL database
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### Local Development

```bash
# Clone repository
git clone https://github.com/XushvaqtovSardor/aziz_botgrammy2.git
cd aziz_botgrammy2

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
pnpm prisma generate
pnpm prisma migrate dev

# Start development server
pnpm start:dev
```

### 🐳 Docker Production Deployment (Recommended)

**Step 1: Configure .env.production**
```bash
# Edit .env.production file and set:
BOT_TOKEN=your_bot_token_here
BOT_USERNAME=your_bot_username
POSTGRES_PASSWORD=SecurePass2026!@#
WEB_PANEL_URL=http://YOUR_SERVER_IP:3000/admin/
```

**Step 2: Deploy on Server**
```bash
# Build and start services
docker compose up -d

# View logs
docker compose logs -f app

# Check status
docker compose ps
```

**Or use deploy script:**
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

📖 See [PRODUCTION_DEPLOY.md](./PRODUCTION_DEPLOY.md) for detailed guide.

### Digital Ocean Deployment

See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for one-command deployment or [DIGITAL_OCEAN_DEPLOY.md](./DIGITAL_OCEAN_DEPLOY.md) for complete guide.

**Quick Deploy:**
```bash
# On your droplet
git clone https://github.com/XushvaqtovSardor/aziz_botgrammy2.git
cd aziz_botgrammy2
cp .env.example .env
nano .env  # Configure settings
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## 📚 Documentation

- **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - Digital Ocean deploy qo'llanmasi (O'zbekcha)
- **[GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)** - Avtomatik deploy sozlash
- **[DOCKER_DESKTOP.md](./DOCKER_DESKTOP.md)** - Windows/Docker Desktop test
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture

## 🐳 Docker Deployment

### Quick Start

```bash
# Environment sozlash
cp .env.example .env
nano .env  # Konfiguratsiya

# Docker bilan start
docker compose up -d

# Status tekshirish
docker compose ps

# Loglar
docker compose logs -f
```

## 🗄️ Database Backup & Restore

Avtomatik backup tizimi o'rnatilgan - ma'lumotlar 180 kun (6 oy) saqlanadi.

### ⚡ Tezkor Qo'llanma

**Backup Yaratish:**
```bash
./scripts/manual-backup.sh
```

**Restore Qilish:**
```bash
# 1. Backuplarni ko'rish
ls -lht backups/

# 2. Restore qilish  
./scripts/manual-restore.sh aziz_db_backup_20260223_143000.sql.gz

# 3. ⚠️ MUHIM: Botni qayta ishga tushirish
docker compose restart app
```

**⚠️ ESLATMA:** Restore qilgandan keyin **ALBATTA** botni qayta ishga tushiring!

### 📖 To'liq Qo'llanmalar

- 🚀 **[Tezkor Qo'llanma](BACKUP_QUICKSTART.md)** - Eng muhim ma'lumotlar
- 📖 **[To'liq Qo'llanma](BACKUP_QOLLANMA.md)** - Batafsil amaliyot
- 🔄 **[Restore Guide](scripts/RESTORE_GUIDE.md)** - Tiklash bo'yicha

### Avtomatik Backup
- ✅ Har 6 soatda avtomatik backup (Docker container orbital)
- ✅ Siqilgan format (gzip) - joy tejaydi  
- ✅ 180 kun (6 oy) saqlanadi
- ✅ Integrity test - buzilgan backuplar o'chiriladi
- ✅ Git repositoriyaga yuklanmaydi (.gitignore da)

### Digital Ocean Droplet

**Qisqa yo'l:**
```bash
ssh root@YOUR_DROPLET_IP
cd /root
git clone https://github.com/XushvaqtovSardor/aziz_botgrammy2.git
cd aziz_botgrammy2
cp .env.example .env
nano .env  # Configure
chmod +x deploy.sh
./deploy.sh
```

**Batafsil qo'llanma:** [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)

## 🚀 GitHub Actions - Auto Deploy

Push qilsangiz avtomatik deploy bo'ladi!

### Sozlash:

1. **GitHub Secrets qo'shish** (`Settings` → `Secrets`):
   - `SSH_HOST` - Droplet IP
   - `SSH_USER` - `root`
   - `SSH_KEY` - SSH private key

2. **Push qilish:**
```bash
git add .
git commit -m "Update"
git push origin main
```

3. **Avtomatik deploy ishga tushadi!** 🎉

**Batafsil:** [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)

## 📁 Project Structure

```
aziz_bot_grammy/
├── src/
│   ├── modules/
│   │   ├── admin/              # Admin panel and handlers
│   │   ├── user/               # User bot handlers
│   │   ├── content/            # Movies and serials management
│   │   │   ├── movie.service.ts
│   │   │   ├── serial.service.ts
│   │   │   └── episode.service.ts
│   │   ├── field/              # Field channels
│   │   ├── channel/            # Telegram channels management
│   │   ├── payment/            # Payment processing
│   │   ├── broadcast/          # Message broadcasting
│   │   ├── settings/           # Bot settings
│   │   └── language/           # Internationalization
│   ├── common/
│   │   ├── grammy/             # Grammy bot setup
│   │   └── config/             # Configuration files
│   ├── prisma/                 # Prisma client
│   └── main.ts                 # Application entry point
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                  # Application Docker image
└── deploy.sh                   # Deployment script
```

## 🔧 Environment Variables

Create `.env` file with these variables:

```env
# Bot Configuration
BOT_TOKEN=your_bot_token_from_botfather
BOT_USERNAME=your_bot_username

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# For Docker Compose
DB_USER=azizbot
DB_PASSWORD=strong_password
DB_NAME=aziz_bot_db
DB_HOST=postgres
DB_PORT=5432
```

See `.env.example` for all available options.

## 📝 Available Scripts

### Development
```bash
pnpm start:dev          # Start with hot reload
pnpm build              # Build for production
pnpm start:prod         # Start production build
```

### Database
```bash
pnpm prisma studio      # Open database GUI
pnpm prisma migrate dev # Create new migration
pnpm prisma generate    # Generate Prisma client
```

### Docker
```bash
pnpm docker:up          # Start Docker services
pnpm docker:down        # Stop Docker services
pnpm docker:logs        # View logs
pnpm docker:build       # Rebuild containers
```

### Testing
```bash
pnpm test               # Run tests
pnpm test:watch        # Run tests in watch mode
pnpm test:cov          # Run with coverage
```

## 🎯 Usage

### Admin Commands
- `/start` - Open admin panel
- Access admin menu to:
  - Upload movies/series
  - Manage field channels
  - Handle payments
  - View statistics
  - Broadcast messages

### User Commands
- `/start` - Start bot and view main menu
- `/start <code>` - Direct link to movie (e.g., `/start 123`)
- `/start s<code>` - Direct link to series (e.g., `/start s456`)
- Search by code
- Browse field channels
- Purchase premium subscription

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) 11.x
- **Bot Library**: [Grammy](https://grammy.dev/) 1.38
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Runtime**: Node.js 20
- **Containerization**: Docker & Docker Compose
- **Payment**: Payme, Click integrations

## 📊 Database Schema

Main entities:
- **User** - Bot users with premium status
- **Admin** - Admin users with roles
- **Movie** - Movie information and files
- **Serial** - TV series metadata
- **Episode** - Series episodes
- **Field** - Content organization channels
- **Payment** - Payment transactions
- **DatabaseChannel** - Video storage channels
- **MandatoryChannel** - Required subscription channels

## 🔒 Security

- Environment variables for sensitive data
- Admin authentication and role-based access
- Database connection encryption
- Secure payment processing
- Non-root Docker user

## 📈 Performance

- Memory optimization (`--max-old-space-size=512`)
- Database query optimization
- Caching strategies
- Efficient video storage in channels
- Health checks and monitoring

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under UNLICENSED.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- See [QUICKSTART.md](./QUICKSTART.md) for setup assistance

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Amazing Node.js framework
- [Grammy](https://grammy.dev/) - Telegram Bot framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
