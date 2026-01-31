# A natural language point-and-click interface for motivated proofs

A work-in-progress prototype of a natural-language-based point-and-click interface for generating proofs. For the broader context and motivation of this project, see the blog post https://gowers.wordpress.com/2025/09/22/creating-a-database-of-motivated-proofs/.

# Docker setup

## Install Docker

If you're on macOS or Windows, install the [Docker Desktop](https://docs.docker.com/desktop/) application. On macOS, you can do this either by downloading a `.dmg` file from the Docker website, or by using [Homebrew](https://brew.sh/):

```bash
brew install --cask docker
```

If you're using Linux, you don't need the desktop app, and you're likely fine installing Docker from your package manager.

## Build and run the project

To run the project using Docker for development:

1. **Build the image:**

   ```bash
   docker compose build
   ```

1. **Start the app service:**

   ```bash
   docker compose up
   ```

1. **Access the application:**
   Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

The development setup includes volume mounts for `src`, `tests`, and other configuration files, enabling hot reloading of changes made on your host machine. (That is, you can make changes to the source code and they'll be reflected in the running app without having to rebuild the image.)

# Contributors

- Anand Rao Tadipatri
- Thomas Thevenon
- Leo Hentschker
- Matthew Tucker-Simmons
