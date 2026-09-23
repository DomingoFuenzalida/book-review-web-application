# Assignment 4 Load Test Summary (scale)

| Endpoint | Tier | Requests | Throughput (req/s) | Mean Latency (ms) | p95 (ms) | p99 (ms) | Errors | Avg CPU (%) |
|---|---|---|---|---|---|---|---|---|
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 1 | 40.00 | 23.97 | 23.97 | 23.97 | 0 | 1.3 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 10 | 263.16 | 13.61 | 31.85 | 31.85 | 0 | 1.1 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 100 | 757.58 | 11.55 | 33.37 | 45.35 | 0 | 4.7 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 1000 | 1269.04 | 18.99 | 33.33 | 52.29 | 0 | 40.6 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 5000 | 1474.06 | 33.47 | 88.26 | 111.82 | 0 | 36.9 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 1 | 0.35 | 2881.26 | 2881.26 | 2881.26 | 0 | 8.4 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 10 | 344.83 | 10.06 | 25.10 | 25.10 | 0 | 1.6 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 100 | 1388.89 | 5.96 | 24.41 | 33.38 | 0 | 3.5 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 1000 | 2785.52 | 8.44 | 14.59 | 47.05 | 0 | 17.5 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 5000 | 3819.71 | 12.81 | 20.50 | 55.58 | 0 | 63.4 |
| Search Engine Query | Elasticsearch Engine | 1 | 5.81 | 171.47 | 171.47 | 171.47 | 0 | 2.5 |
| Search Engine Query | Elasticsearch Engine | 10 | 103.09 | 40.73 | 53.49 | 53.49 | 0 | 5.8 |
| Search Engine Query | Elasticsearch Engine | 100 | 289.86 | 32.65 | 58.30 | 69.52 | 0 | 30.3 |
| Search Engine Query | Elasticsearch Engine | 1000 | 399.84 | 61.39 | 110.18 | 144.71 | 0 | 91.4 |
| Search Engine Query | Elasticsearch Engine | 5000 | 893.97 | 55.45 | 107.93 | 155.81 | 0 | 109.4 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 1 | 33.33 | 28.29 | 28.29 | 28.29 | 0 | 32.0 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 10 | 312.50 | 9.43 | 26.00 | 26.00 | 0 | 29.7 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 100 | 1754.39 | 4.30 | 21.30 | 31.86 | 0 | 9.4 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 1000 | 4424.78 | 5.23 | 8.43 | 36.14 | 0 | 3.5 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 5000 | 4240.88 | 11.46 | 18.74 | 71.11 | 0 | 12.2 |
