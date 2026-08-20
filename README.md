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

## Option 2: Deploy to Kubernetes (Minikube)

The Kubernetes setup utilizes standard manifests located in `k8s/`:
- `configmap.yaml`: Application environment variables.
- `secret.yaml`: Secure default credentials.
- `pvc.yaml`: PersistentVolumeClaim ensuring SQLite data survives Pod restarts.
- `deployment.yaml`: Application container configuration mounting the PVC.
- `service.yaml`: NodePort service exposing the application.

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
   kubectl wait --for=condition=ready pod -l app=book-app --timeout=90s
   ```

5. **Expose and Access the Application:**
   Run the port forward command in a dedicated terminal window:
   ```bash
   kubectl port-forward svc/book-app-service 3000:3000
   ```
   Open your browser at <http://localhost:3000>.

   *(Alternative: Run `minikube service book-app-service` to open a direct tunnel)*.

---

### Verifying Kubernetes Requirements

#### 1. Service Reachability
Test that the API responds through the exposed service:
```bash
curl http://localhost:3000/
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