# Loom script (about 3 minutes)

Cue cards, not lines to read. **Do** is what happens on screen; **Say** is the idea to get across,
in your own words. Talk while things load.

## Setup (before recording)

```bash
cd mobile
EXPO_PUBLIC_API_URL=https://nouri-api-sve8.onrender.com npx expo export -p web
npx serve dist
```

- Open https://nouri-api-sve8.onrender.com/health once to wake the server.
- Chrome → DevTools → device toolbar → iPhone 14 Pro. Clear site data so onboarding starts fresh.
- Ready: a food photo (plate from above) and `e2e/samples/lab-report.pdf`. Allow the microphone.
- One practice run at most: the photo, voice and report steps use the Gemini free quota.

---

## 1 · The idea (0:00 – 0:20)

**Say**

- Katori: a personal health assistant for busy people in India.
- The problem: calorie apps are tedious and the numbers mean nothing, so people quit.
- The idea: snap or speak once; Katori does the work and tells you why.

## 2 · Onboarding (0:20 – 0:55)

**Do**

- Welcome screen → Let's begin.
- Continue with an empty name (friendly error), then fill in the five questions; flip height to
  ft/in. Goal: Lose weight. Skip the report.
- Your plan: point at the two numbers and "How Katori worked this out".

**Say**

- Five short questions, answers kept if you go back or close the app.
- Targets are plain maths, not AI, and the app shows its working.
- Every focus area has a why.

## 3 · Log a meal (0:55 – 1:45)

**Do**

- Turmeric + in the middle of the tab bar → Snap → choose the food photo.
- Remove one item, make another portion bigger, point at the highlighted item → Save.
- Rings move on Today. + → Speak → "two rotis, dal and a bowl of curd" → Done → save.
- DevTools Network → Offline. + → Type it in → "Masala chai, 90 kcal" → save → "Waiting to sync".
  Back online → it syncs.

**Say**

- Logging is always one tap away, in the middle of the tab bar.
- AI drafts the meal; totals are calculated in code; unsure items are flagged.
- Voice: it writes down what it heard first, then estimates only from those words.
- Logging works offline and syncs later; a double tap can't save twice.

## 4 · Today, the assistant (1:45 – 2:20)

**Do**

- Point at the assistant card and its Why.
- Rings, streak, meal list, weekly wins.
- Type in "Paneer tikka", 600 kcal, 60 g protein → confetti, the card turns to praise.

**Say**

- The assistant speaks first; its message changes through the day.
- Rules decide what to say, AI only phrases it, rules text as a fallback.
- Wins are celebrated once a day; reminders on the phone come at your usual meal times.

## 5 · Health report (2:20 – 2:50)

**Do**

- Health → PDF or photo → `lab-report.pdf`.
- Green, amber, red list → open LDL.
- Back to Today: focus areas now mention sugar and cholesterol.

**Say**

- AI only extracts what is printed.
- Units, status and advice are reviewed code: health advice is never improvised.
- Your lab results change what the app focuses on.

## 6 · Close (2:50 – 3:00)

**Do**

- Turn off the device toolbar (wide window) → + → Type it in: a centred dialog.

**Say**

- Bottom sheet on phones, dialog on wide screens, one codebase.
- The AI sits behind an interface, so it is swappable; a mock runs the tests.
- APK and code are linked in the README. Thanks.

---

If an AI step shows "Katori is busy", tap Try again and mention it: that is the error handling
working.
