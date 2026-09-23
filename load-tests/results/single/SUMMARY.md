# Assignment 4 Load Test Summary (single)

| Endpoint | Tier | Requests | Throughput (req/s) | Mean Latency (ms) | p95 (ms) | p99 (ms) | Errors | Avg CPU (%) |
|---|---|---|---|---|---|---|---|---|
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 1 | 0.32 | 3100.60 | 3100.60 | 3100.60 | 0 | 0.2 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 10 | 1.62 | 3076.73 | 3100.20 | 3100.20 | 0 | 0.2 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 100 | 3.05 | 3072.69 | 3080.26 | 3101.26 | 0 | 0.2 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 1000 | 7.59 | 3072.38 | 3075.42 | 3093.45 | 0 | 0.2 |
| Cheap Dynamic Read (Single Book Detail) | Baseline App + Database | 5000 | 15.15 | 3077.24 | 3503.87 | 3505.59 | 0 | 0.2 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 1 | 0.32 | 3089.53 | 3089.53 | 3089.53 | 0 | 0.2 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 10 | 1.62 | 3069.47 | 3084.59 | 3084.59 | 0 | 0.2 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 100 | 3.09 | 3071.69 | 3073.92 | 3089.07 | 0 | 0.2 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 1000 | 7.72 | 3072.53 | 3092.40 | 3503.76 | 0 | 0.2 |
| Expensive Aggregation (Top 50 Selling) | Node.js CPU + SQLite + Redis Cache | 5000 | 15.44 | 3072.03 | 3501.20 | 3504.52 | 0 | 0.2 |
| Search Engine Query | Elasticsearch Engine | 1 | 0.32 | 3079.80 | 3079.80 | 3079.80 | 0 | 0.2 |
| Search Engine Query | Elasticsearch Engine | 10 | 1.62 | 3077.63 | 3097.51 | 3097.51 | 0 | 0.2 |
| Search Engine Query | Elasticsearch Engine | 100 | 3.09 | 3072.27 | 3075.12 | 3097.21 | 0 | 0.2 |
| Search Engine Query | Elasticsearch Engine | 1000 | 7.70 | 3072.69 | 3100.51 | 3504.15 | 0 | 0.2 |
| Search Engine Query | Elasticsearch Engine | 5000 | 15.09 | 3087.32 | 3504.14 | 3505.38 | 0 | 0.2 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 1 | 30.30 | 32.60 | 32.60 | 32.60 | 0 | 46.5 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 10 | 238.10 | 10.68 | 39.88 | 39.88 | 0 | 15.3 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 100 | 1694.92 | 4.14 | 19.67 | 37.07 | 0 | 0.3 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 1000 | 5076.14 | 4.29 | 8.70 | 29.38 | 0 | 3.0 |
| Static Asset (Edge / Varnish CDN) | Reverse Proxy / Edge | 5000 | 6729.48 | 7.13 | 10.77 | 41.61 | 0 | 6.4 |
