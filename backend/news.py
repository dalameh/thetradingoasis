# from fastapi import FastAPI, Query
# from fastapi.middleware.cors import CORSMiddleware
# import pandas as pd
# from GoogleNews import GoogleNews
# import datetime as dt
# import nltk
# from urllib.parse import quote, urlparse, urlunparse
# import requests

# nltk.download('punkt')

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Adjust for production!
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.get("/api/news")
# def get_news(company: str = Query(..., min_length=1), daysBack: int = 2):
#     news_df = fetch_news(company, daysBack)
#     if news_df is None or news_df.empty:
#         return {"news": [], "message": "No news found."}

#     # Select relevant columns and rename for JSON response
#     df = news_df[['datetime', 'media', 'title', 'desc', 'link']].copy()
#     df = df.rename(columns={
#         'datetime': 'date',
#         'media': 'source',
#         'link': 'url',
#         'desc': 'description'
#     })

#     # Convert datetime objects to ISO strings if necessary
#     df['date'] = df['date'].apply(lambda x: x.isoformat() if not pd.isnull(x) else None)

#     news_list = df.to_dict(orient='records')

#     return {"news": news_list}


# def fetch_news(company_name, days_back=2):
#     start_date = dt.date.today() - dt.timedelta(days=days_back)
#     start_str = start_date.strftime('%m-%d-%Y')
#     now_str = dt.date.today().strftime('%m-%d-%Y')

#     googlenews = GoogleNews()
#     googlenews.search(company_name)
#     # result = googlenews.result()
#     # df = pd.DataFrame(result)
#     # if df.empty:
#     #     return None

#     all_results = []
#     max_pages = 2
#     # - approx. 20 articles
#     # all_results.extend(googlenews.result())

#     # Loop through additional pages
#     for page in range(2, max_pages + 1):
#         googlenews.getpage(page)
#         results = googlenews.result()
#         if not results and results not in all_results:
#             break
#         all_results.extend(results)

#     df = pd.DataFrame(all_results)
#     if df.empty:
#         return None

#     # Clean text fields
#     df['link'] = df['link'].map(clean_url)
#     df = df[df['link'] != ""]

#     # Parse datetime columns
#     if 'datetime' in df.columns:
#         df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce')
#     else:
#         df['datetime'] = pd.to_datetime(df['date'], errors='coerce')

#     # Filter for recent dates
#     df = df[df['datetime'].dt.date >= start_date].copy()

#     # Drop rows with invalid dates
#     df = df.dropna(subset=['datetime'])
#     df = df.drop_duplicates()
#     print(df)
#     return df

# from urllib.parse import urlparse, parse_qs

# def clean_url(url):
#     if not isinstance(url, str) or not url.strip():
#         return ""
#     url = url.strip()
#     if not url.startswith("http"):
#         return ""
    
#     # Remove Google redirect format
#     if "news.google.com" in url and "/articles/" in url:
#         return url  # Google-hosted articles (AMP), usually fine

#     # If it's a redirect or contains tracking params, strip them
#     idx1 = url.find("&ved")
#     idx2 = url.find("&usg")
#     idx3 = url.find("%")

#     print("h:")
#     print(url)
#     print()
#     if (idx1) :
#         url = url[0 : idx1]
#     elif (idx2):
#         url = url[0 : idx2]
    
#     if (idx3):
#         url = url[0 : idx3]

#     return url