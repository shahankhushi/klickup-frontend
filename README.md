# KlickUp Frontend

A full-featured **ClickUp Clone** frontend built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **@dnd-kit**.

---

## ✨ Features

- 📋 **List & Board Views**: Interactive task list and drag-and-drop Kanban board (`@dnd-kit`).
- 🎨 **Whiteboard & Canvas**: Collaborative whiteboard with shapes, sticky notes, task cards, zoom controls, and undo/redo history.
- 📄 **ClickUp Docs**: Document editor, document list, contextual toolbar, and folder organization.
- 📊 **Dashboard & Reports**: Visual project metrics, status charts, completion trackers, and velocity graphs.
- ⚡ **Quick Add & Modals**: Inline task composer, quick floating action buttons, priority/status pickers, and assignee selectors.
- 🌓 **Theming**: Dark and Light mode support with Tailwind CSS.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.x or v20.x+)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in this directory (or configure API base URL):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js App Router (Pages, Layouts, Routes)
│   ├── (app)/                # Protected App Layout (Tasks, Board, Whiteboard, Docs, Team)
│   ├── login/                # Authentication - Login
│   ├── signup/               # Authentication - Signup
│   └── globals.css           # Global Tailwind CSS styles
├── components/               # React UI Components
│   ├── dashboard/            # Dashboard widgets & charts
│   ├── docs/                 # Document manager & editor components
│   ├── layout/               # AppShell, Navbar, Sidebar, Header
│   ├── pages/                # Page-level containers
│   ├── providers/            # Theme & Context providers
│   ├── tasks/                # List view, Kanban, Pickers, TaskComposer
│   ├── ui/                   # Reusable UI primitives (Button, Modal, Card, etc.)
│   └── whiteboard/           # Canvas renderers, sticky notes, toolbars
├── lib/                      # State stores, mock data, utility functions
└── public/                   # Static assets & icons
```

---

## 🔗 Backend Repository

The backend REST API for this project is hosted at:
[https://github.com/shahankhushi/klickup-backend](https://github.com/shahankhushi/klickup-backend)
