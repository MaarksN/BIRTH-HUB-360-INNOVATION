# ADR 0001: Initial Architecture

**Data**: 2026-03-01
**Status**: Aprovado
**Contexto**: Escolha da arquitetura base para o SaaS BirthHub360 que exige múltiplos microsserviços e bibliotecas compartilhadas com forte segurança (saúde).
**Decisão**: Utilização de um monorepo (`pnpm workspace`) combinando pacotes de Node.js (Next.js, Prisma, Fastify/Express) e scripts isolados de Python para workloads IA intensivas.
**Consequências**: Facilita o compartilhamento de tipos (Tipos do Prisma DB e contratos de APIs do Gateway). Exige ferramentas rigorosas de linting e versionamento (CI) para gerenciar o acoplamento excessivo.
