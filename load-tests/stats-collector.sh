#!/usr/bin/env bash

# stats-collector.sh: Samples container CPU %, Memory, and Threads (PIDs) every N seconds
# Usage: ./stats-collector.sh <output_csv_file> [sample_interval_seconds]

OUTPUT_FILE="${1:-container_stats.csv}"
INTERVAL="${2:-1}"

mkdir -p "$(dirname "$OUTPUT_FILE")"

# Write CSV header if file doesn't exist
if [ ! -f "$OUTPUT_FILE" ]; then
  echo "timestamp,container,cpu_percent,mem_usage,pids_threads" > "$OUTPUT_FILE"
fi

echo "[stats-collector] Sampling container resource usage every ${INTERVAL}s to ${OUTPUT_FILE}..."

cleanup() {
  echo ""
  echo "[stats-collector] Stopping collection. Calculating resource summary..."
  
  # Generate summary report using Node/Python
  node -e "
    const fs = require('fs');
    if (!fs.existsSync('$OUTPUT_FILE')) process.exit(0);
    const lines = fs.readFileSync('$OUTPUT_FILE', 'utf8').trim().split('\n').slice(1);
    const byContainer = {};

    lines.forEach(l => {
      const parts = l.split(',');
      if (parts.length < 5) return;
      const [ts, name, cpuStr, memStr, pidsStr] = parts;
      const cpu = parseFloat(cpuStr.replace('%', '')) || 0;
      const pids = parseInt(pidsStr, 10) || 0;
      
      if (!byContainer[name]) {
        byContainer[name] = { cpus: [], pids: [], mems: [] };
      }
      byContainer[name].cpus.push(cpu);
      byContainer[name].pids.push(pids);
      byContainer[name].mems.push(memStr);
    });

    console.log('\n========================================================================');
    console.log(' CONTAINER RESOURCE USAGE SUMMARY');
    console.log('========================================================================');
    console.log(' Container              | Avg CPU (%) | Peak CPU (%) | Avg Threads | Peak Threads');
    console.log('------------------------|-------------|--------------|-------------|-------------');
    for (const [name, stats] of Object.entries(byContainer)) {
      if (stats.cpus.length === 0) continue;
      const avgCpu = stats.cpus.reduce((a,b)=>a+b,0)/stats.cpus.length;
      const maxCpu = Math.max(...stats.cpus);
      const avgPids = stats.pids.reduce((a,b)=>a+b,0)/stats.pids.length;
      const maxPids = Math.max(...stats.pids);
      const paddedName = name.padEnd(23, ' ').slice(0, 23);
      console.log(\` \${paddedName} | \${avgCpu.toFixed(2).padStart(11, ' ')} | \${maxCpu.toFixed(2).padStart(12, ' ')} | \${avgPids.toFixed(1).padStart(11, ' ')} | \${maxPids.toString().padStart(12, ' ')}\`);
    }
    console.log('========================================================================\n');
  "
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

while true; do
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  # Capture all running containers
  docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.PIDs}}" 2>/dev/null | while read -r line; do
    if [ -n "$line" ]; then
      echo "${TIMESTAMP},${line}" >> "$OUTPUT_FILE"
    fi
  done
  sleep "$INTERVAL"
done

