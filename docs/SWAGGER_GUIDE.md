# Swagger Testing Guide 🚀

This guide explains how to use the local Swagger UI to test the API endpoints directly from your browser.

## Prerequisites

1.  Ensure the backend server is running:
    ```bash
    npm run dev
    # or
    npm start
    ```
2.  The server usually runs on `http://localhost:3001`.

## Accessing Swagger UI

1.  Open your browser.
2.  Navigate to: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)

You should see a web page listing all documented endpoints (Auth, Tasks, etc.).

## Switching Environments
Swagger allows you to test both Local and Production environments.

1.  Locate the **Servers** dropdown menu at the top of the Swagger page (labeled "Development server").
2.  Click the dropdown and select **Production server** (`https://task-manager-8p1p.onrender.com/api`).
3.  Any request you "Execute" will now be sent to the live production server.

## How to Test Endpoints

### 1. Authentication (Login)
Most endpoints are protected and require a JWT token. You must login first.

1.  Click on the **Auth** section to expand it.
2.  Click on the `POST /auth/login` endpoint.
3.  Click the **Try it out** button.
4.  Enter the test credentials in the JSON body:
    ```json
    {
      "email": "your-test-email@example.com",
      "password": "your-test-password"
    }
    ```
5.  Click **Execute**.
6.  Scroll down to the **Responses** section.
7.  Copy the `access_token` from the response body (without quote marks).

### 2. Authorize Swagger
1.  Scroll to the top of the Swagger page.
2.  Click the **Authorize** button (lock icon).
3.  In the `bearerAuth` (http, Bearer) box, enter the token you copied.
    *   **Note:** Just paste the token code. You do *not* need to type "Bearer" before it.
4.  Click **Authorize** and then **Close**.

Now you are "logged in" within Swagger.

### 3. Testing Protected Endpoints
Now you can test endpoints like `GET /tasks`.

1.  Expand the **Tasks** section.
2.  Click `GET /tasks`.
3.  Click **Try it out**.
4.  (Optional) Enter a status to filter by.
5.  Click **Execute**.
6.  View the JSON response below.

## Troubleshooting
-   **401 Unauthorized**: You forgot to click **Authorize** or your token has expired. Login again to get a fresh token.
-   **Network Error**: Ensure your backend server is running.
