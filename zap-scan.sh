#!/bin/bash

API="$ZAP_HOST:$ZAP_PORT"
TARGET="$BASE_URL"

echo "Starting OWASP ZAP automated scan..."

# Start a new ZAP session
curl -X GET "$API/JSON/core/action/newSession/?name=automated_scan"

# Spider the target (explore all endpoints)
echo "Spidering the target: $TARGET"
curl -X GET "$API/JSON/spider/action/scan/?url=$TARGET&maxChildren=5&recurse=true"

# Wait for the spider to finish
SPIDER_ID=$(curl -s "$API/JSON/spider/view/status/" | jq -r '.status')
while [ "$SPIDER_ID" -lt 100 ]; do
  echo "Spider progress: $SPIDER_ID%"
  sleep 5
  SPIDER_ID=$(curl -s "$API/JSON/spider/view/status/" | jq -r '.status')
done
echo "Spider completed."

# Perform an active scan
echo "Starting active scan..."
SCAN_ID=$(curl -s "$API/JSON/ascan/action/scan/?url=$TARGET" | jq -r '.scan')

# Check scan status
SCAN_STATUS=$(curl -s "$API/JSON/ascan/view/status/?scanId=$SCAN_ID" | jq -r '.status')
while [ "$SCAN_STATUS" -lt 100 ]; do
  echo "Active scan progress: $SCAN_STATUS%"
  sleep 5
  SCAN_STATUS=$(curl -s "$API/JSON/ascan/view/status/?scanId=$SCAN_ID" | jq -r '.status')
done
echo "Active scan completed."

# Generate reports
echo "Generating HTML report..."
curl "$API/OTHER/core/other/htmlreport/" -o zap_report.html
echo "HTML report saved to zap_report.html"

echo "Generating JSON report..."
curl "$API/OTHER/core/other/jsonreport/" -o zap_report.json
echo "JSON report saved to zap_report.json"

echo "Automated scan completed successfully!"
