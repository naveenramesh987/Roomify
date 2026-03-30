# Roomify

An AI-powered architectural design environment that transforms 2D floor plans into photorealistic 3D visualizations in seconds.

## 🏠 Overview

Roomify leverages high-performance AI models to bridge the gap between 2D technical drawings and immersive 3D renders. Users can upload floor plans (JPG, PNG, WebP) and instantly generate top-down 3D architectural visualizations with realistic lighting, textures, and extruded walls.

The project is built on React Router 7, styled with Tailwind CSS 4, and powered by the Puter.js ecosystem for cloud storage, authentication, and AI computing.

## ✨ Key Features

- **AI 3D Visualization** — Uses `gemini-2.0-flash-exp` (via Puter AI) to convert 2D lines into 3D geometry.
- **Interactive Comparison** — A built-in "Before and After" slider to compare the original floor plan against the AI render.
- **Cloud Persistence** — Automatic saving of projects to Puter's KV storage and file hosting, allowing users to access their design history.
- **Authentication** — Secure sign-in/up via Puter to manage private design projects.
- **Export Ready** — One-click download of high-resolution renders for professional use.

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React Router 7 (SSR enabled) |
| Styling | Tailwind CSS 4 with native CSS variables |
| Backend & Cloud | Puter.js (Auth, KV Storage, Hosting, Workers) |
| AI Model | Gemini-2.0-Flash-Image-Preview via Puter AI |
| Icons | Lucide React |

## 🚀 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/naveenramesh987/roomify.git
   cd roomify
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment setup:**
   Ensure you have a Puter account. If deploying via Puter Workers, set your `VITE_PUTER_WORKER_URL` in your environment variables.

## 🏗️ Project Structure

```text
/app/routes     — Home page (upload) and Visualizer (editor/render view)
/components     — UI components: Navbar, Button, Upload dropzone
/lib
  ai.action.ts      — Core logic for the AI image generation API
  puter.action.ts   — KV database operations and project management
  constants.ts      — ROOMIFY_RENDER_PROMPT architectural instruction set
```

## 🖥️ Usage

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Docker

```bash
docker build -t roomify .
docker run -p 3000:3000 roomify
```

## AI Rendering

Once an image is uploaded, the system sends a detailed prompt to the AI, ensuring:

- **Text Removal** — All dimensions and labels are stripped for a clean look.
- **Geometry Accuracy** — Walls and doors are extruded exactly where they appear in the 2D plan.
- **Realistic Materials** — Addition of realistic wood or tile floors and neutral daylighting.

---

Built with ❤️ using React Router and Puter.
