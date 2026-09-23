#!/usr/bin/env bash

# run-all.sh: Master automated runner for Assignment 4 Load Tests
# Usage: ./run-all.sh [--arch <single|scale>] [--duration <sec>] [--quick] [--url <url>]

set -e

ARCH="${ARCH:-scale}"
DURATION="${DURATION:-0}" # Default: run at benchmark throughput; set to 300 for full 5-minute paced test
BASE_URL="${BASE_URL:-https://localhost}"
QUICK_MODE=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --arch) ARCH="$2"; shift ;;
    --duration) DURATION="$2"; shift ;;
    --url) BASE_URL="$2"; shift ;;
    --quick) QUICK_MODE=true ;;
    -h|--help)
      echo "Usage: ./run-all.sh [options]"
      echo "  --arch <single|scale>  Architecture tag for results (default: scale)"
      echo "  --duration <sec>       Duration in seconds to spread requests (e.g. 300 for 5 min; default: 0)"
      echo "  --url <url>            Target URL (default: https://localhost)"
      echo "  --quick                Quick verification run with smaller request counts (1, 10, 50)"
      exit 0
      ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$DIR/results/$ARCH"
mkdir -p "$RESULTS_DIR"

if [ "$QUICK_MODE" = true ]; then
  REQUEST_TIERS=(1 10 50)
  echo "[run-all] QUICK MODE ACTIVE: Tiers = (1, 10, 50)"
else
  REQUEST_TIERS=(1 10 100 1000 5000)
  echo "[run-all] FULL ASSIGNMENT MODE: Tiers = (1, 10, 100, 1000, 5000)"
fi

ENDPOINTS=("static" "aggregation" "search" "dynamic_read")

echo "========================================================================"
echo " Starting Assignment 4 Automated Load Tests"
echo " Architecture: $ARCH"
echo " Base URL:     $BASE_URL"
echo " Duration:     ${DURATION}s"
echo " Results Dir:  $RESULTS_DIR"
echo "========================================================================"

for EP in "${ENDPOINTS[@]}"; do
  for REQS in "${REQUEST_TIERS[@]}"; do
    TEST_TAG="${EP}_${REQS}req"
    TEST_OUT_DIR="$RESULTS_DIR/$TEST_TAG"
    mkdir -p "$TEST_OUT_DIR"

    CSV_FILE="$TEST_OUT_DIR/container_stats.csv"
    JSON_FILE="$TEST_OUT_DIR/benchmark.json"

    echo ""
    echo ">>> Running test: Endpoint = $EP, Requests = $REQS, Arch = $ARCH"
    
    # 1. Start docker stats collector in background
    "$DIR/stats-collector.sh" "$CSV_FILE" 1 &
    COLLECTOR_PID=$!

    # Give collector a second to initialize
    sleep 1

    # Concurrency scaled according to tier
    CONCURRENCY=1
    if [ "$REQS" -ge 5000 ]; then
      CONCURRENCY=50
    elif [ "$REQS" -ge 1000 ]; then
      CONCURRENCY=25
    elif [ "$REQS" -ge 100 ]; then
      CONCURRENCY=10
    elif [ "$REQS" -ge 10 ]; then
      CONCURRENCY=5
    fi

    # 2. Run benchmark
    node "$DIR/load-tester.js" \
      --url "$BASE_URL" \
      --endpoint "$EP" \
      --requests "$REQS" \
      --concurrency "$CONCURRENCY" \
      --duration "$DURATION" \
      --output "$JSON_FILE" || true

    # 3. Stop stats collector
    kill -TERM "$COLLECTOR_PID" 2>/dev/null || true
    wait "$COLLECTOR_PID" 2>/dev/null || true

    sleep 1
  done
done

echo ""
echo "========================================================================"
echo " Generating Consolidated Summary Report..."
echo "========================================================================"

node -e "
const fs = require('fs');
const path = require('path');
const resultsDir = '$RESULTS_DIR';

if (!fs.existsSync(resultsDir)) process.exit(0);

const dirs = fs.readdirSync(resultsDir).filter(d => fs.statSync(path.join(resultsDir, d)).isDirectory());
const summary = [];

dirs.forEach(d => {
  const jsonPath = path.join(resultsDir, d, 'benchmark.json');
  const csvPath = path.join(resultsDir, d, 'container_stats.csv');
  if (!fs.existsSync(jsonPath)) return;

  const bench = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Calculate average CPU across samples
  let avgTotalCpu = 0;
  if (fs.existsSync(csvPath)) {
    const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
    let cpuSum = 0;
    let count = 0;
    lines.forEach(l => {
      const parts = l.split(',');
      if (parts[2]) {
        cpuSum += parseFloat(parts[2].replace('%', '')) || 0;
        count++;
      }
    });
    if (count > 0) avgTotalCpu = cpuSum / count;
  }

  summary.push({
    test: d,
    endpoint: bench.endpointName,
    tier: bench.targetTier,
    requests: bench.totalRequests,
    throughput: bench.throughputRps.toFixed(2),
    meanMs: bench.latencies.meanMs.toFixed(2),
    p95Ms: bench.latencies.p95Ms.toFixed(2),
    p99Ms: bench.latencies.p99Ms.toFixed(2),
    errors: bench.errorCount,
    avgCpu: avgTotalCpu.toFixed(1)
  });
});

summary.sort((a,b) => a.endpoint.localeCompare(b.endpoint) || a.requests - b.requests);

let md = '# Assignment 4 Load Test Summary (' + '$ARCH' + ')\n\n';
md += '| Endpoint | Tier | Requests | Throughput (req/s) | Mean Latency (ms) | p95 (ms) | p99 (ms) | Errors | Avg CPU (%) |\n';
md += '|---|---|---|---|---|---|---|---|---|\n';

summary.forEach(s => {
  md += \`| \${s.endpoint} | \${s.tier} | \${s.requests} | \${s.throughput} | \${s.meanMs} | \${s.p95Ms} | \${s.p99Ms} | \${s.errors} | \${s.avgCpu} |\n\`;
});

const outMd = path.join(resultsDir, 'SUMMARY.md');
fs.writeFileSync(outMd, md);
console.log(md);
console.log('Saved Markdown summary to:', outMd);
"

echo "All tests finished successfully!"

