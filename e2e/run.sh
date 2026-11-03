#!/bin/sh
# Runs the browser smoke tests against a running app and API.
#   APP_URL  web app (default http://localhost:8081, from `npx expo start --web`)
#   API_URL  Nouri API (default http://localhost:3000)
# Screenshots and throwaway Chrome profiles go to e2e/.work (git ignored).
set -e
cd "$(dirname "$0")"
for suite in ${@:-onboarding meals today health small}; do
  echo "== $suite"
  node "$suite.mjs"
done
