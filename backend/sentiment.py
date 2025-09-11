# POST /api/sentiment

# Input:
# {
#   "headlines": [
#     "Stock X jumps 10%",
#     "Company Y reports losses"
#   ],
#   "ticker": "AAPL",
#   "model": "finbert-tone"
# }

# Output:
# {
#   "id": "uuid-generated-here",
#   "ticker": "AAPL",
#   "model_used": "finbert-tone",
#   "headlines": [
#     "Stock X jumps 10%",
#     "Company Y reports losses"
#   ],
#   "items": [
#     {
#       "headline": "Stock X jumps 10%",
#       "label": "positive",
#       "score": 0.92,
#       "high_confidence": true,
#       "model_used": "finbert-tone"
#     },
#     {
#       "headline": "Company Y reports losses",
#       "label": "negative",
#       "score": 0.85,
#       "high_confidence": true,
#       "model_used": "finbert-tone"
#     }
#   ],
#   "summary": {
#     "counts": {"positive": 1, "neutral": 0, "negative": 1},
#     "percentages": {"positive": 50.0, "neutral": 0.0, "negative": 50.0},
#     "total": 2
#   }
# }

# -- Sentiment Analysis Table
# create table if not exists sentiment_results (
#     id text primary key,                       -- cryptographic id generated in FastAPI
#     ticker text not null,                      -- stock ticker
#     model_used text not null,                  -- sentiment model used
#     headlines jsonb not null,                  -- array of input headlines
#     items jsonb not null,                      -- structured items returned by model
#     summary jsonb not null,                    -- sentiment summary
#     created_at timestamptz default now()
# );

# -- Ensure that ticker + model_used is unique (only one record per pair)
# create unique index if not exists sentiment_results_ticker_model_idx
#     on sentiment_results (ticker, model_used);

# Supabase Scheduler:

# create or replace function clean_old_sentiment_results()
# returns void language plpgsql as $$
# begin
#   delete from sentiment_results
#   where created_at < now() - interval '1 day';
# end;
# $$;

# select cron.schedule('0 0 * * *', 'select clean_old_sentiment_results();');

# Render:

# requirements.txt
# fastapi
# uvicorn[standard]
# supabase
# pydantic
# transformers
# torch
# numpy

# | Operation  | Endpoint                       | Notes                                     |
# | ---------- | ------------------------------ | ----------------------------------------- |
# | **Create** | `POST /api/sentiment`          | Analyze and store sentiment, returns UUID |
# | **Read**   | `GET /api/sentiment/{uuid}`    | Retrieve stored summary by UUID           |
# | **Update** | `PUT /api/sentiment/{uuid}`    | Update metadata, i.e headlines or model   |
# | **Delete** | `DELETE /api/sentiment/{uuid}` | Delete a stored summary                   |

# backend/sentiment_api.py
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from transformers import pipeline
import uuid
from supabase import create_client, Client
import os

# ------------------------
# Supabase client
# ------------------------

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase environment variables not set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ------------------------
# API Key validation
# ------------------------
VALID_API_KEYS = {
    "a4c9f2e1-5b7d-4a8f-9e3c-1d2b6f7a8c9e",
    "7f2d1c4b-8e6a-4d3f-9b1c-2a5e7d6f8b9c",
    "d8b3a2f1-6c5e-4b7d-9a3f-1e2c4d6b8f9a",
    "c1f7e8d2-4b6a-4c9e-8b2d-3a1f5e7c9b6d",
    "9a6c3f1b-2e8d-4a7f-9c5b-1d2e7f6a8b3c"
}

def check_api_key(x_api_key: str = Header(...)):
    if x_api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid API Key")

# ------------------------
# FastAPI setup
# ------------------------
app = FastAPI(
    title="📈 Financial Sentiment API",
    version="1.0.0",
    description="""
Analyze financial news headlines with **FinBERT**  
to extract **positive, neutral, or negative sentiment**.

### Features
- 📰 Headline sentiment scoring  
- 📊 Summary counts and percentages  
- 🔄 Update / Delete functionality  
- ⏳ Records automatically expire after 24 hours  
- 🔑 Secured with API keys  

### Model
- **finbert-tone** → `ProsusAI/finbert`
    """,
)

# ------------------------
# CORS
# ------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
    allow_credentials=True,
    allow_methods=["GET","POST","PUT","DELETE"],
    allow_headers=["*"],
)

# ------------------------
# Request and Response models
# ------------------------

class SentimentRequest(BaseModel):
    ticker: Optional[str] = Field(None, description="Ticker symbol (required for POST)")
    headlines: List[str] = Field(..., description="List of news headlines to analyze")

class SentimentItem(BaseModel):
    headline: str = Field(..., description="Original headline text")
    label: str = Field(..., description="Predicted sentiment (positive/neutral/negative)")
    score: float = Field(..., description="Confidence score (0.0–1.0)")
    high_confidence: bool = Field(..., description="Whether score passes confidence threshold")
    model_used: str = "finbert-tone"

class SentimentSummary(BaseModel):
    counts: Dict[str, int] = Field(..., description="Raw counts per sentiment")
    percentages: Dict[str, float] = Field(..., description="Percentages per sentiment")
    total: int = Field(..., description="Total number of headlines analyzed")

class SentimentResponse(BaseModel):
    id: str = Field(..., description="Unique identifier of the sentiment record")
    ticker: str = Field(..., description="Associated stock ticker")
    model_used: str = "finbert-tone"
    headlines: List[str] = Field(..., description="Headlines analyzed")
    items: List[SentimentItem] = Field(..., description="Per-headline sentiment results")
    summary: SentimentSummary = Field(..., description="Aggregated summary results")

# ------------------------
# Load model
# ------------------------
MODEL = "ProsusAI/finbert"
nlp = pipeline("sentiment-analysis", model=MODEL, tokenizer=MODEL)

# ------------------------
# Helper: sentiment analysis
# ------------------------
def analyze_headlines(headlines: List[str], min_score: float = 0.7):
    preds = nlp(headlines)
    items = []
    for text, p in zip(headlines, preds):
        score = float(p["score"])
        label = p["label"].lower() if score >= min_score else "neutral"
        high_confidence = score >= min_score
        items.append({
            "headline": text,
            "label": label,
            "score": score if high_confidence else 0.0,
            "high_confidence": high_confidence,
            "model_used": "finbert-tone"
        })

    counts = {"positive":0, "neutral":0, "negative":0}
    for r in items:
        counts[r["label"]] += 1
    total = sum(counts.values()) or 1
    percentages = {k: round(v*100/total,1) for k,v in counts.items()}
    summary = {"counts": counts, "percentages": percentages, "total": total}

    return items, summary

# ------------------------
# CRUD Endpoints
# ------------------------
@app.post("/api/sentiment", response_model=SentimentResponse, summary="Create Sentiment Record")
def create_sentiment(body: SentimentRequest, x_api_key: str = Header(...)):
    check_api_key(x_api_key)
    if not body.headlines or not body.ticker:
        raise HTTPException(status_code=400, detail="headlines and ticker are required")

    items, summary = analyze_headlines(body.headlines)

    # Delete existing records for this ticker
    supabase.table("sentiment_results").delete().eq("ticker", body.ticker).execute()

    new_id = str(uuid.uuid4())
    record = {
        "id": new_id,
        "ticker": body.ticker,
        "model_used": "finbert-tone",
        "headlines": body.headlines,
        "items": items,
        "summary": summary
    }
    supabase.table("sentiment_results").insert(record).execute()
    return record

@app.get("/api/sentiment/{id}", response_model=SentimentResponse, summary="Retrieve Sentiment Record")
def get_sentiment(id: str, x_api_key: str = Header(...)):
    check_api_key(x_api_key)
    existing = supabase.table("sentiment_results").select("*").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Sentiment not found")
    return existing.data[0]

@app.put("/api/sentiment/{id}", response_model=SentimentResponse, summary="Update Sentiment Record")
def update_sentiment(id: str, body: SentimentRequest, x_api_key: str = Header(...)):
    check_api_key(x_api_key)
    if not body.headlines:
        raise HTTPException(status_code=400, detail="headlines are required")

    existing = supabase.table("sentiment_results").select("*").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Sentiment not found")
    record = existing.data[0]

    if body.headlines == record["headlines"]:
        return record

    items, summary = analyze_headlines(body.headlines)

    supabase.table("sentiment_results").delete().eq("id", id).execute()
    new_id = str(uuid.uuid4())
    updated = {
        "id": new_id,
        "ticker": record["ticker"],
        "model_used": "finbert-tone",
        "headlines": body.headlines,
        "items": items,
        "summary": summary
    }
    supabase.table("sentiment_results").insert(updated).execute()
    return updated

@app.delete("/api/sentiment/{id}", summary="Delete Sentiment Record")
def delete_sentiment(id: str, x_api_key: str = Header(...)):
    check_api_key(x_api_key)
    existing = supabase.table("sentiment_results").select("*").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Sentiment not found")
    supabase.table("sentiment_results").delete().eq("id", id).execute()
    return {"detail": "Deleted successfully"}


# uses the pick from two models methods
# backend/sentiment_api.py
# from fastapi import FastAPI, HTTPException, Header
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel, Field
# from typing import List, Dict, Optional
# from transformers import pipeline
# import numpy as np
# import uuid
# from supabase import create_client, Client

# # ------------------------
# # Supabase client
# # ------------------------
# SUPABASE_URL = "https://YOUR_SUPABASE_URL"
# SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"
# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# # ------------------------
# # API Key validation
# # ------------------------
# VALID_API_KEYS = {"my-secret-key"}  # Replace with your key
# def check_api_key(x_api_key: str = Header(...)):
#     if x_api_key not in VALID_API_KEYS:
#         raise HTTPException(status_code=401, detail="Invalid API Key")

# # ------------------------
# # FastAPI setup with metadata
# # ------------------------
# app = FastAPI(
#     title="📈 Financial Sentiment API",
#     version="1.0.0",
#     description="""
# Analyze financial news headlines with **FinBERT** models  
# to extract **positive, neutral, or negative sentiment**.  

# ### Features
# - 📰 Headline sentiment scoring  
# - 📊 Summary counts and percentages  
# - 🔄 Update / Delete functionality  
# - ⏳ **Records automatically expire after 24 hours**  
# - 🔑 Secured with API keys  

# ### Models
# - **finbert-tone** → `ProsusAI/finbert`  
# - **finbert-old** → `yiyanghkust/financial-roberta-base-sentiment`  
# - **both** → runs both models and ensembles results
#     """,
#     contact={
#         "name": "Trading API Team",
#         "url": "https://your-company-site.com",
#         "email": "support@your-company.com",
#     },
#     license_info={
#         "name": "MIT License",
#         "url": "https://opensource.org/licenses/MIT",
#     },
# )

# # ------------------------
# # CORS
# # ------------------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # adjust in production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ------------------------
# # Request and Response models
# # ------------------------
# class SentimentRequest(BaseModel):
#     headlines: Optional[List[str]] = Field(
#         None, description="List of news headlines to analyze"
#     )
#     model: Optional[str] = Field(
#         None, description="Which model to use: 'finbert-tone', 'finbert-old', or 'both'"
#     )
#     ticker: Optional[str] = Field(
#         None, description="Ticker symbol (required for POST)"
#     )


# class SentimentItem(BaseModel):
#     headline: str = Field(..., description="Original headline text")
#     label: str = Field(..., description="Predicted sentiment (positive/neutral/negative)")
#     score: float = Field(..., description="Confidence score (0.0–1.0)")
#     high_confidence: bool = Field(..., description="Whether score passes confidence threshold")
#     model_used: str = Field(..., description="Model actually used for prediction")


# class SentimentSummary(BaseModel):
#     counts: Dict[str, int] = Field(..., description="Raw counts per sentiment")
#     percentages: Dict[str, float] = Field(..., description="Percentages per sentiment")
#     total: int = Field(..., description="Total number of headlines analyzed")


# class SentimentResponse(BaseModel):
#     id: str = Field(..., description="Unique identifier of the sentiment record")
#     ticker: str = Field(..., description="Associated stock ticker")
#     model_used: str = Field(..., description="Model actually applied")
#     headlines: List[str] = Field(..., description="Headlines analyzed")
#     items: List[SentimentItem] = Field(..., description="Per-headline sentiment results")
#     summary: SentimentSummary = Field(..., description="Aggregated summary results")

# # ------------------------
# # Load models
# # ------------------------
# MODEL_OLD = "yiyanghkust/financial-roberta-base-sentiment"
# MODEL_NEW = "ProsusAI/finbert"

# nlp_old = pipeline("sentiment-analysis", model=MODEL_OLD, tokenizer=MODEL_OLD)
# nlp_new = pipeline("sentiment-analysis", model=MODEL_NEW, tokenizer=MODEL_NEW)

# # ------------------------
# # Helper: ensemble analysis
# # ------------------------
# def analyze_headlines(headlines: List[str], model_choice: str, min_score: float = 0.7):
#     """
#     Run FinBERT sentiment analysis on headlines using specified model(s).
#     Returns:
#         - items: list of dicts per headline with label, score, high_confidence, model_used
#         - summary: dict with counts, percentages, total
#         - model_used: actual model applied ("finbert-old", "finbert-tone", "both")
#     """
#     run_old = model_choice in ("finbert-old", "both")
#     run_new = model_choice in ("finbert-tone", "both")

#     preds_old = nlp_old(headlines) if run_old else [None]*len(headlines)
#     preds_new = nlp_new(headlines) if run_new else [None]*len(headlines)

#     items = []
#     for text, p_old, p_new in zip(headlines, preds_old, preds_new):
#         labels = []
#         scores = []

#         if p_old and p_old["score"] >= min_score:
#             labels.append(p_old["label"].lower())
#             scores.append(p_old["score"])
#         if p_new and p_new["score"] >= min_score:
#             labels.append(p_new["label"].lower())
#             scores.append(p_new["score"])

#         if labels:
#             final_label = max(set(labels), key=labels.count)
#             final_score = float(np.mean(scores))
#             model_used = "both" if len(labels) == 2 else ("finbert-old" if p_old else "finbert-tone")
#         else:
#             final_label = "neutral"
#             final_score = 0.0
#             model_used = model_choice

#         items.append({
#             "headline": text,
#             "label": final_label,
#             "score": final_score,
#             "high_confidence": final_score >= min_score,
#             "model_used": model_used
#         })

#     # Summarize
#     counts = {"positive":0, "neutral":0, "negative":0}
#     for r in items:
#         counts[r["label"]] += 1
#     total = sum(counts.values()) or 1
#     percentages = {k: round(v*100/total,1) for k,v in counts.items()}
#     summary = {"counts": counts, "percentages": percentages, "total": total}

#     return items, summary, model_used

# # ------------------------
# # CRUD Endpoints
# # ------------------------

# @app.post(
#     "/api/sentiment",
#     response_model=SentimentResponse,
#     summary="Create Sentiment Record",
#     description="""
# Analyze headlines for a specific ticker and store results in Supabase.  
# If a record for the same `ticker+model_used` exists, it will be replaced.  

# ⏳ **Note:** Sentiment records automatically expire after 24 hours.
#     """,
#     tags=["Sentiment"],
#     responses={
#         401: {"description": "Invalid API Key"},
#         400: {"description": "Missing required fields"},
#     },
# )
# def create_sentiment(body: SentimentRequest, x_api_key: str = Header(...)):
#     check_api_key(x_api_key)

#     if not body.headlines or not body.ticker or not body.model:
#         raise HTTPException(status_code=400, detail="headlines, ticker, and model are required")

#     items, summary, model_used = analyze_headlines(body.headlines, body.model)

#     supabase.table("sentiment_results").delete().eq("ticker", body.ticker).eq("model_used", model_used).execute()

#     new_id = str(uuid.uuid4())
#     record = {
#         "id": new_id,
#         "ticker": body.ticker,
#         "model_used": model_used,
#         "headlines": body.headlines,
#         "items": items,
#         "summary": summary
#     }
#     supabase.table("sentiment_results").insert(record).execute()
#     return record

# @app.get(
#     "/api/sentiment/{id}",
#     response_model=SentimentResponse,
#     summary="Retrieve Sentiment Record",
#     description="""
# Fetch a previously analyzed sentiment record by its unique ID.  

# ⏳ **Note:** Records older than 24 hours are automatically deleted.
#     """,
#     tags=["Sentiment"],
#     responses={
#         401: {"description": "Invalid API Key"},
#         404: {"description": "Sentiment not found"},
#     },
# )
# def get_sentiment(id: str, x_api_key: str = Header(...)):
#     check_api_key(x_api_key)
#     existing = supabase.table("sentiment_results").select("*").eq("id", id).execute()
#     if not existing.data:
#         raise HTTPException(status_code=404, detail="Sentiment not found")
#     return existing.data[0]

# @app.put(
#     "/api/sentiment/{id}",
#     response_model=SentimentResponse,
#     summary="Update Sentiment Record",
#     description="""
# Update headlines or model for an existing sentiment record.  
# Re-runs sentiment analysis if changes are detected.  

# ⏳ **Note:** Updated records also expire after 24 hours.
#     """,
#     tags=["Sentiment"],
#     responses={
#         401: {"description": "Invalid API Key"},
#         404: {"description": "Sentiment not found"},
#         400: {"description": "No changes detected"},
#     },
# )
# def update_sentiment(id: str, body: SentimentRequest, x_api_key: str = Header(...)):
#     check_api_key(x_api_key)

#     if body.headlines is None and body.model is None:
#         raise HTTPException(status_code=400, detail="At least one of headlines or model must be provided")

#     existing = supabase.table("sentiment_results").select("*").eq("id", id).execute()
#     if not existing.data:
#         raise HTTPException(status_code=404, detail="Sentiment not found")
#     record = existing.data[0]

#     headlines_changed = body.headlines is not None and body.headlines != record["headlines"]
#     model_changed = body.model is not None and body.model != record["model_used"]

#     if not headlines_changed and not model_changed:
#         return record

#     new_headlines = body.headlines if body.headlines is not None else record["headlines"]
#     new_model = body.model if body.model is not None else record["model_used"]

#     items, summary, model_used = analyze_headlines(new_headlines, new_model)

#     supabase.table("sentiment_results").delete().eq("ticker", record["ticker"]).eq("model_used", record["model_used"]).execute()

#     new_id = str(uuid.uuid4())
#     updated = {
#         "id": new_id,
#         "ticker": record["ticker"],
#         "model_used": model_used,
#         "headlines": new_headlines,
#         "items": items,
#         "summary": summary
#     }
#     supabase.table("sentiment_results").insert(updated).execute()
#     return updated

# @app.delete(
#     "/api/sentiment/{id}",
#     summary="Delete Sentiment Record",
#     description="""
# Remove a sentiment record permanently by ID.  

# ⏳ **Note:** Records also auto-expire after 24 hours even if not deleted manually.
#     """,
#     tags=["Sentiment"],
#     responses={
#         401: {"description": "Invalid API Key"},
#         404: {"description": "Sentiment not found"},
#     },
# )
# def delete_sentiment(id: str, x_api_key: str = Header(...)):
#     check_api_key(x_api_key)
#     existing = supabase.table("sentiment_results").select("*").eq("id", id).execute()
#     if not existing.data:
#         raise HTTPException(status_code=404, detail="Sentiment not found")
#     supabase.table("sentiment_results").delete().eq("id", id).execute()
#     return {"detail": "Deleted successfully"}



























































































# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel
# from typing import List, Dict
# from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

# app = FastAPI()

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Request model
# class SentimentRequest(BaseModel):
#     headlines: List[str]

# # Load FinBERT once
# MODEL_NAME = "ProsusAI/finbert"
# tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
# model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
# nlp = pipeline(
#     "sentiment-analysis", # type: ignore
#     model=model, 
#     tokenizer=tokenizer)

# # Summarize predictions
# def summarize(results: List[Dict], min_confidence: float = 0.6) -> Dict:
#     counts = {"positive": 0, "neutral": 0, "negative": 0}
#     for r in results:
#         lbl = r["label"].lower()
#         if lbl in counts and r["score"] >= min_confidence:
#             counts[lbl] += 1
#     total = sum(counts.values())
#     if total == 0:
#         percentages = None  # or {"positive": 0, "neutral": 0, "negative": 0} plus a flag
#     else:
#         percentages = {k: round(v * 100 / total, 1) for k, v in counts.items()}

#     return {"counts": counts, "percentages": percentages, "total": total}

# @app.post("/api/sentiment")
# def analyze_sentiment(body: SentimentRequest):
#     if not body.headlines:
#         raise HTTPException(status_code=400, detail="headlines cannot be empty")

#     preds = nlp(body.headlines)
#     # Apply confidence filter (>60%)
#     items = [
#         {"text": text, "label": p["label"].lower(), "score": float(p["score"])}
#         for text, p in zip(body.headlines, preds)
#         if p["score"] >= 0.6
#     ]
#     summary = summarize(items)
#     return JSONResponse(content={"items": items, "summary": summary})


# from fastapi import FastAPI, HTTPException
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel
# from typing import List, Dict
# import numpy as np
# from transformers import pipeline

# # Model 1: old FinBERT
# MODEL_OLD = "yiyanghkust/financial-roberta-base-sentiment"
# nlp_old = pipeline(
#     "sentiment-analysis", # type:ignore
#     model=MODEL_OLD,
#     tokenizer=MODEL_OLD
# )

# # Model 2: newer FinBERT
# MODEL_NEW = "ProsusAI/finbert"
# nlp_new = pipeline(
#     "sentiment-analysis", # type:ignore
#     model=MODEL_NEW,
#     tokenizer=MODEL_NEW
# )

# app = FastAPI()

# class SentimentRequest(BaseModel):
#     headlines: List[str]

# @app.post("/api/sentiment")
# def analyze_sentiment(body: SentimentRequest):
#     if not body.headlines:
#         raise HTTPException(status_code=400, detail="headlines cannot be empty")
    
#     items = ensemble_sentiment(body.headlines)
    
#     # Summarize counts and percentages
#     counts = {"positive": 0, "neutral": 0, "negative": 0}
#     for r in items:
#         counts[r["label"]] += 1
#     total = sum(counts.values()) or 1
#     percentages = {k: round(v * 100 / total, 1) for k, v in counts.items()}
    
#     summary = {"counts": counts, "percentages": percentages, "total": total}
    
#     return JSONResponse(content={"items": items, "summary": summary})

# def ensemble_sentiment(headlines: List[str], min_score: float = 0.7) -> List[Dict]:
#     results_old = nlp_old(headlines)
#     results_new = nlp_new(headlines)
    
#     ensembled = []
    
#     for text, res_old, res_new in zip(headlines, results_old, results_new):
#         # Only consider predictions above confidence threshold
#         labels = []
#         scores = []
#         if res_old["score"] >= min_score:
#             labels.append(res_old["label"].lower())
#             scores.append(res_old["score"])
#         if res_new["score"] >= min_score:
#             labels.append(res_new["label"].lower())
#             scores.append(res_new["score"])
        
#         if labels:
#             # Majority vote (or fallback to highest score if tie)
#             final_label = max(set(labels), key=labels.count)
#             final_score = float(np.mean(scores))
#         else:
#             final_label = "neutral"  # fallback if no high-confidence prediction
#             final_score = 0.0

#         ensembled.append({
#             "text": text,
#             "label": final_label,
#             "score": final_score
#         })
        
#     return ensembled

# # backend/sentiment.py
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel
# from typing import List, Dict
# from transformers import pipeline

# app = FastAPI()

# # ✅ CORS settings (allow Next.js dev server)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ✅ Request model
# class SentimentRequest(BaseModel):
#     headlines: List[str]

# # ✅ Load FinBERT once at startup
# MODEL_NAME = "yiyanghkust/finbert-tone"
# nlp = pipeline(
#     "sentiment-analysis",  # type: ignore
#     model=MODEL_NAME,
#     tokenizer=MODEL_NAME
# )

# # ✅ Helper to summarize (only include predictions with score > 0.6)
# def summarize(results: List[Dict], min_score: float = 0.6) -> Dict:
#     counts = {"positive": 0, "neutral": 0, "negative": 0}
#     for r in results:
#         if r["score"] >= min_score:
#             lbl = r["label"].lower()
#             if lbl in counts:
#                 counts[lbl] += 1
#     total = sum(counts.values()) or 1
#     percentages = {k: round(v * 100 / total, 1) for k, v in counts.items()}
#     return {"counts": counts, "percentages": percentages, "total": total}

# # ✅ POST endpoint
# @app.post("/api/sentiment")
# def analyze_sentiment(body: SentimentRequest):
#     if not body.headlines:
#         raise HTTPException(status_code=400, detail="headlines cannot be empty")

#     preds = nlp(body.headlines)
#     items = [
#         {"text": text, "label": p["label"].lower(), "score": float(p["score"])}
#         for text, p in zip(body.headlines, preds)
#     ]
#     summary = summarize(items, min_score=0.75)  # only high-confidence predictions
#     return JSONResponse(content={"items": items, "summary": summary})
