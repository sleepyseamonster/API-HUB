# Design System: "The Machine Console"

This document defines the visual and structural language for the API HUB. Our design philosophy is **Industrial Minimalism**: it should feel like a precision instrument, not a decorative website.

## 1. Core Philosophy
- **Industrial/Mechanical**: It feels like a control panel or a tool.
- **Minimalist**: No decoration. Every element has a function.
- **Developer-Grade**: High density, monospaced accents, and structured grids.
- **Reliable**: Communicates stability through solid geometry and neutral tones.

## 2. Visual Identity

### Color Palette (Neutral & Low-Contrast)
| Layer | Hex Code | Usage |
| :--- | :--- | :--- |
| **Background** | `#F6F4F1` / `#121212` | Main canvas (Light/Dark mode) |
| **Panel** | `#FFFFFF` / `#1A1A1A` | Modular interface blocks |
| **Accent** | `#25A9BF` | Primary actions, active states, highlights |
| **Text (Primary)** | `#222222` / `#EDEDED` | Main content and headings |
| **Text (Muted)** | `#666666` / `#A1A1A1` | Labels, secondary info |
| **Success** | `#10B981` | Positive status, successful runs |
| **Error** | `#EF4444` | Failed jobs, alerts |

### Typography
- **Primary Font**: `Inter` / `SF Pro` / `Söhne` (Clean, modern sans-serif).
- **Technical/Code Font**: `JetBrains Mono` / `IBM Plex Mono` (Monospaced for endpoints, JSON, status).
- **Scale**:
  - Headings: 24–32px (Medium weight)
  - Body: 14–16px (Regular)
  - Labels/Monos: 12–13px (Medium)

### Grid & Spacing
- **Base Unit**: 8px
- **Scale**: 8 / 16 / 24 / 32 / 48 / 64
- **Layout**: Sharp geometry. Subtle 4px-6px border radius. 1px solid borders for panel separation.

## 3. Component Rules

### Panels & Cards
- Use thin borders (`1px solid #E5E5E5`) instead of heavy shadows.
- Group functional units into "Panels" that feel modular.

### Buttons & Inputs
- **Buttons**: Flat design, restrained padding (10px 16px). Avoid large gradients.
- **Inputs**: Minimal, white/dark-neutral background, focus state uses `Accent` border.

### Status Indicators
- Use clear badges: `RUNNING`, `SUCCESS`, `ERROR`, `IDLE`.
- Always provide a visual cue for system state.

## 4. Design References
- **Primary**: Stripe Dashboard, Postman Workspace, Vercel Dashboard.
- **Secondary**: Linear, Supabase, GitHub, Raycast.
