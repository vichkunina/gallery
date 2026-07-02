#!/usr/bin/env bash
set -euo pipefail

PROFILE="${YC_PROFILE:-vichkunina}"
CERT_NAME="${YC_CERT_NAME:-gallery-vichkunina-art}"
CDN_ID="${YC_CDN_ID:-bc8rzhym3xo5zktvheag}"

echo "→ Waiting for certificate ${CERT_NAME}..."
for _ in $(seq 1 60); do
  status="$(yc --profile "${PROFILE}" certificate-manager certificate get "${CERT_NAME}" --format json | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))")"
  echo "   status: ${status}"
  if [[ "${status}" == "ISSUED" ]]; then
    break
  fi
  if [[ "${status}" == "INVALID" || "${status}" == "REVOKED" ]]; then
    echo "Certificate failed: ${status}"
    exit 1
  fi
  sleep 10
done

if [[ "${status}" != "ISSUED" ]]; then
  echo "Timeout waiting for certificate. Add DNS records at REG.RU first."
  exit 1
fi

cert_id="$(yc --profile "${PROFILE}" certificate-manager certificate get "${CERT_NAME}" --format json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")"

echo "→ Enabling HTTPS on CDN ${CDN_ID}..."
yc --profile "${PROFILE}" cdn resource update "${CDN_ID}" \
  --cert-manager-ssl-cert-id "${cert_id}" \
  --redirect-http-to-https

echo "Done. Open https://vichkunina.art"
