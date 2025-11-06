# Python Simple Modular: ML Forecasting System

**Pattern:** Simple Modular Architecture
**Language:** Python 3.10+
**Framework:** FastAPI + PyTorch
**Domain:** Time Series Forecasting
**Status:** ✅ Complete
**Parent Guide:** [Python Architecture Patterns

---

## TL;DR

**Complete Python implementation of Simple Modular architecture** for ML time series forecasting. Shows functional module organization (data, models, api, training, utils) with working code. Uses FastAPI for API layer, PyTorch for models, pandas for data processing. Demonstrates fast iteration, minimal boilerplate, and practical ML system structure. **Perfect starting point for ML/data science projects** (1-5 developers). **Code is production-ready** with tests, configuration, and deployment setup.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Module Implementation](#module-implementation)
  - [Data Module](#data-module)
  - [Features Module](#features-module)
  - [Models Module](#models-module)
  - [Training Module](#training-module)
  - [API Module](#api-module)
  - [Utils Module](#utils-module)
- [Configuration](#configuration)
- [Testing](#testing)
- [Running the System](#running-the-system)
- [Deployment](#deployment)
- [Migration Path](#migration-path)

---

## Overview

This example demonstrates:
- ✅ Functional module organization (what code does, not layers)
- ✅ Fast iteration for ML experimentation
- ✅ Minimal boilerplate
- ✅ Clear separation of data, models, API concerns
- ✅ Production-ready ML system structure

**When to use:**
- ML/AI projects (forecasting, classification, recommendation)
- Small-to-medium teams (1-5 developers)
- Fast experimentation and iteration
- MVP stage or proof-of-concept

**Why Simple Modular for ML:**
- ML projects need fast iteration (try models, features, hyperparameters)
- Strict architectural boundaries slow down experimentation
- Functional organization (data, models, training) maps to ML workflow
- Easy to understand for data scientists (not enterprise architects)

---

## Project Structure

```
ml-forecasting/
├── src/
│   ├── main/
│   │   ├── data/                    # Data pipeline
│   │   │   ├── __init__.py
│   │   │   ├── ingestion.py         # Fetch data from sources
│   │   │   ├── validation.py        # Data quality checks
│   │   │   └── preprocessing.py     # Transform for model input
│   │   │
│   │   ├── features/                # Feature engineering
│   │   │   ├── __init__.py
│   │   │   ├── technical.py         # Technical indicators
│   │   │   └── aggregates.py        # Time-based aggregations
│   │   │
│   │   ├── models/                  # ML models
│   │   │   ├── __init__.py
│   │   │   ├── forecaster.py        # Time series forecasting model
│   │   │   └── checkpoint.py        # Model loading/saving
│   │   │
│   │   ├── training/                # Training framework
│   │   │   ├── __init__.py
│   │   │   ├── trainer.py           # Training loop
│   │   │   └── evaluation.py        # Model evaluation
│   │   │
│   │   ├── api/                     # HTTP API
│   │   │   ├── __init__.py
│   │   │   ├── routes.py            # FastAPI routes
│   │   │   └── schemas.py           # Request/response models
│   │   │
│   │   └── utils/                   # Shared utilities
│   │       ├── __init__.py
│   │       ├── config.py            # Configuration loader
│   │       └── logging.py           # Logging setup
│   │
│   └── test/
│       ├── data/
│       │   ├── test_ingestion.py
│       │   ├── test_validation.py
│       │   └── test_preprocessing.py
│       ├── features/
│       │   └── test_technical.py
│       ├── models/
│       │   └── test_forecaster.py
│       ├── training/
│       │   └── test_trainer.py
│       └── api/
│           └── test_routes.py
│
├── config/
│   ├── config.yaml                  # Application config
│   └── model_config.yaml            # Model hyperparameters
│
├── data/
│   ├── raw/                         # Raw data
│   ├── processed/                   # Preprocessed data
│   └── checkpoints/                 # Model checkpoints
│
├── pyproject.toml
├── uv.lock
├── Makefile
└── README.md
```

---

## Module Implementation

### Data Module

**Purpose:** Fetch, validate, and preprocess time series data

#### `src/main/data/ingestion.py`

```python
"""Data ingestion module - fetch time series from sources."""
import pandas as pd
from pathlib import Path
from typing import Optional


def fetch_time_series_data(source: str) -> pd.DataFrame:
    """
    Fetch time series data from CSV, database, or API.

    Args:
        source: Path to CSV file, database URL, or API endpoint

    Returns:
        DataFrame with columns: timestamp, value

    Example:
        >>> df = fetch_time_series_data("data/raw/sales.csv")
        >>> df.head()
           timestamp  value
        0 2024-01-01  100.5
        1 2024-01-02  102.3
    """
    if source.endswith('.csv'):
        return _fetch_from_csv(source)
    elif source.startswith('postgresql://'):
        return _fetch_from_database(source)
    elif source.startswith('http'):
        return _fetch_from_api(source)
    else:
        raise ValueError(f"Unsupported data source: {source}")


def _fetch_from_csv(path: str) -> pd.DataFrame:
    """Fetch from CSV file."""
    df = pd.read_csv(path, parse_dates=['timestamp'])
    return df[['timestamp', 'value']]


def _fetch_from_database(url: str) -> pd.DataFrame:
    """Fetch from PostgreSQL database."""
    import psycopg2
    conn = psycopg2.connect(url)
    query = "SELECT timestamp, value FROM time_series ORDER BY timestamp"
    df = pd.read_sql(query, conn)
    conn.close()
    return df


def _fetch_from_api(endpoint: str) -> pd.DataFrame:
    """Fetch from REST API."""
    import requests
    response = requests.get(endpoint)
    response.raise_for_status()
    data = response.json()
    return pd.DataFrame(data)
```

#### `src/main/data/validation.py`

```python
"""Data validation module - ensure data quality."""
import pandas as pd
from typing import Tuple


class DataValidationError(Exception):
    """Raised when data validation fails."""
    pass


def validate_time_series(df: pd.DataFrame) -> Tuple[pd.DataFrame, dict]:
    """
    Validate time series data quality.

    Checks:
    - Required columns exist
    - No excessive missing values
    - Timestamps are sorted
    - Values are numeric

    Args:
        df: DataFrame with timestamp and value columns

    Returns:
        Tuple of (validated_df, validation_report)

    Raises:
        DataValidationError: If critical validation fails
    """
    report = {}

    # Check required columns
    if not {'timestamp', 'value'}.issubset(df.columns):
        raise DataValidationError("Missing required columns: timestamp, value")

    # Check for missing values
    missing_pct = df['value'].isna().sum() / len(df) * 100
    report['missing_percentage'] = missing_pct

    if missing_pct > 10:
        raise DataValidationError(f"Too many missing values: {missing_pct:.1f}%")

    # Check timestamp sorting
    if not df['timestamp'].is_monotonic_increasing:
        df = df.sort_values('timestamp')
        report['sorted'] = True

    # Check for duplicates
    duplicates = df['timestamp'].duplicated().sum()
    report['duplicates'] = duplicates

    if duplicates > 0:
        df = df.drop_duplicates(subset=['timestamp'], keep='last')

    # Check value type
    if not pd.api.types.is_numeric_dtype(df['value']):
        raise DataValidationError("Value column must be numeric")

    report['status'] = 'passed'
    return df, report


def handle_missing_values(df: pd.DataFrame, method: str = 'interpolate') -> pd.DataFrame:
    """
    Handle missing values in time series.

    Args:
        df: DataFrame with timestamp and value columns
        method: 'interpolate', 'forward_fill', or 'drop'

    Returns:
        DataFrame with missing values handled
    """
    if method == 'interpolate':
        df['value'] = df['value'].interpolate(method='linear')
    elif method == 'forward_fill':
        df['value'] = df['value'].fillna(method='ffill')
    elif method == 'drop':
        df = df.dropna(subset=['value'])
    else:
        raise ValueError(f"Unknown method: {method}")

    return df
```

#### `src/main/data/preprocessing.py`

```python
"""Data preprocessing module - transform for model input."""
import pandas as pd
import numpy as np
from typing import Tuple
from sklearn.preprocessing import StandardScaler


def create_sequences(
    data: pd.DataFrame,
    window_size: int = 30,
    prediction_horizon: int = 7
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Create input sequences for time series forecasting.

    Args:
        data: DataFrame with timestamp and value columns
        window_size: Number of past timesteps to use as input
        prediction_horizon: Number of future timesteps to predict

    Returns:
        Tuple of (X, y) where:
        - X: shape (n_samples, window_size) - input sequences
        - y: shape (n_samples, prediction_horizon) - target sequences

    Example:
        >>> df = pd.DataFrame({'timestamp': [...], 'value': [1,2,3,4,5,6,7,8,9,10]})
        >>> X, y = create_sequences(df, window_size=3, prediction_horizon=2)
        >>> X[0]  # First input sequence
        array([1, 2, 3])
        >>> y[0]  # First target sequence
        array([4, 5])
    """
    values = data['value'].values
    X, y = [], []

    for i in range(len(values) - window_size - prediction_horizon + 1):
        X.append(values[i:i + window_size])
        y.append(values[i + window_size:i + window_size + prediction_horizon])

    return np.array(X), np.array(y)


def normalize_data(
    train_data: np.ndarray,
    test_data: np.ndarray
) -> Tuple[np.ndarray, np.ndarray, StandardScaler]:
    """
    Normalize data using StandardScaler.

    Args:
        train_data: Training data
        test_data: Test data

    Returns:
        Tuple of (normalized_train, normalized_test, scaler)
    """
    scaler = StandardScaler()

    # Fit on training data only
    train_normalized = scaler.fit_transform(train_data.reshape(-1, 1)).reshape(train_data.shape)
    test_normalized = scaler.transform(test_data.reshape(-1, 1)).reshape(test_data.shape)

    return train_normalized, test_normalized, scaler


def train_test_split_timeseries(
    X: np.ndarray,
    y: np.ndarray,
    test_size: float = 0.2
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Split time series data into train and test sets.

    Note: Uses sequential split (not random) to preserve temporal order.

    Args:
        X: Input sequences
        y: Target sequences
        test_size: Proportion of data to use for testing

    Returns:
        Tuple of (X_train, X_test, y_train, y_test)
    """
    split_idx = int(len(X) * (1 - test_size))

    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    return X_train, X_test, y_train, y_test
```

---

### Features Module

**Purpose:** Engineer features for time series forecasting

#### `src/main/features/technical.py`

```python
"""Technical indicators for time series."""
import pandas as pd
import numpy as np


def add_moving_averages(df: pd.DataFrame, windows: list = [7, 14, 30]) -> pd.DataFrame:
    """
    Add moving average features.

    Args:
        df: DataFrame with value column
        windows: List of window sizes for moving averages

    Returns:
        DataFrame with MA features added
    """
    for window in windows:
        df[f'ma_{window}'] = df['value'].rolling(window=window).mean()

    return df


def add_lag_features(df: pd.DataFrame, lags: list = [1, 7, 14]) -> pd.DataFrame:
    """
    Add lagged value features.

    Args:
        df: DataFrame with value column
        lags: List of lag periods

    Returns:
        DataFrame with lag features added
    """
    for lag in lags:
        df[f'lag_{lag}'] = df['value'].shift(lag)

    return df


def add_rolling_statistics(df: pd.DataFrame, window: int = 7) -> pd.DataFrame:
    """
    Add rolling statistical features.

    Args:
        df: DataFrame with value column
        window: Rolling window size

    Returns:
        DataFrame with statistical features added
    """
    rolling = df['value'].rolling(window=window)

    df[f'rolling_std_{window}'] = rolling.std()
    df[f'rolling_min_{window}'] = rolling.min()
    df[f'rolling_max_{window}'] = rolling.max()
    df[f'rolling_median_{window}'] = rolling.median()

    return df
```

---

### Models Module

**Purpose:** Define and manage PyTorch forecasting models

#### `src/main/models/forecaster.py`

```python
"""Time series forecasting model using PyTorch LSTM."""
import torch
import torch.nn as nn
from typing import Optional


class TimeSeriesForecaster(nn.Module):
    """
    LSTM-based time series forecasting model.

    Architecture:
    - LSTM layers for temporal pattern learning
    - Fully connected layers for prediction
    - Dropout for regularization
    """

    def __init__(
        self,
        input_size: int = 1,
        hidden_size: int = 64,
        num_layers: int = 2,
        output_size: int = 7,
        dropout: float = 0.2
    ):
        """
        Initialize forecaster.

        Args:
            input_size: Number of input features
            hidden_size: LSTM hidden dimension size
            num_layers: Number of LSTM layers
            output_size: Number of future timesteps to predict
            dropout: Dropout probability
        """
        super(TimeSeriesForecaster, self).__init__()

        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size

        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True
        )

        # Fully connected layers
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, output_size)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)

        Returns:
            Predictions of shape (batch_size, output_size)
        """
        # LSTM forward pass
        lstm_out, (h_n, c_n) = self.lstm(x)

        # Use last hidden state
        last_hidden = h_n[-1]  # Shape: (batch_size, hidden_size)

        # Fully connected prediction
        predictions = self.fc(last_hidden)

        return predictions

    def predict(self, x: torch.Tensor) -> torch.Tensor:
        """
        Make predictions (evaluation mode).

        Args:
            x: Input tensor

        Returns:
            Predictions
        """
        self.eval()
        with torch.no_grad():
            predictions = self.forward(x)
        return predictions
```

#### `src/main/models/checkpoint.py`

```python
"""Model checkpoint management."""
import torch
from pathlib import Path
from typing import Optional
from src.main.models.forecaster import TimeSeriesForecaster


def save_checkpoint(
    model: TimeSeriesForecaster,
    optimizer: torch.optim.Optimizer,
    epoch: int,
    loss: float,
    path: str
) -> None:
    """
    Save model checkpoint.

    Args:
        model: Model to save
        optimizer: Optimizer state
        epoch: Current epoch number
        loss: Current loss value
        path: Path to save checkpoint
    """
    checkpoint = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': loss,
        'model_config': {
            'input_size': model.input_size,
            'hidden_size': model.hidden_size,
            'num_layers': model.num_layers,
            'output_size': model.output_size
        }
    }

    Path(path).parent.mkdir(parents=True, exist_ok=True)
    torch.save(checkpoint, path)


def load_checkpoint(path: str, device: str = 'cpu') -> tuple:
    """
    Load model checkpoint.

    Args:
        path: Path to checkpoint file
        device: Device to load model to ('cpu' or 'cuda')

    Returns:
        Tuple of (model, optimizer, epoch, loss)
    """
    checkpoint = torch.load(path, map_location=device)

    # Reconstruct model
    model = TimeSeriesForecaster(**checkpoint['model_config'])
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)

    # Reconstruct optimizer
    optimizer = torch.optim.Adam(model.parameters())
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])

    return model, optimizer, checkpoint['epoch'], checkpoint['loss']


def load_model_for_inference(path: str, device: str = 'cpu') -> TimeSeriesForecaster:
    """
    Load model for inference only (no optimizer).

    Args:
        path: Path to checkpoint file
        device: Device to load model to

    Returns:
        Loaded model in evaluation mode
    """
    checkpoint = torch.load(path, map_location=device)

    model = TimeSeriesForecaster(**checkpoint['model_config'])
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()

    return model
```

---

### Training Module

**Purpose:** Train and evaluate models

#### `src/main/training/trainer.py`

```python
"""Model training loop."""
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from typing import Optional, Callable
from src.main.models.forecaster import TimeSeriesForecaster
from src.main.models.checkpoint import save_checkpoint


class Trainer:
    """
    Model training orchestrator.

    Handles:
    - Training loop with early stopping
    - Model checkpointing
    - Loss tracking
    """

    def __init__(
        self,
        model: TimeSeriesForecaster,
        optimizer: torch.optim.Optimizer,
        criterion: nn.Module,
        device: str = 'cpu'
    ):
        """
        Initialize trainer.

        Args:
            model: Model to train
            optimizer: Optimizer for gradient descent
            criterion: Loss function
            device: Device to train on ('cpu' or 'cuda')
        """
        self.model = model.to(device)
        self.optimizer = optimizer
        self.criterion = criterion
        self.device = device

        self.train_losses = []
        self.val_losses = []

    def train_epoch(self, train_loader: DataLoader) -> float:
        """
        Train for one epoch.

        Args:
            train_loader: DataLoader for training data

        Returns:
            Average training loss for epoch
        """
        self.model.train()
        epoch_loss = 0.0

        for batch_X, batch_y in train_loader:
            batch_X = batch_X.to(self.device)
            batch_y = batch_y.to(self.device)

            # Forward pass
            self.optimizer.zero_grad()
            predictions = self.model(batch_X)
            loss = self.criterion(predictions, batch_y)

            # Backward pass
            loss.backward()
            self.optimizer.step()

            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(train_loader)
        return avg_loss

    def validate(self, val_loader: DataLoader) -> float:
        """
        Validate model.

        Args:
            val_loader: DataLoader for validation data

        Returns:
            Average validation loss
        """
        self.model.eval()
        val_loss = 0.0

        with torch.no_grad():
            for batch_X, batch_y in val_loader:
                batch_X = batch_X.to(self.device)
                batch_y = batch_y.to(self.device)

                predictions = self.model(batch_X)
                loss = self.criterion(predictions, batch_y)
                val_loss += loss.item()

        avg_loss = val_loss / len(val_loader)
        return avg_loss

    def train(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader,
        epochs: int = 100,
        early_stopping_patience: int = 10,
        checkpoint_path: Optional[str] = None
    ) -> dict:
        """
        Full training loop with early stopping.

        Args:
            train_loader: Training data loader
            val_loader: Validation data loader
            epochs: Maximum number of epochs
            early_stopping_patience: Epochs to wait before early stopping
            checkpoint_path: Path to save best model checkpoint

        Returns:
            Training history dict with losses
        """
        best_val_loss = float('inf')
        patience_counter = 0

        for epoch in range(epochs):
            # Train
            train_loss = self.train_epoch(train_loader)
            self.train_losses.append(train_loss)

            # Validate
            val_loss = self.validate(val_loader)
            self.val_losses.append(val_loss)

            print(f"Epoch {epoch+1}/{epochs} - Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")

            # Check for improvement
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0

                # Save checkpoint
                if checkpoint_path:
                    save_checkpoint(
                        self.model,
                        self.optimizer,
                        epoch,
                        val_loss,
                        checkpoint_path
                    )
                    print(f"  → Saved checkpoint (val_loss improved to {val_loss:.4f})")
            else:
                patience_counter += 1

                if patience_counter >= early_stopping_patience:
                    print(f"Early stopping triggered after {epoch+1} epochs")
                    break

        return {
            'train_losses': self.train_losses,
            'val_losses': self.val_losses,
            'best_val_loss': best_val_loss,
            'final_epoch': epoch + 1
        }
```

#### `src/main/training/evaluation.py`

```python
"""Model evaluation metrics."""
import numpy as np
from typing import Dict


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Calculate forecasting metrics.

    Args:
        y_true: True values
        y_pred: Predicted values

    Returns:
        Dictionary of metrics (MAE, RMSE, MAPE)
    """
    # Mean Absolute Error
    mae = np.mean(np.abs(y_true - y_pred))

    # Root Mean Squared Error
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))

    # Mean Absolute Percentage Error
    mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100

    return {
        'mae': mae,
        'rmse': rmse,
        'mape': mape
    }


def evaluate_model(model, test_loader, device='cpu') -> Dict[str, float]:
    """
    Evaluate model on test set.

    Args:
        model: Trained model
        test_loader: Test data loader
        device: Device to evaluate on

    Returns:
        Dictionary of evaluation metrics
    """
    import torch

    model.eval()
    all_predictions = []
    all_targets = []

    with torch.no_grad():
        for batch_X, batch_y in test_loader:
            batch_X = batch_X.to(device)
            predictions = model(batch_X)

            all_predictions.append(predictions.cpu().numpy())
            all_targets.append(batch_y.numpy())

    y_pred = np.concatenate(all_predictions, axis=0)
    y_true = np.concatenate(all_targets, axis=0)

    return calculate_metrics(y_true, y_pred)
```

---

### API Module

**Purpose:** Expose model via FastAPI HTTP endpoints

#### `src/main/api/schemas.py`

```python
"""Pydantic schemas for API requests and responses."""
from pydantic import BaseModel, Field
from typing import List


class PredictRequest(BaseModel):
    """Prediction request schema."""

    data: List[float] = Field(
        ...,
        description="Historical time series values (last N timesteps)",
        min_length=1,
        example=[100.5, 102.3, 98.7, 101.2, 103.5]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "data": [100.5, 102.3, 98.7, 101.2, 103.5, 99.8, 104.1]
                }
            ]
        }
    }


class PredictResponse(BaseModel):
    """Prediction response schema."""

    predictions: List[float] = Field(
        ...,
        description="Forecasted future values"
    )

    model_version: str = Field(
        ...,
        description="Model version used for prediction"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "predictions": [105.3, 106.1, 104.8, 107.2, 108.5, 109.1, 110.3],
                    "model_version": "v1.0.0"
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., example="healthy")
    model_loaded: bool = Field(..., example=True)
    version: str = Field(..., example="1.0.0")


class ModelInfoResponse(BaseModel):
    """Model information response."""

    model_type: str
    input_size: int
    hidden_size: int
    num_layers: int
    output_size: int
    total_parameters: int
```

#### `src/main/api/routes.py`

```python
"""FastAPI routes for time series forecasting API."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import numpy as np
from typing import Optional

from src.main.api.schemas import (
    PredictRequest,
    PredictResponse,
    HealthResponse,
    ModelInfoResponse
)
from src.main.models.checkpoint import load_model_for_inference
from src.main.utils.config import load_config


# Initialize FastAPI app
app = FastAPI(
    title="Time Series Forecasting API",
    description="ML-powered time series forecasting service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
model: Optional[torch.nn.Module] = None
device = 'cuda' if torch.cuda.is_available() else 'cpu'


@app.on_event("startup")
async def load_model():
    """Load model on startup."""
    global model

    config = load_config("config/config.yaml")
    checkpoint_path = config.get('model_checkpoint_path', 'data/checkpoints/best_model.pt')

    try:
        model = load_model_for_inference(checkpoint_path, device=device)
        print(f"✅ Model loaded successfully from {checkpoint_path}")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        model = None


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns:
        Health status including model availability
    """
    return HealthResponse(
        status="healthy" if model is not None else "unhealthy",
        model_loaded=model is not None,
        version="1.0.0"
    )


@app.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Get model information.

    Returns:
        Model architecture and parameter details
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    total_params = sum(p.numel() for p in model.parameters())

    return ModelInfoResponse(
        model_type="LSTM",
        input_size=model.input_size,
        hidden_size=model.hidden_size,
        num_layers=model.num_layers,
        output_size=model.output_size,
        total_parameters=total_params
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Make time series forecast.

    Args:
        request: Prediction request with historical data

    Returns:
        Forecasted future values

    Example:
        ```bash
        curl -X POST http://localhost:8000/predict \\
          -H "Content-Type: application/json" \\
          -d '{"data": [100.5, 102.3, 98.7, 101.2, 103.5]}'
        ```
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Convert input to tensor
        input_data = np.array(request.data).reshape(1, -1, 1)  # (1, seq_len, 1)
        input_tensor = torch.FloatTensor(input_data).to(device)

        # Make prediction
        with torch.no_grad():
            predictions = model(input_tensor)

        # Convert to list
        forecast = predictions.cpu().numpy().flatten().tolist()

        return PredictResponse(
            predictions=forecast,
            model_version="v1.0.0"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Time Series Forecasting API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "model_info": "/model/info",
            "docs": "/docs"
        }
    }
```

---

### Utils Module

**Purpose:** Shared utilities (config, logging)

#### `src/main/utils/config.py`

```python
"""Configuration management."""
import yaml
from pathlib import Path
from typing import Any, Dict


def load_config(config_path: str) -> Dict[str, Any]:
    """
    Load configuration from YAML file.

    Args:
        config_path: Path to config file

    Returns:
        Configuration dictionary
    """
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    return config


def save_config(config: Dict[str, Any], config_path: str) -> None:
    """
    Save configuration to YAML file.

    Args:
        config: Configuration dictionary
        config_path: Path to save config
    """
    Path(config_path).parent.mkdir(parents=True, exist_ok=True)

    with open(config_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
```

#### `src/main/utils/logging.py`

```python
"""Logging configuration."""
import logging
import sys
from pathlib import Path


def setup_logging(log_level: str = "INFO", log_file: str = None) -> logging.Logger:
    """
    Setup structured logging.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        log_file: Optional path to log file

    Returns:
        Configured logger
    """
    # Create logger
    logger = logging.getLogger("ml_forecasting")
    logger.setLevel(getattr(logging, log_level.upper()))

    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (optional)
    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger
```

---

## Configuration

### `config/config.yaml`

```yaml
# Application configuration

data:
  source: "data/raw/time_series.csv"
  validation_method: "interpolate"

preprocessing:
  window_size: 30
  prediction_horizon: 7
  test_size: 0.2

model:
  input_size: 1
  hidden_size: 64
  num_layers: 2
  output_size: 7
  dropout: 0.2

training:
  epochs: 100
  batch_size: 32
  learning_rate: 0.001
  early_stopping_patience: 10

model_checkpoint_path: "data/checkpoints/best_model.pt"

api:
  host: "0.0.0.0"
  port: 8000
  workers: 4

logging:
  level: "INFO"
  file: "logs/app.log"
```

### `pyproject.toml`

```toml
[project]
name = "ml-forecasting"
version = "1.0.0"
description = "Time series forecasting with PyTorch and FastAPI"
requires-python = ">=3.10"

dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "pydantic>=2.4.0",
    "torch>=2.1.0",
    "pandas>=2.1.0",
    "numpy>=1.24.0",
    "scikit-learn>=1.3.0",
    "pyyaml>=6.0",
    "requests>=2.31.0",
    "psycopg2-binary>=2.9.9",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "black>=23.10.0",
    "ruff>=0.1.0",
    "mypy>=1.6.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["src/test"]
python_files = "test_*.py"
python_functions = "test_*"

[tool.black]
line-length = 100
target-version = ["py310"]

[tool.ruff]
line-length = 100
target-version = "py310"
```

---

## Testing

### `src/test/data/test_ingestion.py`

```python
"""Tests for data ingestion module."""
import pytest
import pandas as pd
from src.main.data.ingestion import fetch_time_series_data


def test_fetch_from_csv(tmp_path):
    """Test CSV data ingestion."""
    # Create test CSV
    csv_path = tmp_path / "test_data.csv"
    test_data = pd.DataFrame({
        'timestamp': pd.date_range('2024-01-01', periods=10),
        'value': range(10)
    })
    test_data.to_csv(csv_path, index=False)

    # Test ingestion
    df = fetch_time_series_data(str(csv_path))

    assert len(df) == 10
    assert 'timestamp' in df.columns
    assert 'value' in df.columns
    assert df['value'].tolist() == list(range(10))


def test_unsupported_source():
    """Test error handling for unsupported sources."""
    with pytest.raises(ValueError, match="Unsupported data source"):
        fetch_time_series_data("unsupported.xyz")
```

### `src/test/models/test_forecaster.py`

```python
"""Tests for forecasting model."""
import pytest
import torch
from src.main.models.forecaster import TimeSeriesForecaster


def test_model_initialization():
    """Test model initialization."""
    model = TimeSeriesForecaster(
        input_size=1,
        hidden_size=32,
        num_layers=2,
        output_size=7
    )

    assert model.input_size == 1
    assert model.hidden_size == 32
    assert model.num_layers == 2
    assert model.output_size == 7


def test_model_forward_pass():
    """Test model forward pass."""
    model = TimeSeriesForecaster(input_size=1, hidden_size=32, output_size=7)

    # Create dummy input: (batch_size=2, sequence_length=30, input_size=1)
    x = torch.randn(2, 30, 1)

    # Forward pass
    output = model(x)

    # Check output shape
    assert output.shape == (2, 7)  # (batch_size, output_size)


def test_model_prediction():
    """Test model prediction method."""
    model = TimeSeriesForecaster(input_size=1, hidden_size=32, output_size=7)

    x = torch.randn(1, 30, 1)
    predictions = model.predict(x)

    assert predictions.shape == (1, 7)
    assert not predictions.requires_grad  # Should be in eval mode
```

### `src/test/api/test_routes.py`

```python
"""Tests for API routes."""
import pytest
from fastapi.testclient import TestClient
from src.main.api.routes import app


client = TestClient(app)


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model_loaded" in data


def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "endpoints" in data


def test_predict_endpoint_schema():
    """Test prediction endpoint request validation."""
    # Valid request
    response = client.post(
        "/predict",
        json={"data": [100.5, 102.3, 98.7, 101.2, 103.5]}
    )

    # Should return 503 if model not loaded, or 200 if loaded
    assert response.status_code in [200, 503]

    # Invalid request (empty data)
    response = client.post(
        "/predict",
        json={"data": []}
    )

    assert response.status_code == 422  # Validation error
```

---

## Running the System

### Setup

```bash
# Install dependencies
uv sync

# Verify installation
uv run python -c "import torch; print(f'PyTorch {torch.__version__}')"
```

### Training

```bash
# Train model
uv run python -m src.main.training.trainer

# Or use Makefile
make train
```

### Running API

```bash
# Start API server
uv run uvicorn src.main.api.routes:app --host 0.0.0.0 --port 8000 --reload

# Or use Makefile
make serve
```

### Testing

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src/main --cov-report=html

# Or use Makefile
make test
```

### Making Predictions

```bash
# Health check
curl http://localhost:8000/health

# Get model info
curl http://localhost:8000/model/info

# Make prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"data": [100.5, 102.3, 98.7, 101.2, 103.5, 99.8, 104.1]}'
```

---

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install UV
RUN pip install uv

# Copy project files
COPY pyproject.toml uv.lock ./
COPY src/ ./src/
COPY config/ ./config/
COPY data/checkpoints/ ./data/checkpoints/

# Install dependencies
RUN uv sync --frozen

# Expose port
EXPOSE 8000

# Run API
CMD ["uv", "run", "uvicorn", "src.main.api.routes:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t ml-forecasting .
docker run -p 8000:8000 ml-forecasting
```

---

## Migration Path

### When to Migrate from Simple Modular

**Migrate to Modular Monolith when:**
- Team grows beyond 5 developers
- Need module ownership (data team, ML team, API team)
- Circular dependencies become problematic

**Migrate to Hexagonal when:**
- Need strict separation between domain (ML models) and infrastructure (data sources)
- Want to easily swap data sources (CSV → Database → S3)
- Complex business logic emerges

**Signs you need more architecture:**
- ❌ Modules importing each other circularly
- ❌ Hard to test (tightly coupled to data sources)
- ❌ Multiple teams stepping on each other
- ❌ Can't swap implementations easily

**If none of these apply → Stay with Simple Modular!**

---

## Related Patterns

**See also:**
- [Python Hexagonal Architecture: Banking](hexagonal-banking-example.md) - Stricter boundaries
- [Python Clean Architecture: Banking](clean-architecture-banking-example.md) - Maximum separation
- [Python Architecture Patterns Guide - Pattern selection

---

**Document Type:** Complete Implementation Guide
**Last Updated:** 2025-10-20
**Version:** 1.0
**Pattern:** Simple Modular Architecture
**Language:** Python 3.10+

**Status:** ✅ This is a complete, production-ready implementation example.
