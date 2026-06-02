---
name: scaffold
description: 项目脚手架：一键初始化全栈 monorepo，含构建、lint、dev server
runAs: subagent
---
# Project Init Skill

You are responsible for scaffolding a complete, production-ready web fullstack project from scratch. When invoked with a project description, produce a fully initialized monorepo with working build, lint, and dev server.

## Scaffold Steps

### 1. Initialize Monorepo
- pnpm workspace with `pnpm-workspace.yaml`
- Root `package.json` with scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `format`, `clean`
- `.npmrc` with `strict-peer-dependencies=false` and `auto-install-peers=true`

### 2. Shared Package (`packages/shared/`)
- `package.json`: name `@project/shared`, type module
- `tsconfig.json`: strict, ES2022 target, path aliases
- `src/index.ts`: barrel export
- `src/types.ts`: shared TypeScript interfaces (User, ApiResponse, Pagination)
- `src/constants.ts`: shared constants (error codes, routes, config keys)
- `src/validation.ts`: zod schemas shared between client and server

### 3. Config Package (`packages/config/`)
- `eslint.config.js`: flat config with typescript-eslint, react-hooks, import sorting
- `tsconfig.base.json`: shared TS config (strict, paths, module resolution)
- `tsconfig.react.json`: extends base, adds jsx, react-specific settings
- `tailwind.config.ts`: shared Tailwind preset with design tokens
- `postcss.config.js`: tailwind + autoprefixer

### 4. UI Package (`packages/ui/`)
- `package.json`: name `@project/ui`, exports `./*`
- `src/index.ts`: barrel export of all components
- Component pattern (every component):
  ```tsx
  import { forwardRef } from 'react';
  import { Slot } from '@radix-ui/react-slot';
  import { cva, type VariantProps } from 'class-variance-authority';
  import { cn } from '../lib/utils';
  
  const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    { variants: {...}, defaultVariants: {...} }
  );
  
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; }
  
  export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  });
  Button.displayName = 'Button';
  ```
- Base components: Button, Input, Label, Card, Dialog, Dropdown, Toast, Skeleton, Badge, Avatar, Separator, Tabs, Select, Textarea, Checkbox, RadioGroup, Switch, Tooltip

### 5. Web App (`apps/web/`)
- Vite + React + TypeScript
- `vite.config.ts`: path aliases, proxy to API dev server
- `src/main.tsx`: React.StrictMode, global styles import
- `src/App.tsx`: router setup with lazy-loaded pages
- `src/pages/`: one file per route
- `src/features/`: business logic components
- `src/layouts/`: AppLayout with sidebar + header
- `src/hooks/`: useAuth, useDebounce, useMediaQuery, useLocalStorage
- `src/lib/`: api client (fetch wrapper), cn utility, formatters
- `src/styles/globals.css`: Tailwind directives + CSS custom properties for theme

### 6. API App (`apps/api/`)
- Express/Fastify + TypeScript
- `src/index.ts`: server bootstrap with middleware chain
- `src/middleware/`: auth, cors, rate-limit, error handler, request logger, validation
- `src/routes/`: one file per resource, registers on router
- `src/services/`: business logic layer
- `src/repositories/`: database access layer (Prisma/Drizzle)
- `src/lib/`: prisma client, jwt utils, password hashing, email sender stub
- `src/env.ts`: typed environment variables via zod validation
- `src/types.ts`: request augmentation (req.user), response helpers

### 7. Database
- `prisma/schema.prisma` or `drizzle.config.ts`
- Docker Compose for local PostgreSQL + Redis
- Seed script for development data
- Migration scripts empty (first migration after schema design)

### 8. Root Config Files
- `.gitignore`: comprehensive (node_modules, dist, .env, .turbo, coverage)
- `.env.example`: template with all required variables documented
- `.editorconfig`: consistent indentation, charset, line endings
- `turbo.json`: pipeline config for build, dev, lint, test, typecheck
- `.github/workflows/ci.yml`: lint, typecheck, test on PR

## Quality Gates (run after scaffold)
- `pnpm install` succeeds
- `pnpm typecheck` passes
- `pnpm lint` passes
- `pnpm build` succeeds (empty apps should build)
- `pnpm dev` starts both web and API

## Principles
- Every file must be typechecked from day one — no `// @ts-nocheck`
- No placeholder TODOs that aren't actionable — either implement or omit
- All config files must be valid and parseable
- Package boundaries must be clean — no circular dependencies
- Use ESM throughout — `"type": "module"` everywhere
