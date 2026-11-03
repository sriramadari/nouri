# Self evaluation

Checked against the user testing checklist in the build guide.

| #   | Question                                                                  | Answer                           | Evidence                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Does it feel like an AI era assistant, not a 2017 data logging app?       | Yes                              | Snap or speak once; AI drafts the meal; the assistant card speaks first and phrases its advice; lab reports are read for you                                                             |
| 2   | Does onboarding end with a clear goal, a clear what and a clear why?      | Yes                              | Your Plan shows the goal, two targets, how they were calculated, and 2 or 3 focus areas each with a why                                                                                  |
| 3   | Is the assistant acting first, or is the user doing the work?             | Mostly the assistant             | Proactive card per time of day, reminders at learned meal times, automatic focus areas from lab results, offline sync without user action                                                |
| 4   | Are there feel good moments?                                              | Yes                              | Streak flame, confetti and a goal card once per goal day, weekly wins framed positively, kind copy on over days                                                                          |
| 5   | Is every screen simple, with one main action and little text?             | Yes                              | Onboarding: one question per card; Today: Snap or Speak; review: Save; Health: upload                                                                                                    |
| 6   | Would I open it again tomorrow? For 90 days?                              | Tomorrow yes; 90 days needs more | Streaks, reminders and wins pull people back. Longer term needs trends over weeks and goal updates (listed in next steps)                                                                |
| 7   | Does every visible button work? Are loading, empty and error states real? | Yes                              | Covered by the browser e2e suites; every async screen has skeletons, empty and error states                                                                                              |
| 8   | Does it work offline, after a restart, and with permissions denied?       | Yes                              | Offline logging and sync, restart resumes onboarding or opens Today, denied camera or microphone offers Settings, gallery or hand entry                                                  |
| 9   | Is the theme light and calm by default?                                   | Yes                              | Light only (`userInterfaceStyle: light`): warm paper background, ink text, turmeric and curry leaf accents, a serif for headlines. Deliberately not the usual mint green health app look |
| 10  | Does the naming check return nothing?                                     | Yes                              | Run before every commit; see the final check in the step log                                                                                                                             |

## Known gaps

- Real speech through the browser microphone could not be automated (headless Chrome feeds
  silence); the voice path is proven through the API and should be tried on a phone.
- The Android emulator on the development machine was unstable, so camera, microphone and
  notification behaviour should be confirmed on a real device.
- The Gemini free tier allows about 20 requests per model per day.
