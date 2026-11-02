# Nouri

**Eat smart, feel better.**

Nouri is a personal health assistant for busy people who want to lose weight or fix a lab value
(sugar, cholesterol, vitamin D) without tedious calorie logging. You snap, speak or tap once;
Nouri logs the meal, does the maths, explains why it matters and reaches out first.

> This README is a skeleton. Sections are filled in as each part of the app is built.

## The problem and the user

_To be written._

## Core flows

1. **Onboarding with a goal and a why**: five short steps that end on a personal plan.
2. **Log a meal by photo or voice**: one tap, AI does the logging, you confirm.
3. **Today**: progress rings and an assistant card that changes through the day.
4. **Health report reader**: upload a blood report and get plain language actions.

## What was cut and why

- **Login**: one local profile identified by a generated device id. Not core to the problem.
- **Fitness tracker integrations**: large scope, low value for the core goal.
- **Chat as the primary screen**: the assistant speaks through cards, sheets and nudges instead.
- **Separate profile screen**: goals and progress live on Today.

## Architecture

| Folder    | What it is                                         |
| --------- | -------------------------------------------------- |
| `mobile/` | Expo (React Native) app for Android, iOS and web   |
| `server/` | NestJS API with PostgreSQL (Neon) and the AI layer |
| `docs/`   | Architecture diagram and screenshots               |

_Diagram and decisions to be written._

## Getting started

Requirements: Node 22+ and npm.

```bash
# API
cd server
cp .env.example .env   # then fill in the values
npm install
npm run start:dev

# App
cd mobile
cp .env.example .env
npm install
npm start
```

## Known limitations and next steps

_To be written._
