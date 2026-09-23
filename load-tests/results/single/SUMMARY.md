# Assignment 4 Load Test Summary (single)

| Endpoint | Tier | Requests | Throughput (req/s) | Mean Latency (ms) | p95 (ms) | p99 (ms) | Errors | Avg CPU (%) |
|---|---|---|---|---|---|---|---|---|
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 1 | 45.45 | 21.61 | 21.61 | 21.61 | 0 | 0.3 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 10 | 196.08 | 19.68 | 39.39 | 39.39 | 0 | 0.4 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 100 | 584.80 | 15.59 | 31.36 | 41.21 | 0 | 0.5 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 1000 | 778.82 | 31.47 | 42.40 | 63.42 | 0 | 0.9 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 5000 | 950.75 | 52.25 | 63.00 | 72.38 | 0 | 0.7 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 1 | 0.33 | 3025.38 | 3025.38 | 3025.38 | 0 | 5.6 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 10 | 277.78 | 12.33 | 29.79 | 29.79 | 0 | 1.3 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 100 | 1333.33 | 6.17 | 21.26 | 29.73 | 0 | 0.3 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 1000 | 2398.08 | 9.94 | 13.15 | 42.21 | 0 | 4.7 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 5000 | 3429.36 | 14.31 | 18.65 | 55.27 | 0 | 0.6 |
| Search Engine Query | Elasticsearch Engine | 1 | 6.90 | 144.33 | 144.33 | 144.33 | 0 | 1.0 |
| Search Engine Query | Elasticsearch Engine | 10 | 142.86 | 29.74 | 42.70 | 42.70 | 0 | 2.1 |
| Search Engine Query | Elasticsearch Engine | 100 | 344.83 | 27.35 | 43.21 | 69.85 | 0 | 4.4 |
| Search Engine Query | Elasticsearch Engine | 1000 | 548.25 | 44.92 | 73.61 | 107.43 | 0 | 4.6 |
| Search Engine Query | Elasticsearch Engine | 5000 | 1098.66 | 45.11 | 64.45 | 96.80 | 0 | 2.5 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 1 | 50.00 | 19.74 | 19.74 | 19.74 | 0 | 23.9 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 10 | 344.83 | 9.09 | 23.03 | 23.03 | 0 | 8.1 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 100 | 1470.59 | 5.40 | 29.23 | 40.03 | 0 | 0.8 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 1000 | 4016.06 | 5.73 | 10.15 | 47.77 | 0 | 3.5 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 5000 | 5159.96 | 9.42 | 12.58 | 60.30 | 0 | 11.3 |
