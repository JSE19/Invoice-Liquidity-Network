# ILN Notification Service

A Node.js + Express backend service for sending Stellar ILN invoice notifications via email and webhook.

## Features

- Contract event polling from Stellar Horizon
- Subscription CRUD for email and webhook delivery
- Email delivery via Resend SDK
- Webhook delivery with retry and exponential backoff
- 48-hour due-date warning and overdue reminders

## Run

1. Copy `.env.example` to `.env`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start service:
   ```bash
   npm run dev
   ```
