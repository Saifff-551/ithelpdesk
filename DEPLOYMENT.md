# MATIE — Production Deployment Guide

## Overview

MATIE (MetaMinds Adaptive Ticket Intelligence Engine) is an enterprise-grade AI-powered ITSM platform with multi-tenant isolation, 15-claim patent coverage, and production-hardened security.

---

## Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Vercel account (for hosting)
- GitHub repository with CI/CD secrets configured

## Environment Setup

### Local Development

```bash
cp .env.example .env.local     # Copy template
# Fill in Firebase + Gemini API keys
npm install                      # Install dependencies
npm run dev                      # Start dev server (http://localhost:5173)
```

### CI/CD Secrets (GitHub Actions)

| Secret | Source |
|--------|--------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings |
| `VITE_GEMINI_API_KEY` | Google AI Studio |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings |
| `FIREBASE_TOKEN` | `firebase login:ci` |

## Deployment

### Automatic (CI/CD)

- Push to `main` → Production deployment + Firestore rules
- Push to `staging` → Preview deployment
- Pull request → Type check + security audit

### Manual

```bash
npm run build                    # Production build
firebase deploy --only firestore:rules  # Deploy security rules
npx vercel --prod               # Deploy to Vercel
```

## Production Build Optimizations

| Optimization | Detail |
|-------------|--------|
| Source maps | Disabled (`sourcemap: false`) |
| Chunk splitting | React, Firebase, UI vendors separated |
| Lazy routes | 7 non-critical pages loaded on demand |
| Tree shaking | Dead code eliminated via Rollup |
| Env validation | Build-time checks for missing keys |

## Firestore Collections (12)

| Collection | Access | Mutability |
|-----------|--------|-----------|
| `tenants` | Public read | Admin write |
| `users` | Tenant-scoped | Owner/Admin update |
| `tickets` | Creator or staff | Staff update |
| `invitations` | Public read | Invited user + admin |
| `slas` | Tenant read | Admin only |
| `knowledge_base` | Tenant read | Staff create |
| `matie_analyses` | Admin only | **Immutable** |
| `matie_feedback` | Admin only | **Immutable** |
| `matie_config` | Staff read | Admin write |
| `matie_escalation_predictions` | Admin only | **Immutable** |
| `security_audit_log` | Admin only | **Immutable** |
| `ai_metrics` | Admin only | Staff write |

## Post-Deployment Checklist

- [ ] Firebase Auth enabled (Email/Password)
- [ ] Firestore rules deployed (12 collections)
- [ ] Gemini API key active with quota
- [ ] Login/registration flow tested
- [ ] AI routing + metrics functional
- [ ] Admin dashboard loads AI insights
- [ ] Patent/Pitch pages accessible
- [ ] No API keys in source code
- [ ] Browser console clean (no security warnings)
