# from fastapi import FastAPI, Query, Response
# from fastapi.responses import JSONResponse
# from fastapi.middleware.cors import CORSMiddleware
# import yfinance as yf
# from scipy.signal import savgol_filter
# import numpy as np
# from sklearn.cluster import KMeans
# from sklearn.preprocessing import StandardScaler
# from hmmlearn import hmm
# import pandas as pd
# import plotly.graph_objects as go
# from datetime import datetime, timedelta
# import json

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.get("/api/hmmplot")
# def get_plot(
#     symbol: str = Query(default="SPY"),
#     interval: str = Query(default = "1d"),
#     start: str = Query(default = "2021-01-01")
# ):
#     print("API /api/hmmplot HIT!")
#     # df = pd.read_csv("temp_data.csv", index_col = 'Date', parse_dates = ['Date'])
#     df = init_historical_data(symbol, interval, start)
#     df = clean_data(df)
#     df = init_tech_indicators(df)    
#     df = init_savgol_filter(df)
#     df = init_hmm(df, 'SG_Close')
#     fig, regime_stats, curr_regime = plot_hmm(df)
#     fig_json = fig.to_json()
#     if fig_json is None:
#         fig_json = "{}"
#     fig_dict = json.loads(fig_json)
    
#     return JSONResponse(
#         content={
#             "figure": fig_dict, 
#             "regime_stats": regime_stats,
#             "curr_regime": curr_regime
#     })

# def init_historical_data(symbol, interval, start):
#     start_dt = datetime.strptime(start, '%Y-%m-%d')
#     adj_start = start_dt - timedelta(200)
#     start_str = adj_start.strftime('%Y-%m-%d')  

#     df = yf.download(symbol, interval = interval, start=start_str) # incl - excl 
    
#     if df is None:
#         # Return empty dataframe or raise error
#         print("df returned None")
#         return pd.DataFrame()

#     if isinstance(df.columns, pd.MultiIndex):
#         df.columns = df.columns.droplevel(1)

#     return df

# # helper functions
# def clean_data(df):
#     df = df.copy()

#     df = df.dropna()
#     df['Date'] = df.index
#     df['Date'] = pd.to_datetime(df['Date'])
#     df.set_index('Date', inplace=True)

#     # Check for duplicate dates in index
#     duplicates = df.index.duplicated(keep=False)
#     if duplicates.any():
#         # print(f"Found {duplicates.sum()} duplicate rows in data based on the index (dates).")
#         # Show the duplicate dates
#         # print(df[df.index.duplicated(keep=False)].index)

#         # Option 1: Remove duplicates, keep the first occurrence
#         df = df[~df.index.duplicated(keep='first')]
#         # print("Duplicates removed, keeping first occurrence.")

#     return df

# def init_tech_indicators(df):
#     df = df.copy()
    
#     df['Avg50'] = df['Close'].rolling(window=50).mean()
#     df['Avg200'] = df['Close'].rolling(window=200).mean()

#     df = df.dropna()
#     return df

# def init_savgol_filter(df, window_length = 15, polyorder = 3):
#     df = df.copy()
#     # --- APPLY SAVGOL FILTER TO SMOOTH CLOSE PRICES ---
#     df['SG_Close'] = savgol_filter(df['Close'], window_length=window_length, polyorder=polyorder) 
#     df = df.dropna()
#     return df


# def init_hmm(df, filter_type = "SG_Close"):
    
#     df = df.copy()
    
#     returns_smooth = df[filter_type].pct_change().dropna().values.reshape(-1, 1)
#     scaler = StandardScaler()
#     returns_scaled = scaler.fit_transform(returns_smooth)

#     # Initialize KMeans
#     kmeans = KMeans(n_clusters=3, n_init = 50, random_state=42).fit(returns_scaled)

#     # Initialize HMM with parameters from KMeans
#     model = hmm.GaussianHMM(
#         n_components=3,
#         covariance_type="full",
#         n_iter=3000,
#         random_state=42,
#         init_params='st'  # Only initialize startprob and transmat
#     )

#     model.means_ = kmeans.cluster_centers_
#     model.covars_ = np.array([
#         np.cov(returns_scaled[kmeans.labels_ == i].T) + 1e-5 * np.eye(1)
#         for i in range(3)
#     ])

#     # Fit HMM model
#     model.fit(returns_scaled)

#     # Predict regimes
#     regimes = model.predict(returns_scaled)

#     # Align with returns index after pct_change
#     df = df.loc[df.index[1:]].copy()
#     df['Regime'] = regimes
#     # Show regime counts
#     # print("Regime Count:")
#     # print(df.shape)

#     # print(df['Regime'].value_counts())

#     return df

# def plot_hmm(df, filter_type="SG_Close"):
    
#     if filter_type not in df.columns:
#         raise ValueError(f"{filter_type} column missing. Ensure it's present before plotting.")

#     # Compute mean returns for each regime
#     regime_sym = {}
#     for regime in [0, 1, 2]:
#         mask = df['Regime'] == regime
#         regime_data = df.loc[mask, 'Close']
#         date_diffs = regime_data.index.to_series().diff().dt.days.fillna(1)
#         segment_ids = (date_diffs > 1).cumsum()

#         segment_returns = []
#         for _, segment in regime_data.groupby(segment_ids):
#             if len(segment) > 1:
#                 pct_changes = segment.pct_change().dropna()
#                 segment_returns.append(pct_changes.mean())

#         mean_return = np.mean(segment_returns) if segment_returns else 0
#         regime_sym[regime] = mean_return

#     # Sort regimes by mean return (lowest → highest)
#     sorted_regimes = sorted(regime_sym.items(), key=lambda x: x[1])

#     # Assign labels in order
#     labels = [('Bearish', 'Red'), ('Neutral', 'Blue'), ('Bullish', 'Green')]
#     regime_labels = {regime: label for (regime, _), label in zip(sorted_regimes, labels)}

#     # print(regime_labels)
#     curr_regime = regime_labels[df['Regime'].iloc[-1]][0]

#     fig = go.Figure()

#     # Plot main lines
#     fig.add_trace(go.Scatter(
#         x=df.index,
#         y=df['Close'],
#         mode='lines',
#         name='Original Close',
#         line=dict(color='blue', width=2),
#         opacity=0.6
#     ))
#     fig.add_trace(go.Scatter(
#         x=df.index,
#         y=df['Avg200'],
#         mode='lines',
#         name='SMA-200',
#         line=dict(color='red', width=2),
#         opacity=0.6
#     ))
#     fig.add_trace(go.Scatter(
#         x=df.index,
#         y=df['Avg50'],
#         mode='lines',
#         name='SMA-50',
#         line=dict(color='green', width=2),
#         opacity=0.6
#     ))

#     # Add vrects for regime segments (no annotations)
#     current_regime = None
#     start_idx = None
#     for i, regime in enumerate(df['Regime']):
#         if regime != current_regime:
#             if current_regime is not None:
#                 start_date = df.index[start_idx]
#                 end_date = df.index[i - 1] + timedelta(days=1)  # fix gap
#                 fig.add_vrect(
#                     x0=start_date,
#                     x1=end_date,
#                     fillcolor=regime_labels[current_regime][1].lower(),
#                     opacity=0.3,
#                     layer="below",
#                     line_width=0,
#                 )
#             current_regime = regime
#             start_idx = i

#     # Last segment
#     if current_regime is not None and start_idx is not None:
#         start_date = df.index[start_idx]
#         end_date = df.index[-1] + timedelta(days=1)  # fix gap
#         fig.add_vrect(
#             x0=start_date,
#             x1=end_date,
#             fillcolor=regime_labels[current_regime][1].lower(),
#             opacity=0.3,
#             layer="below",
#             line_width=0,
#         )


#     # Add dummy traces for regime legend entries
#     for regime_key, (regime_name, color_name) in regime_labels.items():
#         fig.add_trace(go.Scatter(
#             x=[None],
#             y=[None],
#             mode='lines',
#             line=dict(color=color_name.lower(), width=10),
#             name=regime_name,
#             showlegend=True
#         ))

#     fig.update_layout(
#         # title="SPY Close Price with HMM Regimes",
#         xaxis_title="Date",
#         yaxis_title="Price",
#         legend=dict(x=0, y=1, bgcolor='rgba(255,255,255,0)'),
#         font=dict(
#             size=7,
#             color="black"
#         ),
#         hovermode="x unified",
#         template='plotly_white',
#         height=600,
#         xaxis=dict(
#             rangeslider=dict(visible=True),
#             type="date"
#         )
#     )

#     df = df.copy()
#     df['Segment'] = (df['Regime'] != df['Regime'].shift()).cumsum()
#     segment_lengths = df.groupby(['Segment', 'Regime']).size().reset_index(name='Length')
    
#     regime_stats = {}
#     for regime, (label, color) in regime_labels.items():
#         seg_length = segment_lengths[segment_lengths['Regime'] == regime]['Length']
#         regime_stats[label] = (seg_length.mean(), len(seg_length))
#     # print("Label -> (Mean Time Span, # of Segments)")
#     print(regime_stats)

#     return fig, regime_stats, curr_regime

