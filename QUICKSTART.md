# Quick Start Guide - BirthHub 360

This guide walks you through setting up and running BirthHub 360 locally in minutes.

## Prerequisites

Ensure you have:
- **Docker** & **Docker Compose** (v2.20+)
- **Node.js** 20.9+ 
- **Git**
- **pnpm** 9.15.9+

## 📦 One-Command Setup

```bash
# Run all checks and setup in one command
pnpm setup:dev setup
```

This will:
1. ✅ Verify Docker, Git, and Node.js are installed
2. ✅ Install pnpm globally
3. ✅ Install project dependencies
4. ✅ Generate Prisma client
5. ✅ Create `.env.local` from `.env.example`

## 🚀 Start Development

```bash
# Start all services (Docker + dev servers)
pnpm setup:dev start
```

This will:
1. Start PostgreSQL, Redis, Jaeger, Prometheus
2. Wait for services to be ready
3. Run database migrations
4. Start API, Web, and Worker servers in parallel

Access:
- **Web**: http://localhost:3001
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **Jaeger UI**: http://localhost:16686
- **Prometheus**: http://localhost:9090
- **Database UI**: http://localhost:8080

## 📋 Available Commands

```bash
# Setup
pnpm setup:dev check       # Verify prerequisites
pnpm setup:dev setup       # Initial setup
pnpm setup:dev start       # Start development environment

# Testing
pnpm test                  # Run unit tests
pnpm test:isolation        # Run integration tests (requires DB)

# Code Quality
pnpm lint                  # Check code style
pnpm typecheck             # Check TypeScript types
pnpm format                # Format code with Prettier

# Build
pnpm build                 # Build all apps
pnpm setup:dev build       # Build Docker images

# Database
pnpm db:generate           # Generate Prisma client
pnpm db:migrate:deploy     # Run pending migrations
pnpm db:seed               # Seed development data

# Cleanup
pnpm setup:dev cleanup     # Stop containers and clean artifacts
pnpm clean                 # Clear build cache
```

## 🔧 Configuration

All configuration is in `.env.local` (created from `.env.example`).

**Key dev settings:**
```env
DATABASE_URL=postgresql://birthub:dev-password@postgres:5432/birthub
REDIS_URL=redis://redis:6379/0
LOG_LEVEL=debug
NEXT_PUBLIC_API_URL=http://localhost:3000
```

⚠️ **Important**: `.env.local` is in `.gitignore` — never commit secrets!

## 🐳 Docker Compose Services

Running containers:
```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Reset databases
docker-compose -f docker-compose.dev.yml down -v
```

## 📝 Development Workflow

1. **Create a branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** - files auto-reload via Docker volumes

3. **Test locally:**
   ```bash
   pnpm test
   pnpm lint
   pnpm typecheck
   ```

4. **Commit with proper format:**
   ```bash
   git commit -m "feat: add new feature" -m "Assisted-By: docker-agent"
   ```

5. **Push and open PR** — CI/CD runs automatically

## 🐛 Debugging

### View logs
```bash
# API logs
docker-compose -f docker-compose.dev.yml logs -f api

# Worker logs
docker-compose -f docker-compose.dev.yml logs -f worker

# Database logs
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### Debug Node.js
API and Worker expose debug ports:
- API: `localhost:9229`
- Worker: `localhost:9230`

In VSCode, add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach API",
  "port": 9229,
  "skipFiles": ["<node_internals>/**"]
}
```

### Database queries
Access database UI at http://localhost:8080
- Server: `postgres`
- Username: `birthub`
- Password: `dev-password`
- Database: `birthub`

## ✅ Pre-PR Checklist

Before opening a pull request:
```bash
pnpm typecheck    # No type errors
pnpm lint         # Code style passes
pnpm test         # All tests pass
pnpm build        # Builds successfully
```

## 🆘 Troubleshooting

**"Docker not found"**
- Install Docker Desktop or Docker Engine + Docker CLI

**"Port 3000 already in use"**
```bash
# Stop existing services
docker-compose -f docker-compose.dev.yml down

# Or use different ports in .env.local
API_PORT=3002
WEB_PORT=3003
```

**"Database connection refused"**
- Wait 10 seconds for PostgreSQL to start
- Check: `docker ps | grep postgres`
- Restart: `docker-compose -f docker-compose.dev.yml restart postgres`

**"Node version mismatch"**
- Ensure Node 20.9+ installed: `node -v`
- Update: https://nodejs.org

**"pnpm not found"**
```bash
npm install -g pnpm@9.15.9
```

## 📚 Further Reading

- [Architecture Guide](./ARCHITECTURE.md) — System design patterns
- [Contributing Guide](./CONTRIBUTING.md) — Development conventions
- [Improvements Doc](./IMPROVEMENTS.md) — Recent enhancements
- [API Documentation](http://localhost:3000/docs) — Interactive API docs

## 🎯 Next Steps

1. Run `pnpm setup:dev setup` to get started
2. Run `pnpm setup:dev start` to launch dev environment
3. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
4. Open a PR! (CI/CD validates everything)

---

**Questions?** Check the troubleshooting section or see [Contributing Guide](./CONTRIBUTING.md).
