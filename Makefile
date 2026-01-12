.PHONY: help install dev build start stop restart logs clean deploy

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pnpm install

dev: ## Start development server
	pnpm start:dev

build: ## Build for production
	pnpm build

# Docker commands
docker-up: ## Start Docker services
	docker compose up -d

docker-down: ## Stop Docker services
	docker compose down

docker-restart: ## Restart Docker services
	docker compose restart

docker-logs: ## View Docker logs
	docker compose logs -f

docker-build: ## Rebuild Docker images
	docker compose build --no-cache

docker-clean: ## Remove all containers and volumes
	docker compose down -v
	docker system prune -f

# Database commands
db-studio: ## Open Prisma Studio
	pnpm prisma studio

db-migrate: ## Create new migration
	pnpm prisma migrate dev

db-push: ## Push schema changes
	pnpm prisma db push

db-generate: ## Generate Prisma client
	pnpm prisma generate

db-seed: ## Seed database (if you have seed script)
	pnpm prisma db seed

# Deployment
deploy: ## Deploy to production (run on server)
	./deploy.sh

setup-ssl: ## Setup SSL certificate (run on server as root)
	sudo ./setup-ssl.sh

# Monitoring
monitor-up: ## Start monitoring stack
	docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

monitor-down: ## Stop monitoring stack
	docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down

# Backup
backup-db: ## Backup database
	@echo "Creating database backup..."
	@mkdir -p backups
	docker compose exec -T postgres pg_dump -U azizbot aziz_bot_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/"

restore-db: ## Restore database from backup (usage: make restore-db FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Please specify FILE=backup.sql"; exit 1; fi
	docker compose exec -T postgres psql -U azizbot aziz_bot_db < $(FILE)

# Testing
test: ## Run tests
	pnpm test

test-watch: ## Run tests in watch mode
	pnpm test:watch

test-cov: ## Run tests with coverage
	pnpm test:cov

# Utilities
logs-app: ## View application logs
	docker compose logs -f app

logs-db: ## View database logs
	docker compose logs -f postgres

shell-app: ## Open shell in app container
	docker compose exec app sh

shell-db: ## Open PostgreSQL shell
	docker compose exec postgres psql -U azizbot -d aziz_bot_db

stats: ## Show Docker stats
	docker stats

clean: ## Clean node_modules and dist
	rm -rf node_modules dist

fresh: clean install ## Fresh install
	@echo "Fresh install complete!"
