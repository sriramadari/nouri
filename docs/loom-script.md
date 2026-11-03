# Loom script (about 3 minutes)

Recorded on the web build in Chrome at phone size, against the hosted API.

## Before recording

1. Build and serve the production web app (no dev buttons):
   ```bash
   cd mobile
   EXPO_PUBLIC_API_URL=https://nouri-api-sve8.onrender.com npx expo export -p web
   npx serve dist
   ```
2. Wake the API: open https://nouri-api-sve8.onrender.com/health once.
3. Chrome: open the app, DevTools → device toolbar → iPhone 14 Pro (or any phone size). Use a
   fresh profile or clear site data so onboarding starts from the beginning.
4. Keep ready: a food photo (a plate from above) and `e2e/samples/lab-report.pdf`.
5. Allow the microphone for the site.

## 0:00 – 0:20 · The idea

> "This is Katori, a personal health assistant for busy people in India who want to lose weight
> or fix a lab value. Calorie apps fail because logging is tedious and the numbers mean nothing.
> Here you snap or speak once, and Katori does the work and tells you why."

## 0:20 – 0:55 · Onboarding with a goal and a why

- Welcome screen → **Let's begin**.
- Tap Continue on an empty name to show the friendly error, then type a name.
- Age and sex, height and weight (flip to ft/in), activity, goal **Lose weight**. Skip the report.
- On **Your plan**, point at the two numbers and "How Katori worked this out".

> "Five short questions. The targets are plain maths, not AI, and the app shows its working.
> Each focus area comes with a reason."

## 0:55 – 1:45 · Log a meal (the hero flow)

- Tap the turmeric **+** in the middle of the tab bar.
- **Snap** → pick the food photo (on the phone this opens the camera).
- On the review sheet: remove one item, tap another and make the portion bigger; the total
  updates. Point at the highlighted, less certain item. **Save**.

> "The AI reads the photo, the totals are summed in code, and doubtful items are flagged for a
> quick check."

- Back on Today the rings have moved. Tap **+** → **Speak** → say "two rotis, dal and a bowl of
  curd" → **Done**. Show "Heard: …" and save.
- Offline: DevTools Network → **Offline**. **+** → **Type it in** → "Masala chai, 90 kcal" →
  save. Show "Waiting to sync". Switch back to **No throttling**: it syncs by itself.

## 1:45 – 2:20 · Today: the assistant comes to you

- Assistant card at the top: point at the message and its **Why**.

> "The assistant speaks first. Rules pick the message from the time of day, progress, goal and
> lab results; AI only phrases it, with the rules text as a fallback."

- Rings (calories outside, protein inside), streak badge, meal list, weekly wins.
- Log one high protein meal by hand (e.g. "Paneer tikka", 600 kcal, 60 g protein) to hit the
  goal: confetti, and the card turns to praise.

> "Wins are celebrated once a day. On the phone, reminders arrive at the times you usually eat,
> and tapping one opens logging."

## 2:20 – 2:50 · Health report reader

- **Health** tab → **PDF or photo** → `lab-report.pdf`. Show the reading state, then the green,
  amber and red list. Open **LDL**: range bar, why it matters, one thing to try.
- Back on **Today**: the focus areas now mention sugar and cholesterol.

> "The model only extracts what is printed. Units, status and advice are reviewed code, because
> health advice should never be improvised."

## 2:50 – 3:00 · One tech highlight and close

- Turn off the device toolbar so the window is wide, tap **+** → **Type it in**: the sheet
  becomes a centred dialog.

> "Bottom sheet on phones, dialog on wide screens, from one codebase. Services depend on an AI
> provider interface, so Gemini is swappable and a mock runs the tests. The Android APK and the
> code are linked in the README. Thanks."
