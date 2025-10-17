# TaskFlow: Hierarchical Task Management



**TaskFlow** is a modern and intuitive web application for hierarchical task management, designed to help you organize your projects with clarity and efficiency. Built with **React, Vite, and Tailwind CSS**, this application offers a fast, responsive, and visually appealing user experience.

---

## ✨ Features

-   **Hierarchical Task Structure**: Organize your tasks in a tree-like structure with parents and sub-tasks, allowing for clear and detailed project planning.
-   **User Authentication**: Secure user registration and login system with email/password authentication.
-   **AI-Powered Task Assistant**: Generate detailed task descriptions automatically using OpenAI's language models.
-   **Intuitive User Interface**: A clean and modern design that makes task management easy and enjoyable.
-   **Task Status Tracking**: Easily track the status of each task (e.g., *Open*, *In Progress*, *Done*).
-   **Time Tracking**: Track time spent on tasks with built-in timer functionality.
-   **Import/Export with Time Data**: Export and import tasks while preserving all time tracking information.
-   **Filters and Search**: Quickly find the tasks you need with powerful filtering and search options.
-   **Dark/Light Theme**: Switch between dark and light themes for comfortable viewing.
-   **Responsive Design**: Fully functional on both desktop and mobile devices.

---

## 🚀 Installation and Setup

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   [npm](https://www.npmjs.com/) (or your preferred package manager like Yarn or pnpm)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/kelvinCB/Task_Manager.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd Task_Manager
    ```
3.  **Install the dependencies:**
    ```sh
    npm install
    ```
4.  **Set up environment variables:**
    ```sh
    cp .env.example .env
    ```
    Edit `.env` file and add your configuration:
    ```
    # Required for authentication
    SUPABASE_URL=your-supabase-project-url
    SUPABASE_KEY=your-supabase-anon-key
    
    # Optional for AI features
    OPENAI_API_KEY=your-openai-api-key-here
    VITE_OPENAI_MODEL=gpt-4o
    VITE_OPENAI_BASE_URL=https://api.openai.com/v1
    ```

5.  **Set up the backend (for authentication):**
    ```sh
    cd backend
    npm install
    cp .env.example .env
    ```
    Edit `backend/.env` file and add your Supabase configuration:
    ```
    SUPABASE_URL=your-supabase-project-url
    SUPABASE_KEY=your-supabase-service-key
    PORT=3001
    ```

6.  **Run the development servers:**
    ```sh
    # Terminal 1 - Frontend
    npm run dev
    
    # Terminal 2 - Backend
    cd backend
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

---

## 🤖 AI Features

### Task Description Generation

TaskFlow includes an AI-powered assistant that can automatically generate detailed task descriptions based on the task title. This feature uses OpenAI's language models to create actionable, comprehensive descriptions.

**Features:**
- Automatic task description generation
- Support for multiple OpenAI models (GPT-4, GPT-4 Turbo, O4 series)
- Smart parameter handling for different model types
- Error handling and fallback options

**Setup:**
1. Obtain an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add the key to your `.env` file as `OPENAI_API_KEY`
3. Optionally configure the model and base URL

**Usage:**
1. Open the task creation/edit form
2. Enter a task title
3. Click the AI icon (✨) next to the description field
4. Click "Add Description" to generate an AI-powered description

**Supported Models:**
- Standard GPT models: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`
- O4 series models: `o4-mini`, `o4-preview`
- Custom models (configure via `VITE_OPENAI_MODEL`)

---

## 🛠️ Technologies Used

### Frontend
-   **Framework:** [React](https://reactjs.org/) 18+ with TypeScript
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Icons:** [Lucide React](https://lucide.dev/guide/packages/lucide-react)
-   **Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
-   **E2E Testing:** [Playwright](https://playwright.dev/)

### Backend
-   **Runtime:** [Node.js](https://nodejs.org/)
-   **Framework:** [Express.js](https://expressjs.com/)
-   **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
-   **Authentication:** [Supabase Auth](https://supabase.com/docs/guides/auth)
-   **Testing:** [Jest](https://jestjs.io/) + [Supertest](https://github.com/visionmedia/supertest)

### AI Integration
-   **OpenAI API:** For task description generation
-   **Supported Models:** GPT-4, GPT-4 Turbo, O4 series

## 🧪 Testing

This project includes comprehensive testing at multiple levels:

### Frontend Testing
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:headed
```

### Backend Testing
```bash
# Navigate to backend directory
cd backend

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
- **Frontend:** 99 unit tests + 44 E2E tests (100% passing)
- **Backend:** 19 unit/integration tests (100% passing, 90.62% coverage)
- **E2E:** Complete user workflow testing with Playwright

---

## 🤝 How to Contribute

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.