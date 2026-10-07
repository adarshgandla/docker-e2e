# 💻 Common Docker Commands: The Essential CLI Reference Manual

> **A focused, hands-on command reference manual for Docker fundamentals.**  
> Covers essential container operations, image management, port forwarding, background execution, and system maintenance using clean, natural syntax.

---

## 📋 The Core Commands Cheatsheet

| Command | Purpose | Natural Example |
|:---|:---|:---|
| **`docker images`** | List all Docker images stored on your system | `docker images` |
| **`docker ps`** | List currently running containers | `docker ps` |
| **`docker ps -a`** | List all containers (running + stopped/exited) | `docker ps -a` |
| **`docker pull <image>`** | Download an image from Docker Hub / Registry | `docker pull nginx` |
| **`docker run <image>`** | Create and start a new container from an image | `docker run nginx` |
| **`docker run -p <h:c> <image>`** | Run container with host-to-container port mapping | `docker run -p 8080:80 nginx` |
| **`docker run -d -p <h:c> <image>`** | Run container in background (detached mode) with port mapping | `docker run -d -p 8080:80 nginx` |
| **`docker stop <container>`** | Gracefully stop a running container | `docker stop my-web` |
| **`docker start <container>`** | Restart an existing stopped container | `docker start my-web` |
| **`docker rm <container>`** | Delete a stopped container | `docker rm my-web` |
| **`docker rm -f <container>`** | Force stop and delete a running container | `docker rm -f my-web` |
| **`docker rmi <image>`** | Delete a Docker image from local storage | `docker rmi nginx` |
| **`docker logs <container>`** | View console stdout/stderr logs of a detached container | `docker logs -f my-web` |
| **`docker exec -it <container> sh`** | Open an interactive terminal shell inside a running container | `docker exec -it my-web sh` |
| **`docker system prune -a`** | Delete all stopped containers, unused networks, and unreferenced images | `docker system prune -a` |

---

## 1. Image Operations

### 1.1 `docker pull <image-name>`
Downloads an image from a remote registry (Docker Hub, GHCR) to your local machine without running it.

```bash
# Pull latest official Nginx image
docker pull nginx

# Pull a specific version tag
docker pull node:20-alpine
```

### 1.2 `docker images`
Displays all images currently stored on your local disk with their Repository, Tag, Image ID, Creation date, and Virtual Size.

```bash
docker images
```

*Sample Output:*
```text
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    a6bd71f485c2   2 days ago     187MB
node         20-alpine 8b5ec1e2d930   1 week ago     178MB
```

### 1.3 `docker rmi <image-id / image-name>`
Deletes one or more images from local disk.

```bash
# Delete by repository name and tag
docker rmi nginx

# Delete by Image ID
docker rmi a6bd71f485c2

# Force delete an image even if previously referenced
docker rmi -f <image-id>
```

> ⚠️ **Note:** Docker will block you from deleting an image if an existing container (even a stopped one) was created from it. Remove the container first (`docker rm`), or use `-f` to force.

---

## 2. Container Creation & Execution (`docker run`)

`docker run` is the primary command in Docker. Under the hood, it performs two distinct steps:
1. `docker create`: Allocates container filesystem, network interfaces, and namespaces.
2. `docker start`: Launches the primary process inside the container.

### 2.1 Basic Run (Foreground Mode)
```bash
docker run <image-name>
```
* **Behavior**: Runs the container in the foreground, binding container output directly to your current terminal window.
* **Limitation**: Your terminal is locked until the container stops. Pressing `Ctrl + C` sends a `SIGINT` and terminates the container.

---

### 2.2 Run with Port Forwarding (`-p <host-port>:<container-port>`)
Containers run in isolated network namespaces with private internal IP addresses. To access a web service inside the container from your browser or host network, you must expose and map a port:

```bash
docker run -p <host-port>:<container-port> <image-name>
```

#### Understanding the Syntax:
$$\text{Host Port (Laptop / Server)} \xrightarrow{\quad\text{mapped to}\quad} \text{Container Port (Internal App)}$$

* **Example 1**: Expose an internal web app running on port 80 to your laptop at port 8080:
  ```bash
  docker run -p 8080:80 nginx
  ```
  *You can now open `http://localhost:8080` in your host browser.*

* **Example 2**: Expose internal API port 9090 on host port 9090:
  ```bash
  docker run -p 9090:9090 <image-name>
  ```

---

### 2.3 Run in Detached / Background Mode (`-d`)
In everyday development and production deployments, you do not want your shell session locked by container stdout logs. The `-d` (detached) flag runs the container in the background as a daemon process:

```bash
docker run -d -p <host-port>:<container-port> <image-name>
```

* **Example**:
  ```bash
  docker run -d -p 8080:80 nginx
  ```
* **What happens**:
  1. Docker creates the container and starts it in the background.
  2. Docker immediately returns the unique 64-character container ID hash to your shell.
  3. Your terminal remains completely free to run subsequent commands.

---

### 2.4 Run with Custom Name (`--name`)
By default, Docker assigns random auto-generated names (e.g., `trusting_curie`, `brave_hopper`). Use `--name` to assign a friendly, predictable identifier:

```bash
docker run -d -p 8080:80 --name web-server nginx
```

Now you can control the container using its name instead of remembering container ID hashes:
```bash
docker stop web-server
docker rm web-server
```

---

### 2.5 Run with Volume Persistence (`-v`)
Containers are ephemeral by default; any data written inside the container is lost when the container is deleted. The `-v` flag attaches a persistent storage volume:

```bash
docker run -d -p 3000:3000 -v app_data:/data --name app-container <image-name>
```

* `app_data`: Named Docker volume on the host.
* `/data`: Directory path inside the container where files are written.

---

## 3. Container Inspection & Monitoring

### 3.1 `docker ps`
Lists all **currently running** containers.

```bash
docker ps
```

*Sample Output:*
```text
CONTAINER ID   IMAGE   COMMAND                  CREATED         STATUS         PORTS                  NAMES
e3f890a1bc23   nginx   "/docker-entrypoint.…"   2 minutes ago   Up 2 minutes   0.0.0.0:8080->80/tcp   web-server
```

### 3.2 `docker ps -a`
Lists **all** containers on the system, including stopped, exited, or crashed containers.

```bash
docker ps -a
```

*Useful to check exit codes (`Exited (0)`, `Exited (137)`) when debugging container failures.*

---

### 3.3 `docker logs <container>`
Fetches logs produced by applications running inside a detached (`-d`) container:

```bash
# View all previous output
docker logs <container-name-or-id>

# Follow live output in real-time (like tail -f)
docker logs -f <container-name-or-id>

# View last 50 lines with timestamps
docker logs --tail 50 -t <container-name-or-id>
```

---

### 3.4 `docker exec -it <container> sh`
Opens an interactive terminal session inside a running container for inspection, troubleshooting, or running internal commands:

```bash
# Open interactive shell (Alpine Linux)
docker exec -it <container-name-or-id> sh

# Open interactive bash shell (Ubuntu/Debian)
docker exec -it <container-name-or-id> bash
```

* **Flags Breakdown**:
  * `-i` (`--interactive`): Keeps standard input (`STDIN`) open.
  * `-t` (`--tty`): Allocates a pseudo-TTY terminal screen.

---

## 4. Container Lifecycle Management

```text
[ Docker Image ]
       │
       ▼ (docker run)
 ┌───────────┐   docker stop    ┌───────────┐
 │  RUNNING  │ ───────────────> │  STOPPED  │
 │           │ <─────────────── │  (Exited) │
 └───────────┘   docker start   └───────────┘
       │                              │
       ▼ (docker rm -f)               ▼ (docker rm)
 [ Container Destroyed ]        [ Container Deleted ]
```

### 4.1 Stop a Container
Sends a `SIGTERM` signal allowing the application up to 10 seconds to finish active requests, followed by `SIGKILL`:
```bash
docker stop <container-name-or-id>
```

### 4.2 Start a Stopped Container
Re-launches an existing stopped container without altering its filesystem or state:
```bash
docker start <container-name-or-id>
```

### 4.3 Restart a Container
Stops and immediately restarts the container:
```bash
docker restart <container-name-or-id>
```

### 4.4 Delete a Container
Removes container metadata and isolated read-write storage layers:
```bash
# Delete a stopped container
docker rm <container-name-or-id>

# Force delete a currently running container
docker rm -f <container-name-or-id>
```

---

## 5. System Maintenance & Cleanup

Over time, building and testing containers leaves behind stopped containers, dangling images, and unused networks that consume gigabytes of disk space.

### 5.1 `docker system prune -a`
Performs a full automated system purge:
* Removes all stopped containers.
* Removes all networks not used by at least one container.
* Removes all unused and dangling images.
* Removes all build cache layers.

```bash
docker system prune -a
```

*Sample Confirmation:*
```text
WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all images without at least one container associated to them
  - all build cache

Are you sure you want to continue? [y/N] y
Deleted Containers:
e3f890a1bc23...
Total reclaimed space: 4.825GB
```

### 5.2 `docker system df`
Analyzes disk space consumed by Images, Containers, Local Volumes, and Build Cache:

```bash
docker system df
```

---

## 🚩 Essential Flag Reference Table

| Flag | Full Name | Description | Example Usage |
|:---|:---|:---|:---|
| **`-d`** | `--detach` | Runs container in the background, prints container ID | `docker run -d nginx` |
| **`-p`** | `--publish` | Maps host port to container port (`<host>:<container>`) | `docker run -p 8080:80 nginx` |
| **`--name`** | `--name` | Assigns a custom friendly name to the container | `docker run --name my-app nginx` |
| **`-v`** | `--volume` | Binds a volume or directory path (`<vol>:<path>`) | `docker run -v my_data:/data app` |
| **`-e`** | `--env` | Injects environment variables into the container | `docker run -e NODE_ENV=prod app` |
| **`-it`** | `--interactive --tty` | Opens an interactive terminal session | `docker exec -it my-app sh` |
| **`-a`** | `--all` | Includes inactive/stopped items | `docker ps -a` |
| **`-f`** | `--force` / `--follow` | Force operation, or stream live log feed | `docker rm -f my-app` / `docker logs -f my-app` |

---

## 🎙️ 20-Second Speaker Cues for Your Team

### 1. How to explain `docker run` vs `docker run -d`:
> *"When you run `docker run`, Docker attaches the container's output directly to your shell, locking your screen. When you add `-d` for detached mode, Docker runs it in the background as a daemon and gives you back your terminal prompt immediately. That is what we use in 99% of our daily development and production setups."*

### 2. How to explain Port Forwarding (`-p 8080:80`):
> *"A container is a private sandbox with its own isolated IP address. By default, your laptop cannot reach it. The `-p 8080:80` flag opens a doorway: any traffic hitting port 8080 on your laptop is automatically forwarded into port 80 inside the container."*

### 3. How to explain `docker system prune -a`:
> *"As you pull images and test containers, old layers pile up on your hard drive. Running `docker system prune -a` is Docker's spring-cleaning command: it wipes out stopped containers, dangling images, and build caches, instantly freeing up gigabytes of disk space."*

---

## 🔗 Related Documentation

* **[imgs.md](./imgs.md)** — Architectural diagrams and lecture slide deck
* **[README.md](./README.md)** — Full curriculum overview and track navigation
* **[Track 1: Single Container](./01-single-container/)** — Monolithic multi-stage build & volume mapping
* **[Track 2: Multi-Container Microservices](./02-multi-container/)** — Compose orchestration & internal DNS
* **[Track 3: Host Database Bridge](./03-host-database-mysql/)** — Hybrid host database networking
* **[Track 4: CI/CD Automation](./04-cicd-automation/)** — GHCR publishing and Watchtower auto-deployments
