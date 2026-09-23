#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Disable TLS verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    baseUrl: process.env.TARGET_URL || 'https://localhost',
    endpointKey: 'static',
    customPath: null,
    requests: 100,
    concurrency: 10,
    durationSeconds: 0, // 0 means run as fast as concurrency allows; >0 spreads requests
    output: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        options.baseUrl = args[++i];
        break;
      case '--endpoint':
        options.endpointKey = args[++i];
        break;
      case '--path':
        options.customPath = args[++i];
        break;
      case '--requests':
      case '-n':
        options.requests = parseInt(args[++i], 10);
        break;
      case '--concurrency':
      case '-c':
        options.concurrency = parseInt(args[++i], 10);
        break;
      case '--duration':
      case '-d':
        options.durationSeconds = parseFloat(args[++i]);
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node load-tester.js [options]

Options:
  --url <url>              Target base URL (default: https://localhost)
  --endpoint <key>         Endpoint key from endpoints.json: static, aggregation, search, dynamic_read
  --path <path>            Custom request path (overrides endpoint key)
  --requests, -n <num>     Total requests (e.g. 1, 10, 100, 1000, 5000) (default: 100)
  --concurrency, -c <num>  Concurrent workers (default: 10)
  --duration, -d <sec>     Spread requests over duration in seconds (e.g. 300 for 5 min; 0 = max speed)
  --output, -o <file>      JSON output file path
        `);
        process.exit(0);
    }
  }

  return options;
}

const endpointsMeta = JSON.parse(fs.readFileSync(path.join(__dirname, 'endpoints.json'), 'utf8'));

async function main() {
  const opts = parseArgs();
  const endpointInfo = endpointsMeta[opts.endpointKey] || {
    name: opts.endpointKey,
    tier: 'Custom',
    path: opts.customPath || opts.endpointKey,
    method: 'GET'
  };

  const targetPath = opts.customPath || endpointInfo.path;
  const fullUrl = new URL(targetPath, opts.baseUrl);

  console.log(`========================================================================`);
  console.log(`  LOAD TEST BENCHMARK`);
  console.log(`========================================================================`);
  console.log(`  Endpoint Name: ${endpointInfo.name}`);
  console.log(`  Target Tier:   ${endpointInfo.tier}`);
  console.log(`  Target URL:    ${fullUrl.href}`);
  console.log(`  Requests:      ${opts.requests}`);
  console.log(`  Concurrency:   ${Math.min(opts.concurrency, opts.requests)}`);
  console.log(`  Duration:      ${opts.durationSeconds > 0 ? opts.durationSeconds + 's (spaced)' : 'Immediate'}`);
  console.log(`========================================================================\n`);

  const latencies = [];
  const statusCodes = {};
  let errorsCount = 0;
  let completed = 0;
  const startTime = Date.now();

  const agentOptions = { keepAlive: true, rejectUnauthorized: false };
  const httpAgent = fullUrl.protocol === 'https:' ? new https.Agent(agentOptions) : new http.Agent(agentOptions);
  const client = fullUrl.protocol === 'https:' ? https : http;

  function makeRequest() {
    return new Promise((resolve) => {
      const reqStart = process.hrtime.bigint();
      const req = client.request(fullUrl, {
        method: endpointInfo.method || 'GET',
        agent: httpAgent,
        headers: {
          'Host': fullUrl.host,
          'User-Agent': 'Assignment4-LoadTester/1.0'
        }
      }, (res) => {
        // Drain response body
        res.on('data', () => {});
        res.on('end', () => {
          const reqEnd = process.hrtime.bigint();
          const latencyMs = Number(reqEnd - reqStart) / 1e6;
          latencies.push(latencyMs);

          const code = res.statusCode;
          statusCodes[code] = (statusCodes[code] || 0) + 1;
          completed++;
          resolve();
        });
      });

      req.on('error', (err) => {
        const reqEnd = process.hrtime.bigint();
        const latencyMs = Number(reqEnd - reqStart) / 1e6;
        latencies.push(latencyMs);

        statusCodes['error'] = (statusCodes['error'] || 0) + 1;
        errorsCount++;
        completed++;
        resolve();
      });

      req.end();
    });
  }

  // Work distribution
  if (opts.durationSeconds > 0 && opts.requests > 1) {
    // Spaced out over durationSeconds
    const intervalMs = (opts.durationSeconds * 1000) / opts.requests;
    console.log(`Pacing requests: 1 request every ~${intervalMs.toFixed(2)}ms`);

    const queue = [];
    for (let i = 0; i < opts.requests; i++) {
      const p = new Promise(resolve => setTimeout(resolve, i * intervalMs)).then(() => makeRequest());
      queue.push(p);
    }
    await Promise.all(queue);
  } else {
    // Concurrent pool
    let currentIndex = 0;
    const workerCount = Math.min(opts.concurrency, opts.requests);

    async function worker() {
      while (currentIndex < opts.requests) {
        currentIndex++;
        await makeRequest();
      }
    }

    const workers = [];
    for (let i = 0; i < workerCount; i++) {
      workers.push(worker());
    }
    await Promise.all(workers);
  }

  const totalTimeSeconds = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const mean = latencies.length > 0 ? (sum / latencies.length) : 0;
  const min = latencies.length > 0 ? latencies[0] : 0;
  const max = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
  const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.50)] : 0;
  const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const p99 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0;
  const rps = totalTimeSeconds > 0 ? (completed / totalTimeSeconds) : 0;

  console.log(`Results:`);
  console.log(`  Completed:    ${completed}/${opts.requests}`);
  console.log(`  Total Time:   ${totalTimeSeconds.toFixed(2)}s`);
  console.log(`  Throughput:   ${rps.toFixed(2)} req/sec`);
  console.log(`  Min Latency:  ${min.toFixed(2)} ms`);
  console.log(`  Mean Latency: ${mean.toFixed(2)} ms`);
  console.log(`  p50 (Median): ${p50.toFixed(2)} ms`);
  console.log(`  p95 Latency:  ${p95.toFixed(2)} ms`);
  console.log(`  p99 Latency:  ${p99.toFixed(2)} ms`);
  console.log(`  Max Latency:  ${max.toFixed(2)} ms`);
  console.log(`  Status Codes: ${JSON.stringify(statusCodes)}\n`);

  const report = {
    endpointKey: opts.endpointKey,
    endpointName: endpointInfo.name,
    targetTier: endpointInfo.tier,
    targetUrl: fullUrl.href,
    totalRequests: opts.requests,
    completedRequests: completed,
    concurrency: opts.concurrency,
    durationConfiguredSeconds: opts.durationSeconds,
    actualDurationSeconds: totalTimeSeconds,
    throughputRps: rps,
    latencies: {
      minMs: min,
      meanMs: mean,
      p50Ms: p50,
      p95Ms: p95,
      p99Ms: p99,
      maxMs: max
    },
    statusCodes: statusCodes,
    errorCount: errorsCount,
    timestamp: new Date().toISOString()
  };

  if (opts.output) {
    const outDir = path.dirname(opts.output);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(opts.output, JSON.stringify(report, null, 2));
    console.log(`Saved benchmark report to: ${opts.output}`);
  }

  return report;
}

main().catch(err => {
  console.error("Benchmark error:", err);
  process.exit(1);
});

