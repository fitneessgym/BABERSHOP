#!/bin/bash
cd "$(dirname "$0")"
[ -d node_modules ] || npm install --no-audit --no-fund
npx prisma db push --skip-generate >/dev/null 2>&1
npm run dev
