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
