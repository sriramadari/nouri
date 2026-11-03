# Browser smoke tests

End-to-end checks that drive the web build like a person would (click, type, pick files),
against the real API and database. They use the Chrome DevTools Protocol directly through
Node's built-in WebSocket, so there is nothing extra to install.

| Suite        | What it proves                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onboarding` | Validation messages, back keeps answers, ft/in toggle, plan numbers, restart opens Today, profile saved on the server                                                          |
| `meals`      | Offline logging shows "Waiting to sync" and syncs on reconnect; a double tap on Save stores one meal. With `MEAL_PHOTO`, also photo analysis, chip removal and portion changes |
| `today`      | Day one welcome, rings, streak flame, assistant message, goal celebration once per day                                                                                         |
| `health`     | Lab report upload, colour coded list, detail sheet, Today focus areas update                                                                                                   |
| `small`      | No horizontal overflow at 320 px on every main screen                                                                                                                          |

## Run

```bash
cd server && npm run start:dev            # API on :3000 (real Gemini, or AI_PROVIDER=mock)
cd mobile && npx expo start --web         # app on :8081
./e2e/run.sh                              # all suites, or e.g. ./e2e/run.sh today health
MEAL_PHOTO=/path/to/meal.jpg ./e2e/run.sh meals
```

`samples/lab-report.pdf` is a synthetic report made for these tests. Google Chrome must be
installed at the default macOS path (see `cdp.mjs`).
