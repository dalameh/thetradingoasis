
<p align="center">
  <img src="https://github.com/user-attachments/assets/8eeadb11-104a-4f4a-8e3c-9512adcd6148" width="400" height="400" alt="Copilot_20250730_140521-Photoroom" />
</p>

# The Trading Oasis 🌊📈


Welcome to **The Trading Oasis**, a comprehensive trading and portfolio management app for investors and traders to explore market insights, track holdings, and log trades — all in one polished, interactive platform.  

While optimized for laptop/desktop, the app is fully **responsive and compatible with tablets and smartphones**, providing a seamless experience across devices.  

This project was built from scratch on a **$0 budget**, so you may notice a slight cold start from frontend and backend deployed APIs, but everything else is ready to explore and enjoy. Don’t be shy — click around, try the features, and see what the app can do!  

**Live App:** [thetradingoasis.vercel.app](https://thetradingoasis.vercel.app)  
**Backend API Docs:** [Swagger / OpenAPI](https://63hik2jr4c.us-east-1.awsapprunner.com/docs)

---

## Overview

The Trading Oasis is designed for **active traders and investors**, combining real-time market data, sentiment analysis, and trade journaling.  

Leveraging a **modern full-stack architecture**, the frontend uses **Next.js (React + Node.js), TypeScript, and Tailwind CSS** for a responsive, dynamic interface, while the backend employs **FastAPI (Python) with Supabase (PostgreSQL)** for reliable and scalable data management.  

This project serves as both a **working demo** and a **template** for developers interested in building full-stack financial apps.

---

## Features

### 1. **Admin Dashboard**
- Manage and monitor all aspects of the app  
- Quick overview of user activity, trades, and portfolios  
- Central hub for key analytics

<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/9e1daf9a-ddfe-4844-8911-0b2e970805d8" />

### 2. **Market Charts**
- Interactive TradingView Lightweight Charts  
- Visualize price trends and SMA-200 indicators  
- Supports candlestick and area chart views

<img width="1919" height="820" alt="image" src="https://github.com/user-attachments/assets/b3632739-54eb-46d4-9211-9c3e567a2d88" />

### 3. **News & Headlines**
- View real-time market headlines and updates  
- Quickly assess market sentiment

### 4. **Watchlist**
- View real-time market data using Websocket 
- Personalized stock list
- Spaklines, % Change, Quick Actions

<img width="1919" height="820" alt="image" src="https://github.com/user-attachments/assets/d9ad7efe-34bd-48f4-be35-5681dea83558" />

### 5. **Trade Diary**
- Record trades with details like quantity, price, and PnL  
- Organize trades by date, symbol, or portfolio  
- Add notes and photos for reference  

### 6. **Playbook / Setup Checklist**
- Create step-by-step trading guides or personal checklists  
- Helps structure strategies and recurring tasks

<img width="1919" height="820" alt="image" src="https://github.com/user-attachments/assets/7d935d3f-bcd4-438f-b9f0-f17f490c5157" />

### 7. **Technical Scans**
- Utilizing data anlaysis and supervised machine learning (KMeans) -- Scan assets for market regimes (bullish/netural/bearish)
- Identify trends, SMA-50 & SMA-200 crossovers

<img width="1919" height="400" alt="image" src="https://github.com/user-attachments/assets/7cbb9885-04db-47c9-b350-980f1dc55a51" />

### 8. **Headline Sentiment RESTful API**
- Built with **FastAPI**  
- Endpoints for Headline Sentiment Analysis (CRUD Operations)
- API documentation automatically available [here](https://63hik2jr4c.us-east-1.awsapprunner.com/docs)

<img width="1919" height="820" alt="image" src="https://github.com/user-attachments/assets/4dbfc0ea-8d0d-45f3-bade-586b38fd51e8" />

---

## Backend / Frontend Architecture

- **Frontend:** Next.js + TypeScript + Tailwind CSS  
  - Responsive, fast, and interactive UI  
  - Communicates with backend via REST API  
  
- **Backend:** 
  - FastAPI + Uvicorn + Gunicorn, deployed on AWS App Runner 
  - Containerized and deployed multiple FastAPI microservices on AWS ECR and ECS
  - Built Docker workflows with automated image tagging and secure authentication
  - Managed API routing, environment variables, and scaling for production-ready services
  - Implemented CI/CD pipelines to streamline updates and ensure reliable uptime

- **Database:** Supabase (PostgreSQL)  
  - Persistent storage for trades, watchlists, and user info  

---

## Notes
- Built on a $0 budget, so backend may have **slight cold starts** — please be patient for first requests.  
- Fully functional, but still a **prototype**, so expect small tweaks and ongoing improvements.  
- The frontend is fully optimized for interactivity.

---

## Try it out!

- Visit the live app: [thetradingoasis.vercel.app](https://thetradingoasis.vercel.app)  
- Explore the **Swagger API**: Docs:** [Swagger / OpenAPI](https://63hik2jr4c.us-east-1.awsapprunner.com/docs)

- Feel free to play with all features — add watchlists, log trades, and explore charts!  

---

Made with ❤️ by **David A.**

