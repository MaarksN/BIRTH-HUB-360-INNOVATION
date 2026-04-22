# Prisma Configuration Migration Plan

## Current Status (Prisma 6.19.3)

The `packages/database` package currently uses **`package.json#prisma`** to configure the seed script:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Deprecation Warning

Prisma 6 emits a deprecation warning when using `package.json#prisma`:
```
warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. 
Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
```

## Why `prisma.config.ts` Not Yet Implemented

Prisma 6.19.3 does **not fully support** `prisma.config.ts` or `prisma.config.js`:
- The CLI parser fails with: "Failed to parse syntax of config file"
- This is a known limitation of Prisma 6.x
- Full support is planned for **Prisma 7** release

## Migration Timeline

| Version | Status | Action |
|---------|--------|--------|
| **Prisma 6.x** | Current | Keep `package.json#prisma` (functional, with warning) |
| **Prisma 7.0+** | Pending | Implement `prisma.config.ts` |

## Future Migration (Target: Prisma 7)

When upgrading to Prisma 7, apply these changes:

### 1. Create `packages/database/prisma.config.ts`:
```typescript
import type { Config } from '@prisma/internals';

const config: Config = {
  seed: 'tsx prisma/seed.ts',
};

export default config;
```

### 2. Remove from `package.json`:
```diff
- "prisma": {
-   "seed": "tsx prisma/seed.ts"
- },
```

### 3. Validate:
```bash
cd packages/database
npx prisma validate --schema prisma/schema.prisma
```

## Effort Estimate
- Prisma 6 → 7 upgrade: 2-3 hours (includes breaking changes review)
- Config migration alone: 15 minutes once Prisma 7 is available

## Related Issues
- Prisma GitHub: prisma/prisma#28149 (prisma.config.ts stabilization)
- Current blocker: Cannot parse `prisma.config.ts` in v6
