# How to Task MFM-Corp Agents to Build HRSifu Frontend

## Overview
MFM-Corp agents are invoked via Telegram bot. You need to send a message to the MFM Telegram bot to task the Frontend Developer agent.

## Step 1: Access MFM Telegram Bot
- Open Telegram
- Find the MFM Corporation bot (configured in your setup)
- Start a conversation with the bot

## Step 2: Task the Frontend Developer
Send this message to the bot:

```
Build the HRSifu web frontend. The backend API is already complete. I need a React + Tailwind CSS frontend with these pages: Dashboard, Employee Management, Employee Detail, Document Management, Sifu AI Chat, and Settings. Use the backend API endpoints documented in hrsifu-frontend-task.md. Push all code to the hrsifu-web GitHub repository.
```

## Step 3: Monitor the Process
The agent will:
1. Read the task specification from hrsifu-frontend-task.md
2. Build the React components
3. Create the file structure
4. Push code to GitHub using github-push tool
5. Confirm the GitHub URL when complete

## Step 4: Review the Delivered Code
Once the agent confirms completion:
1. Visit the GitHub repository
2. Review the frontend code
3. Check that all required files are present
4. Verify the code quality

## Step 5: Test the Application
1. Set up Cloudflare Pages deployment
2. Test the frontend locally
3. Test API integration
4. Test all features

## Alternative: More Specific Tasking
If you want more control, you can break it down:

```
Task 1: Build the Dashboard page with employee stats and quick actions
Task 2: Build the Employee Management page with CRUD operations
Task 3: Build the Sifu AI Chat interface
Task 4: Build the Settings page for API key configuration
```

## Notes
- The agent has access to the hrsifu-frontend-task.md document
- The agent will use github-push to deliver code
- The agent follows MFM coding standards
- Code is automatically pushed to GitHub
- You can monitor progress via Telegram
