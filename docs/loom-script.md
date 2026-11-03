# Loom script (about 3 minutes)

Record on a phone mirror or the web app at phone width. Start on a fresh install.

## 0:00 to 0:20, the problem

> "People in their twenties and thirties in India want to lose weight or fix a lab value, and
> they quit calorie apps because logging is tedious and the numbers mean nothing. Katori is a
> personal assistant: you snap or speak once, it does the rest and tells you why."

## 0:20 to 0:55, flow 1: onboarding with a goal and a why

- Open on the welcome screen: the bowl mark, "Eat well, know why." and three promises.

> "It's called Katori, after the small bowl Indian portions are measured in. Turmeric, ink and a
> serif, because most health apps look like the same mint green spreadsheet."

- Type a name, show the friendly error on an empty field, enter age, sex, height (flip to ft/in),
  activity and the goal "Lose weight". Skip the report.

> "Five short cards, answers survive going back or closing the app."

- On **Your Plan**, point at the ink card with the two numbers and "How Katori worked this out".

> "The targets are deterministic, Mifflin St Jeor times activity minus 500, and the app shows its
> maths. Each focus area comes with a one line why."

## 0:55 to 1:45, flow 2: log a meal by photo or voice

- Tap the turmeric **+** in the middle of the tab bar, then the big **Snap** circle, photograph a plate. Show the skeleton chips, then the review sheet.
- Remove one chip, tap another and press **+** to make it bigger; the total updates.

> "The AI reads the photo; totals are summed in code. Doubtful items are highlighted for a quick
> check."

- Save; show the toast and the rings moving.
- Tap **Speak**, say "two rotis, dal and a bowl of curd", show "Heard: …".

> "Voice listens first, then estimates only from words it heard. Silence is rejected instead of
> turned into a made up meal."

- Turn on airplane mode, **Type it in** "Masala chai, 90 kcal", save: "Waiting to sync". Turn it
  off: it syncs.

## 1:45 to 2:25, flow 3: Today

> "The assistant speaks first. A rules engine on the phone picks the message for the time of day,
> progress, goal and lab results; the server phrases it warmly with a fallback if the AI is down."

- Show the streak flame, the rings, the meal timeline and the weekly wins card.
- Log one more meal that reaches the protein target: confetti and "Goal hit today".

> "Celebrations happen once per goal day, and respect reduced motion. Reminders arrive at the
> times you usually eat, learned from your logs."

## 2:25 to 2:50, flow 4: health report reader

- Health tab, **PDF or photo**, pick a lab report. Show the reading state, then the green, amber
  and red list. Open LDL: range bar, why it matters, one thing to try.
- Go back to Today: the focus areas now mention sugar, cholesterol and vitamin D.

> "The model only extracts what is printed. Units, status and advice are reviewed code, because
> health advice should never be improvised."

## 2:50 to 3:00, one architecture highlight

> "Services depend on an AiProvider interface. Gemini is one implementation with timeouts, schema
> validation and a model fallback chain; a mock powers the tests. Swapping providers is one class
> and one setting."
