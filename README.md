# The Trading Oasis 🌊📈

Welcome to **The Trading Oasis**, a full-stack prototype for investors and traders to explore market insights, track portfolios, and log trades — all in one streamlined app.  

This project was built from scratch on a **$0 budget**, so while the backend may have slight cold starts, everything else is ready to explore and enjoy. Don’t be shy — click around, try the features, and see what the app can do!  

**Live App:** [thetradingoasis.vercel.app](https://thetradingoasis.vercel.app)  
**Backend API Docs:** [Swagger / OpenAPI](https://9fhsjzmfui.us-east-1.awsapprunner.com/docs)

---

## Overview

The Trading Oasis is designed as a **prototype for active traders and investors**, combining real-time market data, sentiment analysis, and trade journaling. Built using **Next.js (Node.js), Tailwind CSS, TypeScript**, it showcases how a modern trading dashboard can work without requiring expensive infrastructure.  

This project serves as both a **working demo** and a **template** for developers interested in full-stack financial apps.

---

## Features

### 1. **Market Dashboard**
- Real-time stock quotes and market summaries
- Interactive charts using TradingView Lightweight Charts
- SMA-200 trend detection and sentiment analysis

### 2. **Customizable Watchlists**
- Add your favorite tickers
- Real-time updates on tracked assets
- WebSocket-enabled for instant market movements

### 3. **Trade Journal**
- Record trades with details like quantity, price, PnL
- Organize trades by date and symbol
- Add notes and attach photos for reference

### 4. **Portfolio Tracking**
- Track holdings across multiple trades
- Compute unrealized and realized gains
- Visual indicators for performance

### 5. **Setup Checklist**
- Step-by-step guides to set up trading strategies or reminders
- Personalized checklists to stay organized

### 6. **RESTful API**
- Built with **FastAPI**
- Provides endpoints for:
  - User authentication and profiles
  - Trade creation, updates, and queries
  - Portfolio and watchlist management
- API documentation is automatically generated and available [here](https://9fhsjzmfui.us-east-1.awsapprunner.com/docs)

---

## Backend / Frontend Architecture

- **Frontend:** Next.js + TypeScript + Tailwind CSS  
  - Responsive, fast, and interactive UI  
  - Communicates with backend via REST API  
- **Backend:** FastAPI + Uvicorn + Gunicorn, deployed on AWS App Runner  
  - Handles trades, portfolios, and user data  
  - Lightweight server with automatic OpenAPI docs  
- **Database:** Supabase (PostgreSQL)  
  - Persistent storage for trades, watchlists, and user info  

---

## Notes
- Built on a $0 budget, so backend may have **slight cold starts** — please be patient for first requests.  
- Fully functional, but still a **prototype**, so expect small tweaks and ongoing improvements.  
- The frontend is optimized for interactivity, but heavy analytics may take a moment to load.  

---

## Try it out!

- Visit the live app: [thetradingoasis.vercel.app](https://thetradingoasis.vercel.app)  
- Explore the **Swagger API**: [https://9fhsjzmfui.us-east-1.awsapprunner.com/docs](https://9fhsjzmfui.us-east-1.awsapprunner.com/docs)  
- Feel free to play with all features — add watchlists, log trades, and explore charts!  

---

Made with ❤️ by **David A.**

