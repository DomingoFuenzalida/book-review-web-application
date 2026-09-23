# Assignment 4: Load Testing Suite & Metrics Collector

This directory contains the automated load testing suite for **Assignment 4: Edge & Scale**.

## Overview of Tested Endpoints

As mandated by **Slide 16**, each endpoint is specifically chosen to isolate and stress a distinct tier:

| Endpoint | Target Tier | URL Path | Method | Expected Bottleneck |
| :--- | :--- | :--- | :--- | :--- |
| **Static Asset** | Reverse Proxy / Edge CDN | `/uploads/sample-cover.jpg` | `GET` | Reverse Proxy caching & network throughput |
| **Expensive Aggregation** | App CPU + SQLite + Redis Cache | `/api/reports/top-50-selling` | `GET` | Node.js compute, DB query execution & Cache hits |
| **Search Window** | Search Engine | `/api/books/search?q=the` | `GET` | Elasticsearch indexing & memory/CPU |
| **Cheap Dynamic Read** | Baseline App + SQLite | `/api/books/1` | `GET` | Node.js process & raw SQLite I/O baseline |

---

## Load Profiles

The assignment requires executing benchmarks with **1, 10, 100, 1000, and 5000 requests** across both:
1. **Single-Instance Deployment** (`docker-compose.proxy-full.yml`)
2. **Load-Balanced x3 Deployment** (`docker-compose.scale.yml`)

---

## Step-by-Step Instructions

### Step 1: Benchmark Single-Instance Architecture

1. Start the single-instance stack:
   ```bash
   docker compose -f docker-compose.proxy-full.yml up --build -d
   ```
2. Wait a few seconds for services (Redis, Elasticsearch, Node.js API, Varnish, Hitch) to become ready.
3. Run the automated suite:
   ```bash
   ./load-tests/run-all.sh --arch single
   ```
   *(Optional: to test quickly with small batches first, add `--quick`).*
   *(Optional: to spread requests over 5 minutes (300 seconds), pass `--duration 300`).*
4. Stop the stack:
   ```bash
   docker compose -f docker-compose.proxy-full.yml down
   ```

---

### Step 2: Benchmark Horizontally Scaled Architecture (x3 Replicas)

1. Start the horizontally scaled stack:
   ```bash
   docker compose -f docker-compose.scale.yml up --build -d
   ```
2. Run the automated suite:
   ```bash
   ./load-tests/run-all.sh --arch scale
   ```
3. Stop the stack:
   ```bash
   docker compose -f docker-compose.scale.yml down
   ```

---

## Output Data Structure

All results are automatically recorded under `load-tests/results/<arch>/<endpoint>_<reqs>req/`:
- `benchmark.json`: Exact latency distribution (min, mean, p50, p95, p99, max), requests completed, throughput (RPS), and status codes.
- `container_stats.csv`: Raw, timestamped samples from `docker stats` containing CPU (%), Memory usage, and Threads (`PIDs`) per container.
- `SUMMARY.md`: A consolidated markdown table summarizing all runs for inclusion in the 15-page report.

