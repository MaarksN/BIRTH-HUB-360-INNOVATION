#!/bin/bash

set -euo pipefail

# BirthHub 360 - Development Setup & Deployment Script

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
  echo -e "${GREEN}✓ ${1}${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠ ${1}${NC}"
}

log_error() {
  echo -e "${RED}✗ ${1}${NC}"
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  if ! command -v node &>/dev/null; then
    log_error "Node.js is required but not installed. Installing via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    nvm install 24
    nvm use 24
  fi

  if ! command -v pnpm &>/dev/null; then
    log_info "Installing pnpm..."
    npm install -g pnpm@9.15.9
  fi

  if ! command -v docker &>/dev/null; then
    log_error "Docker is required but not installed. Please install Docker Desktop."
    exit 1
  fi

  if ! command -v git &>/dev/null; then
    log_error "Git is required but not installed."
    exit 1
  fi

  log_success "All prerequisites installed"
}

# Setup development environment
setup_dev() {
  log_info "Setting up development environment..."

  # Install dependencies
  log_info "Installing dependencies..."
  pnpm install

  # Setup git hooks
  log_info "Setting up git hooks..."
  pnpm husky install

  # Create .env file if not exists
  if [ ! -f .env ]; then
    log_info "Creating .env file..."
    cp .env.example .env
    log_warn "Please update .env with your configuration"
  fi

  # Start Docker containers
  log_info "Starting Docker containers..."
  docker-compose -f docker-compose.dev.yml up -d

  # Wait for databases
  log_info "Waiting for databases to be ready..."
  sleep 10

  # Generate Prisma client
  log_info "Generating Prisma client..."
  pnpm db:generate

  # Run migrations
  log_info "Running database migrations..."
  pnpm db:migrate:deploy

  # Seed database (optional)
  read -p "Run database seed? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Seeding database..."
    pnpm db:seed
  fi

  log_success "Development environment setup complete!"
  log_info "Start development servers with: pnpm dev"
}

# Start development servers
start_dev() {
  log_info "Starting development servers..."
  
  docker-compose -f docker-compose.dev.yml up -d
  sleep 5
  
  pnpm dev
}

# Build production images
build_prod() {
  log_info "Building production Docker images..."

  docker buildx create --use --name birthub-builder || true

  log_info "Building API image..."
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t birthub-api:latest \
    -f apps/api/Dockerfile \
    --push \
    .

  log_info "Building Worker image..."
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t birthub-worker:latest \
    -f apps/worker/Dockerfile \
    --push \
    .

  log_info "Building Web image..."
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t birthub-web:latest \
    -f apps/web/Dockerfile \
    --push \
    .

  log_success "Production images built"
}

# Deploy to Kubernetes
deploy_k8s() {
  local environment=${1:-production}
  
  log_info "Deploying to Kubernetes ($environment)..."

  if ! command -v kubectl &>/dev/null; then
    log_error "kubectl is required but not installed."
    exit 1
  fi

  # Check cluster connection
  if ! kubectl cluster-info &>/dev/null; then
    log_error "Cannot connect to Kubernetes cluster. Check your kubeconfig."
    exit 1
  fi

  # Apply manifests
  log_info "Applying Kubernetes manifests..."
  kubectl apply -f k8s/deployment.yaml

  # Wait for rollout
  log_info "Waiting for rollout to complete..."
  kubectl rollout status deployment/birthub-api -n birthub --timeout=5m
  kubectl rollout status deployment/birthub-worker -n birthub --timeout=5m

  log_success "Deployment complete!"
  
  # Get service info
  log_info "Service information:"
  kubectl get svc -n birthub
}

# Run tests
run_tests() {
  log_info "Running tests..."

  log_info "Linting..."
  pnpm lint

  log_info "Type checking..."
  pnpm typecheck

  log_info "Running unit tests..."
  pnpm test

  log_info "Running integration tests..."
  pnpm test:isolation

  log_success "All tests passed!"
}

# Cleanup
cleanup() {
  log_warn "Cleaning up development environment..."

  docker-compose -f docker-compose.dev.yml down -v

  pnpm clean

  log_success "Cleanup complete"
}

# Show help
show_help() {
  cat <<EOF
BirthHub 360 - Development & Deployment Script

Usage: $0 <command>

Commands:
  check              Check prerequisites
  setup              Setup development environment (includes Docker)
  start              Start development servers
  test               Run all tests
  build              Build production Docker images
  deploy <env>       Deploy to Kubernetes (default: production)
  cleanup            Stop Docker and clean artifacts

Examples:
  $0 setup              # Initial setup
  $0 start              # Start dev servers
  $0 test               # Run tests
  $0 build              # Build images
  $0 deploy staging     # Deploy to staging
  $0 cleanup            # Clean everything

EOF
}

# Main
main() {
  local command=${1:-help}

  case $command in
    check)
      check_prerequisites
      ;;
    setup)
      check_prerequisites
      setup_dev
      ;;
    start)
      start_dev
      ;;
    test)
      run_tests
      ;;
    build)
      build_prod
      ;;
    deploy)
      deploy_k8s "${2:-production}"
      ;;
    cleanup)
      cleanup
      ;;
    help | -h | --help)
      show_help
      ;;
    *)
      log_error "Unknown command: $command"
      show_help
      exit 1
      ;;
  esac
}

main "$@"
