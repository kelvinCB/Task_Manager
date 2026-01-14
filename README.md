# Kolium

![Kolium Banner](https://img.shields.io/badge/Kolium-Task_Management_Redefined-blue?style=for-the-badge&logo=task)

[![Website](https://img.shields.io/badge/Website-Kolium.com-blue?style=flat-square&logo=google-chrome)](https://Kolium.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-cyan?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**Kolium** is a professional-grade hierarchical task management application designed for developers, product managers, and teams who need clarity in their workflow. Built with modern web technologies, it combines powerful organization with AI assistance to streamline your productivity.

🌐 **Project Website:** [Kolium.com](https://Kolium.com)

---

## ✨ Key Features

### 🧠 Intelligent Task Management
-   **Hierarchical Structure**: Break down complex projects into infinite levels of subtasks using our intuitive tree view.
-   **AI-Powered Assistance**: Generate detailed, actionable task descriptions automatically using OpenAI's advanced models (GPT-4o, o1-preview).
-   **Smart Context**: Improve grammar and clarity of your tasks with a single click.

### ⏱️ Time & Productivity
-   **Integrated Time Tracking**: Track time spent on individual tasks with built-in timers.
-   **Data-Driven Insights**: Visualize your productivity with detailed time reports and statistics.
-   **Import/Export**: detailed CSV export inclusive of time tracking data for external analysis.

### 🎨 Modern Experience
-   **Dual Views**: Switch seamlessly between hierarchical **Tree View** and Kanban-style **Board View**.
-   **Beautiful UI**: A premium, responsive design with smooth animations and comprehensive **Dark/Light mode** support.
-   **Multi-language**: Fully localized for **English** and **Spanish** users.

### 🔒 Enterprise Ready
-   **Secure Authentication**: Robust user management powered by Supabase Auth (`Email/Password`, `Google`, `GitHub`).
-   **Offline Capable**: Continue working even without internet; data syncs when you reconnect.

---

## 🚀 Getting Started

Follow these steps to set up Kolium locally.

### Prerequisites
-   [Node.js](https://nodejs.org/) (v18+)
-   [npm](https://www.npmjs.com/)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/kelvinCB/Task_Manager.git
    cd Task_Manager
    ```

2.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your keys:
    ```env
    SUPABASE_URL=your_project_url
    SUPABASE_KEY=your_anon_key
    OPENAI_API_KEY=your_openai_key
    ```

4.  **Setup Backend (Optional for Auth)**
    ```bash
    cd backend
    npm install
    cp .env.example .env
    # Configure backend/.env with SUPABASE_SERVICE_KEY
    ```

5.  **Run Development Servers**
    ```bash
    # Frontend (http://localhost:5173)
    npm run dev

    # Backend (http://localhost:3001)
    cd backend && npm run dev
    ```

---

## 🛠️ Tech Stack

-   **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
-   **Backend**: Node.js, Express, Supabase (PostgreSQL, Auth)
-   **AI**: OpenAI API Integration
-   **Testing**: Vitest, React Testing Library, Playwright

---

## 🤝 Contributing

We welcome contributions to Kolium!

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.