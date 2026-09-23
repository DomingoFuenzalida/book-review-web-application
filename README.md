# Book Review Web Application

An Express and SQLite library application for browsing books and authors, reading and writing reviews, managing users, and analyzing book sales.

---

## Features

- **Entity Management:** Full CRUD operations for Authors, Books, Reviews, Sales by Year, and Users.
- **Authentication & RBAC:** User registration (`/api/auth/register`), login (`/api/auth/login`), password hashing via `bcrypt`, and role-based access control (Admin vs. Standard User).
- **Ownership & Permissions:** Standard users can create reviews and modify/delete only their own content. Admins have global management rights.
- **Community Feedback:** Authenticated users can vote and mark reviews as helpful on reviews created by other users.
- **Automated Seeding:** Automatically populates fresh databases on startup with 1 admin, 20 users, 50 authors, 300 books, dynamic reviews, and 5-year sales projections.
- **Containerization & Orchestration:** Fully configured for Docker Compose, Docker Swarm, and Kubernetes (Minikube) with persistent storage and decoupled configurations.

---

## Default Credentials

| Account | Username | Password | Role |
| :--- | :--- | :--- | :--- |
| Administrator | `admin` | `adminpassword123` | `admin` |
| Regular User | `user_1` | `password123` | `user` |

---

## Prerequisites & Installation

### 1. Docker
Ensure Docker Engine and Docker Compose are installed and running on your host system.

### 2. Install kubectl (Kubernetes CLI)
If you don't have `kubectl` installed on Linux/WSL2:
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm -f kubectl
```

### 3. Install Minikube
If you don't have `minikube` installed on Linux/WSL2:
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm -f minikube-linux-amd64
```

---

## Option 1: Run with Docker Compose

### Start the Application
From the project root directory:
```bash
docker compose up --build
```
Then open <http://localhost:3000> in your web browser.

### Run in the Background
```bash
docker compose up --build -d
```

### View Logs and Stop
```bash
# View live logs
docker compose logs -f api

# Stop containers
docker compose down
```

### Reset Database (Docker Compose)
The database is stored in `./data/database.sqlite`. To completely reset:
```bash
docker compose down
rm -f data/database.sqlite
docker compose up --build
```

---

## Caching Implementation (Redis)

To optimize read-heavy and computationally expensive results, the application implements an optional **read-acceleration tier** powered by **Redis**.

The caching layer is strictly optional; the application fulfills the "runs without it" constraint and falls back to normal database queries if the cache is disabled or unavailable.

### Cached Resources
The following resource-intensive data is cached and retrieved instantly:
- **Authors Overview Table** (Total sales, review counts, average scores per author)
- **Top 10 Rated Books**
- **Top 50 Selling Books**

### Cache Invalidation Strategy
The cache implements robust invalidation logic to prevent stale data. Derived entries are purged when their underlying truth changes:
- Creating, editing, or deleting a **Review** invalidates the Top 10 rated cache, the authors overview cache, and that specific author's cache (to reflect the new average score).
- Creating, editing, or deleting a **Sale** invalidates the Top 50 selling cache, the authors overview cache, and that specific author's cache (to reflect the new total sales).
- Editing or deleting a **Book** or **Author** invalidates the corresponding author's overview cache.

### Running with Cache Enabled
To run the stack (Application + Database + Cache) using Docker Compose, use the dedicated cache compose file which provisions the Redis container and sets the `USE_CACHE=true` environment variable:

```bash
docker compose -f docker-compose.cache.yml up --build
```

---

## Search Engine Implementation (Elasticsearch)

To provide relevance-ranked, full-text search capabilities across books and reviews, the application incorporates **Elasticsearch** as a dedicated search engine.

This layer is also optional; the application adheres to the "runs without it" constraint by transparently falling back to a standard database `LIKE` query on the book summaries if the search engine is disabled.

### Indexed Resources
The search index (built using `@elastic/elasticsearch`) tracks the following for lightning-fast retrieval:
- **Books**: Title (`name`) and `summary` text.
- **Reviews**: Full review text aggregated per book.

Queries against the `/api/books/search` endpoint are routed to Elasticsearch to execute a `multi_match` search across these fields, applying relevance boosting (e.g., matching the title yields a higher score than matching a review).

### Sync and Invalidation Strategy
To keep the secondary index consistent with the database source of truth:
- **Book Mutations**: Creating or editing a book immediately synchronizes its document (including its current reviews) to the Elasticsearch index. Deleting a book removes its document from the index.
- **Review Mutations**: Creating, editing, or deleting a review triggers an update on the parent book's document in Elasticsearch to ensure search queries reflect the latest community feedback.

### Running with Search Engine Enabled
You have two new Docker Compose configurations to explore these features without Kubernetes:

1. **Application + Database + Search Engine**
   ```bash
   docker compose -f docker-compose.search.yml up --build
   ```

2. **Full Stack (Application + Database + Cache + Search Engine)**
   ```bash
   docker compose -f docker-compose.full.yml up --build
   ```

---

## Reverse Proxy & Horizontal Scaling (Varnish + Hitch)

To emulate a production-grade edge tier and achieve horizontal scalability, the application is deployed behind a reverse proxy that acts as a Load Balancer, TLS terminator, and Content Delivery Network (CDN) for static assets.

Since our group was assigned **Varnish**, and Varnish natively only speaks HTTP, we paired it with **Hitch** (the official TLS proxy for Varnish) to handle HTTPS termination with a self-signed certificate (`app.localhost`).

### Static Assets (Edge CDN)
The application allows uploading cover images for Books and profile images for Authors.
- Images are stored in a shared Docker volume (`uploads_data`) so they are accessible to all horizontal application replicas.
- When `USE_PROXY=true` is set, the Node.js application stops serving static files directly. Instead, Varnish intercepts all requests to `/uploads/*`, `/js/*`, and `/css/*` and serves them from its cache, drastically reducing load on the Node.js processes.

### Load Balancing & Statelessness
Because the application authenticates users statelessly via a signed token/header and stores uploaded images in a shared volume, any instance can safely serve any request.
The scaled deployment runs 3 identical instances of the Node.js API (`api1`, `api2`, `api3`). Varnish acts as a **Round-Robin Load Balancer**, distributing incoming traffic equally across all 3 instances.

### How to Run the New Topologies

1. **Single Instance + Proxy**
   Runs the App + Database + Varnish + Hitch.
   ```bash
   docker compose -f docker-compose.proxy.yml up --build
   ```

2. **Single Instance + Proxy + Cache + Search**
   Runs the complete feature set but with a single API instance.
   ```bash
   docker compose -f docker-compose.proxy-full.yml up --build
   ```

3. **Horizontally Scaled (x3) + Proxy + Cache + Search**
   Runs the full load-balanced architecture.
   ```bash
   docker compose -f docker-compose.scale.yml up --build
   ```

**Accessing the Application over HTTPS:**
Once deployed, the application will be available securely at **`https://localhost`** (or `https://app.localhost` if you update your `/etc/hosts`). You will need to accept the self-signed certificate warning in your browser.

---

## Option 2: Deploy to Kubernetes (Minikube)

The Kubernetes setup in `k8s/` implements the full horizontally scaled production architecture with Edge Proxy:
- `configmap.yaml`: Application environment variables (`USE_PROXY=true`, `STORAGE_PATH`, etc.).
- `secret.yaml`: Secure default credentials.
- `pvc.yaml`: PersistentVolumeClaims for SQLite database (`book-app-data-pvc`) and shared uploaded images (`book-app-uploads-pvc`).
- `deployment.yaml`: Horizontally scaled Node.js application (3 replicas) mounting both shared PVCs.
- `service.yaml`: Internal ClusterIP service balancing requests across the 3 replicas.
- `edge-proxy.yaml`: Edge tier containing Varnish (caching reverse proxy & load balancer), Hitch (TLS termination on port 443), and Nginx (static asset origin), exposed via NodePort `30443` (HTTPS) and `30080` (HTTP).
- `redis.yaml`: Redis cache deployment and service.
- `elasticsearch.yaml`: Elasticsearch search engine deployment and service.

### Step-by-Step Deployment

1. **Start Minikube Cluster:**
   ```bash
   minikube start --driver=docker
   ```

2. **Build and Load the Docker Image into Minikube:**
   ```bash
   docker build -t book-review-api:latest .
   minikube image load book-review-api:latest
   ```

3. **Apply Kubernetes Manifests:**
   ```bash
   kubectl apply -f k8s/
   ```

4. **Wait for Pod Readiness:**
   ```bash
   kubectl wait --for=condition=ready pod -l app=book-app --timeout=120s
   kubectl wait --for=condition=ready pod -l app=edge-proxy --timeout=90s
   ```

5. **Access the Application via Edge Proxy (HTTPS):**
   Expose the edge proxy service via port forward or NodePort:
   ```bash
   kubectl port-forward svc/edge-proxy-service 8443:443 8080:80
   ```
   Open **`https://localhost:8443`** (or `https://app.localhost:8443`) in your web browser.

---

## Option 3: Load Testing Suite (Assignment 4)

To benchmark the single-instance vs. horizontally scaled (x3) architectures across the 5 request tiers (1, 10, 100, 1000, 5000 requests in 5 minutes) as required by Slides 15 & 16:

See detailed instructions in [`load-tests/README.md`](load-tests/README.md).

### Quick Execution
```bash
# 1. Run benchmarks on the currently active deployment (e.g. scale)
./load-tests/run-all.sh --arch scale

# 2. View generated summary and per-container resource stats
cat load-tests/results/scale/SUMMARY.md
```

#### 2. Pod Self-Healing (Auto-Recreation)
Delete the running pod and observe Kubernetes instantly creating a replacement:
```bash
kubectl delete pod -l app=book-app
kubectl get pods -w
```

#### 3. Database Persistence across Pod Restarts
1. Create or verify records on the frontend / API.
2. Delete the active pod:
   ```bash
   kubectl delete pod -l app=book-app
   kubectl wait --for=condition=ready pod -l app=book-app --timeout=60s
   ```
3. Re-open port forwarding (if disconnected) and query the data:
   ```bash
   kubectl port-forward svc/book-app-service 3000:3000
   ```
   Your records and user modifications remain intact inside the PersistentVolumeClaim.

---

### Reset Database (Kubernetes)

To purge all data and force a fresh automated seed on the cluster:
```bash
# 1. Delete deployment and PersistentVolumeClaim
kubectl delete deployment book-app-deployment
kubectl delete pvc book-app-data-pvc

# 2. Re-apply manifests (a clean PVC will be provisioned and auto-seeded)
kubectl apply -f k8s/
kubectl wait --for=condition=ready pod -l app=book-app --timeout=90s
```

---

### Tear Down Kubernetes Cluster

To stop and remove all local Kubernetes resources:
```bash
# Delete all resources defined in manifests
kubectl delete -f k8s/

# Stop Minikube
minikube stop

# (Optional) Delete Minikube cluster entirely to reclaim disk space
minikube delete --all --purge
```

---

## Option 3: Deploy with Docker Swarm

1. **Initialize Swarm and Deploy Stack:**
   ```bash
   docker swarm init
   docker stack deploy -c docker-stack.yml book_stack
   ```

2. **Verify Running Services:**
   ```bash
   docker stack services book_stack
   ```
   Access the app at <http://localhost:3000>.

3. **Remove Swarm Stack:**
   ```bash
   docker stack rm book_stack
   docker volume rm book_stack_book_data
   ```