#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  local pid
  for pid in $(jobs -p); do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

export DOMAIN="http://10.0.2.2:4242"
export PAYMENT_METHOD_TYPES="card"
export STATIC_DIR="../../client/html"

cd custom-payment-flow/server/node
npm ci --no-audit --no-fund
node server.js &
curl --silent --show-error --fail --retry 30 --retry-delay 1 --retry-connrefused \
  http://localhost:4242/config >/dev/null

cd ../../client/react-native-expo
npm ci --no-audit --no-fund
node node_modules/expo/bin/cli start --go --android --localhost --port 8081 --max-workers 2 &

curl --silent --show-error --fail --retry 60 --retry-delay 2 --retry-connrefused \
  http://localhost:8081/status >/dev/null
for attempt in {1..60}; do
  if adb shell pm path host.exp.exponent | grep -q '^package:'; then
    npm run test:android
    exit
  fi
  sleep 2
done

echo 'Expo Go did not install on the Android emulator.'
exit 1
