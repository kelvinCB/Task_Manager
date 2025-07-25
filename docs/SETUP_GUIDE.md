# Setup Guide

## Installation

1. **Clone the Repository:**
   ```sh
   git clone https://github.com/kelvinCB/Task_Manager.git
   ```

2. **Navigate to the project directory:**
   ```sh
   cd Task_Manager
   ```

3. **Install Dependencies:**
   ```sh
   npm install
   ```

4. **Set Environment Variables:**
   ```sh
   cp .env.example .env
   ```
   Edit `.env` file with the appropriate API keys and configurations.

5. **Run the Development Server:**
   ```sh
   npm run dev
   ```

## Configuration

- Ensure Node.js v18 or higher is installed.
- Use npm or compatible package managers.

## Environment Setup

- Configure `.env` with sensitive information:
  ```
  VITE_OPENAI_API_KEY=your-openai-api-key-here
  VITE_OPENAI_MODEL=gpt-4
  VITE_OPENAI_BASE_URL=https://api.openai.com/v1
  ```


