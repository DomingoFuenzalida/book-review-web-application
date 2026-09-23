# Assignment 4 Load Test Summary (scale)

| Endpoint | Tier | Requests | Throughput (req/s) | Mean Latency (ms) | p95 (ms) | p99 (ms) | Errors | Avg CPU (%) |
|---|---|---|---|---|---|---|---|---|
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 1 | 33.33 | 28.47 | 28.47 | 28.47 | 0 | 1.1 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 10 | 263.16 | 11.22 | 34.29 | 34.29 | 0 | 0.9 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 100 | 1086.96 | 7.09 | 19.70 | 37.02 | 0 | 2.6 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 1000 | 1709.40 | 13.97 | 27.96 | 39.81 | 0 | 31.1 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 5000 | 2076.41 | 23.70 | 53.20 | 70.82 | 0 | 33.4 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 1 | 0.47 | 2111.76 | 2111.76 | 2111.76 | 0 | 9.1 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 10 | 294.12 | 9.17 | 31.01 | 31.01 | 0 | 1.4 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 100 | 1052.63 | 6.98 | 31.95 | 52.86 | 0 | 2.5 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 1000 | 3787.88 | 6.04 | 10.93 | 35.25 | 0 | 12.3 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 5000 | 4757.37 | 10.19 | 18.30 | 43.95 | 0 | 58.5 |
| Search Engine Query | Elasticsearch Engine | 1 | 9.71 | 102.73 | 102.73 | 102.73 | 0 | 1.7 |
| Search Engine Query | Elasticsearch Engine | 10 | 166.67 | 21.91 | 44.85 | 44.85 | 0 | 2.5 |
| Search Engine Query | Elasticsearch Engine | 100 | 529.10 | 16.92 | 30.91 | 47.74 | 0 | 16.9 |
| Search Engine Query | Elasticsearch Engine | 1000 | 813.67 | 29.82 | 52.38 | 78.25 | 0 | 108.8 |
| Search Engine Query | Elasticsearch Engine | 5000 | 1342.64 | 36.85 | 67.94 | 89.72 | 0 | 72.5 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 1 | 35.71 | 27.66 | 27.66 | 27.66 | 0 | 32.5 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 10 | 270.27 | 8.82 | 33.24 | 33.24 | 0 | 41.8 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 100 | 1666.67 | 4.00 | 20.79 | 37.28 | 0 | 16.5 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 1000 | 5524.86 | 3.99 | 6.18 | 29.70 | 0 | 2.0 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 5000 | 7320.64 | 6.55 | 10.39 | 35.71 | 0 | 11.2 |
