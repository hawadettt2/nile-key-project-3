#!/usr/bin/env bash
set -euo pipefail

# متغيرات من ENV: REPO_URL, GH_PAT, RUNNER_LABEL
if [ -z "${REPO_URL:-}" ]; then
  echo "REPO_URL غير مضبوط. ضع رابط المستودع في متغير البيئة."
  exit 1
fi

if [ -z "${GH_PAT:-}" ]; then
  echo "GH_PAT غير مضبوط. ضع GitHub Personal Access Token في متغير البيئة."
  exit 1
fi

echo "طلب registration token من GitHub..."
OWNER_REPO=$(echo "$REPO_URL" | sed -E 's#https?://github.com/##; s#/$##')
API_URL="https://api.github.com/repos/${OWNER_REPO}/actions/runners/registration-token"

TOKEN_JSON=$(curl -s -X POST -H "Authorization: token ${GH_PAT}" -H "Accept: application/vnd.github+json" "${API_URL}")
REG_TOKEN=$(echo "$TOKEN_JSON" | jq -r .token)

if [ -z "$REG_TOKEN" ] || [ "$REG_TOKEN" = "null" ]; then
  echo "فشل الحصول على registration token:"
  echo "$TOKEN_JSON"
  exit 2
fi

echo "تم الحصول على token. تهيئة الـ runner..."
cd /actions-runner

./config.sh --url "${REPO_URL}" --token "${REG_TOKEN}" --labels "${RUNNER_LABEL}" --unattended

trap 'echo "Removing runner..."; ./config.sh remove --token "${REG_TOKEN}" || true; exit' SIGINT SIGTERM

echo "تشغيل runner..."
./run.sh
