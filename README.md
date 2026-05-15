# API Tester Pro 🚀

API Tester Pro is a comprehensive, dual-purpose testing suite built to bridge the gap between automated website crawling and deep manual API testing. Designed for QA engineers and developers, it provides an intuitive, high-performance interface for diagnosing application health.

## 🌟 Key Features

### 1. Comprehensive Manual Tester
A powerful interface to test individual APIs exactly like a developer would.
- **Request Builder:** Support for GET, POST, PUT, PATCH, and DELETE requests with dynamic headers and JSON body payloads.
- **Test Assertions:** Automatically validate your APIs. Set expected status codes, maximum response times, or require specific text in the response body.
- **Intelligent Error Analysis:** When a test fails, the built-in engine analyzes the response and provides actionable resolution suggestions (e.g., catching missing auth tokens or CORS errors).
- **Save & Load:** Save your complex API configurations to local storage so you don't have to retype them tomorrow.
- **Jira-Ready Dev Reports:** Click one button to export a beautifully formatted Markdown report containing the failed request, payload, error, and suggestions to send straight to your dev team.

### 2. Automated Web Crawler
An automated bot that navigates through your application to find hidden errors.
- Point the crawler at a starting URL, and it will navigate the site, intercepting background API calls to find 404s, 500s, and failing endpoints automatically.

---

## 🛠️ Tech Stack
- **Frontend:** React (Vite), JavaScript, CSS Modules, Lucide React (Icons)
- **Backend:** Node.js, Express, Playwright (for crawling), node-fetch
- **Database:** LocalStorage (for saved test cases)

---

## ⚙️ Configuration & Installation

Because this tool is split into a Frontend UI and a Backend Server, you need to run both simultaneously.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Start the Backend Server
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the server (it will run on port 3001):
   ```bash
   node server.js
   ```

### 2. Start the Frontend UI
1. Open a **new** terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to `http://localhost:5173/` to use the tool!

---

## 📝 License
This project was custom-built for internal QA and API testing workflows.
