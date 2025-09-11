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
from fastapi import FastAPI, HTTPException, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid
from supabase import create_client, Client
import os
import requests

# ------------------------
# Supabase client setup
# ------------------------
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
HF_API_TOKEN = os.environ.get("HF_API_TOKEN")
VALID_SENTIMENT_API_KEY = os.environ.get("SENTIMENT_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase environment variables not set")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ------------------------
# Hugging Face API client
# ------------------------
HF_API_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert"
if not HF_API_TOKEN:
    raise RuntimeError("HF_API_TOKEN not set in environment variables")
headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

def query_huggingface(headlines: List[str]):
    response = requests.post(HF_API_URL, headers=headers, json={"inputs": headlines})
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"HuggingFace API error: {response.text}")
    return response.json()

# ------------------------
# API Key validation
# ------------------------
VALID_API_KEYS = {VALID_SENTIMENT_API_KEY}

def check_api_key(x_api_key: str = Header(...)):
    if x_api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid API Key")

# ------------------------
# FastAPI setup
# ------------------------
app = FastAPI(
    title="📈 Financial Sentiment API",
    version="2.4.0",
    description="""
Analyze financial news headlines with **FinBERT**.

### Features
- 📰 Returns detailed sentiment predictions for each headline.
- 🎯 Users can set `min_confidence` to filter which predictions count in the summary.
- 📊 Summary only counts high-confidence predictions.
- 💾 CRUD operations are stored in Supabase.
- ⏳ Resources remain active for only 12 hours.
- 🔑 Secured with API keys.
"""
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------
# Pydantic models
# ------------------------
class SentimentRequest(BaseModel):
    ticker: Optional[str] = Field(None, description="Stock ticker symbol (required for POST)", example="AAPL")
    headlines: List[str] = Field(
        ...,
        description="List of news headlines to analyze",
        example=[
            "Apple stock jumps after record iPhone sales",
            "Investors worry about Apple supply chain issues"
        ]
    )
    min_confidence: Optional[float] = Field(0.7, description="Minimum score for high-confidence predictions", example=0.7)

class SentimentItem(BaseModel):
    headline: str = Field(..., example="Apple stock jumps after record iPhone sales")
    label: str = Field(..., example="positive")
    score: float = Field(..., example=0.93)
    high_confidence: bool = Field(..., example=True)
    model_used: str = Field("finbert-tone", example="finbert-tone")

class SentimentSummary(BaseModel):
    counts: Dict[str, int] = Field(..., example={"positive": 1, "neutral": 0, "negative": 1})
    percentages: Dict[str, float] = Field(..., example={"positive": 50.0, "neutral": 0.0, "negative": 50.0})
    total: int = Field(..., example=2)

class SentimentResponse(BaseModel):
    id: str = Field(..., example="d1f3e8a0-8b2c-4e9b-b1f2-7a9c5d6e4f12")
    ticker: str = Field(..., example="AAPL")
    model_used: str = Field("finbert-tone", example="finbert-tone")
    headlines: List[str] = Field(
        ...,
        example=[
            "Apple stock jumps after record iPhone sales",
            "Investors worry about Apple supply chain issues"
        ]
    )
    items: List[SentimentItem]
    summary: SentimentSummary
    min_confidence: float = Field(..., example=0.7)

# ------------------------
# Helper function
# ------------------------
def analyze_headlines(headlines: List[str], min_confidence: float = 0.7):
    preds = query_huggingface(headlines)
    items = []
    pred_list = preds[0]
    if not isinstance(pred_list, list):
        pred_list = [pred_list]
    for p in pred_list:
        score = float(p["score"])
        items.append({
            "headline": p["headline"],
            "label": p["label"].lower(),
            "score": score,
            "high_confidence": score >= min_confidence,
    })
        
    counts = {"positive":0, "neutral":0, "negative":0}
    for item in items:
        if item["high_confidence"]:
            counts[item["label"]] += 1
    total = sum(counts.values()) or 1
    percentages = {k: round(v*100/total,1) for k,v in counts.items()}
    summary = {"counts": counts, "percentages": percentages, "total": total}
    return items, summary

# ------------------------
# CRUD Endpoints
# ------------------------
@app.post(
    "/api/sentiment",
    response_model=SentimentResponse,
    summary="Analyze headlines and store results",
    responses={
        200: {
            "description": "Sentiment analysis created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "d1f3e8a0-8b2c-4e9b-b1f2-7a9c5d6e4f12",
                        "ticker": "AAPL",
                        "model_used": "finbert-tone",
                        "headlines": [
                            "Apple stock jumps after record iPhone sales",
                            "Investors worry about Apple supply chain issues"
                        ],
                        "items": [
                            {
                                "headline": "Apple stock jumps after record iPhone sales",
                                "label": "positive",
                                "score": 0.93,
                                "high_confidence": True,
                            },
                            {
                                "headline": "Investors worry about Apple supply chain issues",
                                "label": "negative",
                                "score": 0.88,
                                "high_confidence": True,
                            }
                        ],
                        "summary": {
                            "counts": {"positive": 1, "neutral": 0, "negative": 1},
                            "percentages": {"positive": 50.0, "neutral": 0.0, "negative": 50.0},
                            "total": 2
                        },
                        "min_confidence": 0.7
                    }
                }
            },
        }
    }
)
def create_sentiment(
    body: SentimentRequest = Body(..., example={
        "ticker": "AAPL",
        "headlines": [
            "Apple stock jumps after record iPhone sales",
            "Investors worry about Apple supply chain issues"
        ],
        "min_confidence": 0.7
    }),
    x_api_key: str = Header(...)
):
    check_api_key(x_api_key)
    if not body.headlines or not body.ticker:
        raise HTTPException(status_code=400, detail="headlines and ticker are required")
    
    items, summary = analyze_headlines(body.headlines, body.min_confidence)
    new_id = str(uuid.uuid4())
    record = {"id": new_id, "ticker": body.ticker, "model_used":"finbert-tone",
              "headlines": body.headlines, "items": items, "summary": summary,
              "min_confidence": body.min_confidence}
    
    supabase.table("sentiment_results").insert(record).execute()
    return record


@app.get(
    "/api/sentiment/{id}",
    response_model=SentimentResponse,
    summary="Fetch sentiment by ID",
    responses={
        200: {
            "description": "Sentiment record retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "d1f3e8a0-8b2c-4e9b-b1f2-7a9c5d6e4f12",
                        "ticker": "AAPL",
                        "model_used": "finbert-tone",
                        "headlines": [
                            "Apple stock jumps after record iPhone sales",
                            "Investors worry about Apple supply chain issues"
                        ],
                        "items": [
                            {
                                "headline": "Apple stock jumps after record iPhone sales",
                                "label": "positive",
                                "score": 0.93,
                                "high_confidence": True,
                            },
                            {
                                "headline": "Investors worry about Apple supply chain issues",
                                "label": "negative",
                                "score": 0.88,
                                "high_confidence": True,
                            }
                        ],
                        "summary": {
                            "counts": {"positive": 1, "neutral": 0, "negative": 1},
                            "percentages": {"positive": 50.0, "neutral": 0.0, "negative": 50.0},
                            "total": 2
                        },
                        "min_confidence": 0.7,
                        "created_at": "2025-09-10 12:46:37.325673+00"  # <-- included
                    }
                }
            }
        }
    }
)

def get_sentiment(id: str, x_api_key: str = Header(...)):
    check_api_key(x_api_key)
    existing = supabase.table("sentiment_results").select("*").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Sentiment not found")
    
    return existing.data[0]


@app.put(
    "/api/sentiment/{id}",
    response_model=SentimentResponse,
    summary="Update headlines and/or min_confidence",
    responses={
        200: {
            "description": "Sentiment record updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "f7a4c9b2-3d1e-4c8a-9f4b-2d7c9e1f6b5a",
                        "ticker": "AAPL",
                        "model_used": "finbert-tone",
                        "headlines": [
                            "Apple announces new iPhone 16",
                            "Supply chain issues continue to worry investors"
                        ],
                        "items": [
                            {
                                "headline": "Apple announces new iPhone 16",
                                "label": "positive",
                                "score": 0.95,
                                "high_confidence": True,
                            },
                            {
                                "headline": "Supply chain issues continue to worry investors",
                                "label": "negative",
                                "score": 0.85,
                                "high_confidence": True,
                            }
                        ],
                        "summary": {
                            "counts": {"positive": 1, "neutral": 0, "negative": 1},
                            "percentages": {"positive": 50.0, "neutral": 0.0, "negative": 50.0},
                            "total": 2
                        },
                        "min_confidence": 0.8,
                    }
                }
            }
        }
    }
)
def update_sentiment(id: str, body: SentimentRequest = Body(..., example={
    "headlines": [
        "Apple announces new iPhone 16",
        "Supply chain issues continue to worry investors"
    ],
    "min_confidence": 0.8
}), x_api_key: str = Header(...)):
    check_api_key(x_api_key)
    existing = supabase.table("sentiment_results").select("*").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Sentiment not found")
    
    record = existing.data[0]
    items, summary = analyze_headlines(body.headlines, body.min_confidence)
    new_id = str(uuid.uuid4())
    updated = {"id": new_id, "ticker": record["ticker"], "model_used":"finbert-tone",
               "headlines": body.headlines, "items": items, "summary": summary,
               "min_confidence": body.min_confidence}
    
    supabase.table("sentiment_results").delete().eq("id", id).execute()
    supabase.table("sentiment_results").insert(updated).execute()
    return updated

@app.delete(
    "/api/sentiment/{id}",
    response_model=dict,
    summary="Delete sentiment by ID",
    responses={
        200: {
            "description": "Sentiment record deleted successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "f7a4c9b2-3d1e-4c8a-9f4b-2d7c9e1f6b5a",
                        "detail": "Deleted successfully"
                    }
                }
            }
        }
    }
)
def delete_sentiment(id: str, x_api_key: str = Header(...)):
    check_api_key(x_api_key)
    existing = supabase.table("sentiment_results").select("*").eq("id", id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Sentiment not found")
    supabase.table("sentiment_results").delete().eq("id", id).execute()
    return {"id": id, "detail": "Deleted successfully"}


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
