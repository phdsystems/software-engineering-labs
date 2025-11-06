# Python Project Setup Guide

**Purpose:** Standard project structure, package management (UV), and testing conventions for Python projects
**Organization:** PHD Systems & PHD Labs
**Version:** 2.0
**Date:** 2025-10-20

---

## TL;DR

**Package manager**: Use UV exclusively (10-100x faster than pip, Rust-based, lockfile support). **Never use pip** - UV handles everything pip does, but better. **Project structure**: Separate source (`src/main/`) from tests (`src/test/`), with tests mirroring source structure exactly. **Build automation**: Use Makefile for standardized commands (`make install`, `make test`, `make ci`). **Naming convention**: `{module}_test.py` (unit), `{module}_it_test.py` (integration), `{module}_e2e_test.py` (E2E). **Dependency management**: `pyproject.toml` (config) + `uv.lock` (reproducible builds). **Key workflow**: `uv sync` (install), `uv run pytest` (test), `uv add package` (add dependency). **Speed**: UV installs packages 10-100x faster than pip, syncs in 2-3 seconds.

---

## Table of Contents

- [Overview](#overview)
- [Package Management with UV](#package-management-with-uv)
  - [Why UV Over Pip](#why-uv-over-pip)
  - [Python Packaging Tools Comparison](#python-packaging-tools-comparison)
  - [UV Installation](#uv-installation)
  - [UV Workflow](#uv-workflow)
  - [Common UV Commands](#common-uv-commands)
- [Project Configuration](#project-configuration)
  - [pyproject.toml](#pyprojecttoml)
  - [uv.lock](#uvlock)
- [Makefile Integration](#makefile-integration)
- [Directory Structure](#directory-structure)
- [Source Code Organization](#source-code-organization)
- [Test Organization](#test-organization)
- [Naming Conventions](#naming-conventions)
- [Examples](#examples)
- [Running Tests](#running-tests)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

---

## Overview

This guide defines the **PHD Systems & PHD Labs standard** for Python project setup, covering:

1. **Package Management**: UV as the exclusive package manager (NO pip)
2. **Build Automation**: Makefile for consistent commands across projects
3. **Project Structure**: Standardized directory layout and testing conventions
4. **Dependency Management**: pyproject.toml + uv.lock for reproducible builds

**Key Principles:**

1. **UV-only workflow**: Use UV for all package management (10-100x faster than pip)
2. **Makefile automation**: Standardized commands (`make install`, `make test`, `make ci`)
3. **Separation**: `src/main/` for application code, `src/test/` for tests
4. **Mirroring**: Test directory structure exactly mirrors source structure
5. **Co-location**: All test types for a module live in the same test directory
6. **Reproducibility**: Lock files (`uv.lock`) for deterministic builds
7. **Clarity**: File names clearly indicate test type and module

---

### What This Guide IS and IS NOT

**This guide IS:**
- ✅ **Physical project structure** - Where files go (`src/main/`, `src/test/`)
- ✅ **Package management** - How to install dependencies (UV)
- ✅ **Build automation** - How to run commands (Makefile)
- ✅ **Testing conventions** - How to organize and run tests
- ✅ **Dependency management** - How to manage dependencies (pyproject.toml, uv.lock)
- ✅ **Tool configuration** - How to configure pytest, black, ruff

**This guide is NOT:**
- ❌ **How to organize business logic** - Not covered here
- ❌ **Which architectural pattern to use** - Not covered here
- ❌ **Module dependencies and boundaries** - Not covered here
- ❌ **How to structure domain models** - Not covered here
- ❌ **How to design APIs or services** - Not covered here


**Example:**
```
This Guide (Setup)          Architecture Guide
      ↓                            ↓
src/main/                   ← What goes inside here?
    ├── ???/                  → Simple Modular: data/, models/, api/
    └── ???/                  → Hexagonal: domain/, ports/, adapters/
                              → Clean: entities/, use_cases/, interface_adapters/
```

**Both guides work together:**
- **Setup Guide** = The "container" (UV, Makefile, `src/main/` structure)
- **Architecture Guide** = The "contents" (what goes inside `src/main/`)

**You need both:**
1. Start here → Set up UV, Makefile, `src/main/` structure

---

## Package Management with UV

### Why UV Over Pip

**CRITICAL: Use UV exclusively. Never use pip for package management.**

| Feature | UV | pip | Winner |
|---------|-----|-----|--------|
| **Speed** | 10-100x faster | Baseline | 🏆 UV |
| **Implementation** | Rust (compiled) | Python (interpreted) | 🏆 UV |
| **Lock files** | Built-in (`uv.lock`) | Requires pip-tools | 🏆 UV |
| **Virtual envs** | Automatic | Manual `venv` | 🏆 UV |
| **Dependency resolution** | Fast, parallel | Slow, sequential | 🏆 UV |
| **Install time (PyTorch)** | 2-3 seconds | 3-5 minutes | 🏆 UV |
| **Reproducible builds** | Yes (uv.lock) | No (without extras) | 🏆 UV |
| **Project scaffolding** | `uv init` | Manual | 🏆 UV |
| **Run scripts** | `uv run` | Activate venv first | 🏆 UV |
| **Maturity** | New (2023) | Legacy (2008) | ⚠️ pip |

**Real-world speed comparison (example project):**
```bash
# UV: Install PyTorch CUDA + 50 dependencies
time uv sync
# Output: 2-3 seconds

# pip: Same installation
time pip install torch pandas numpy scikit-learn ...
# Output: 3-5 minutes
```

**Speed improvement: 60-100x faster**

### Python Packaging Tools Comparison

| Tool | Purpose | Speed | Lock Files | Best For | Recommendation |
|------|---------|-------|------------|----------|----------------|
| **UV** | All-in-one package manager | ⚡⚡⚡ 10-100x | ✅ Built-in | Everything | 🏆 **USE THIS** |
| **pip** | Legacy package installer | 🐌 Baseline | ❌ No | Nothing (deprecated) | ❌ **NEVER USE** |
| **pip-tools** | pip + lock files | 🐌 Slow | ✅ Manual | Legacy projects only | ⚠️ Avoid |
| **Poetry** | Package + dependency manager | 🐢 2-5x | ✅ Built-in | Poetry-locked projects | ⚠️ Avoid (slow) |
| **PDM** | Modern package manager | ⚡ 5-10x | ✅ Built-in | PEP 582 projects | ⚠️ Less mature |
| **Pipenv** | pip + virtualenv wrapper | 🐢 1-2x | ✅ Built-in | Legacy projects only | ❌ Deprecated |
| **conda** | Science package manager | 🐢 2-3x | ✅ Built-in | Data science (binary deps) | ⚠️ Special cases only |

**Why UV wins:**

1. **Speed**: Rust-based, parallel dependency resolution, cached downloads
2. **Simplicity**: One tool does everything (pip + venv + pip-tools + poetry)
3. **Modern**: Built for Python 3.10+, supports PEP 621 (pyproject.toml)
4. **Lockfiles**: Automatic `uv.lock` generation for reproducible builds
5. **No lock-in**: Uses standard `pyproject.toml`, can switch to other tools
6. **Active development**: Backed by Astral (creators of Ruff)

**When to use alternatives:**
- **conda**: Only if you need binary dependencies (CUDA, MKL, specific compilers) that aren't available via PyPI
- **Poetry/PDM**: Only if already locked into their ecosystems (not recommended for new projects)
- **pip**: Never (UV is a drop-in replacement)

### UV Installation

**Linux / macOS:**
```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify installation
uv --version
```

**Windows:**
```powershell
# Install UV
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify installation
uv --version
```

**Update UV:**
```bash
uv self update
```

### UV Workflow

**1. Initialize New Project**
```bash
# Create new project with UV
uv init my-project
cd my-project

# UV creates:
# - pyproject.toml (project config)
# - .python-version (Python version)
# - README.md
# - .gitignore
```

**2. Add Dependencies**
```bash
# Add production dependency
uv add pandas numpy scikit-learn

# Add dev dependency (testing, linting)
uv add --dev pytest black ruff

# Add with version constraint
uv add "torch>=2.0,<3.0"

# Add from git
uv add git+https://github.com/user/repo.git

# Add local package (editable)
uv add -e ./local-package
```

**3. Install Dependencies**
```bash
# Install all dependencies (creates .venv automatically)
uv sync

# Install with dev dependencies
uv sync --dev

# Install without dev dependencies (production)
uv sync --no-dev
```

**4. Run Commands**
```bash
# Run Python script (no need to activate venv!)
uv run python script.py

# Run module
uv run pytest src/test/ -v

# Run with CLI tool
uv run black src/

# Activate venv manually (if needed)
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
```

**5. Update Dependencies**
```bash
# Update all dependencies
uv lock --upgrade

# Update specific package
uv add --upgrade pandas

# Re-sync after update
uv sync
```

### Common UV Commands

| Command | Description | Example |
|---------|-------------|---------|
| `uv init` | Create new project | `uv init my-project` |
| `uv add` | Add dependency | `uv add pandas` |
| `uv add --dev` | Add dev dependency | `uv add --dev pytest` |
| `uv remove` | Remove dependency | `uv remove pandas` |
| `uv sync` | Install dependencies | `uv sync` |
| `uv lock` | Update lock file | `uv lock --upgrade` |
| `uv run` | Run command in venv | `uv run pytest` |
| `uv pip` | pip-compatible interface | `uv pip list` |
| `uv venv` | Create virtual env | `uv venv` |
| `uv self update` | Update UV itself | `uv self update` |

**UV vs pip command mapping:**

| pip Command | UV Equivalent | Speed Improvement |
|-------------|---------------|-------------------|
| `pip install pandas` | `uv add pandas` | 10-100x |
| `pip install -r requirements.txt` | `uv sync` | 10-100x |
| `pip install -e .` | `uv sync` | 10-100x |
| `pip freeze > requirements.txt` | `uv lock` | Automatic |
| `python -m venv .venv` | `uv venv` (auto) | Instant |
| `source .venv/bin/activate && python` | `uv run python` | No activation needed |
| `pip list` | `uv pip list` | Same |
| `pip show pandas` | `uv pip show pandas` | Same |

---

## Project Configuration

### pyproject.toml

**Standard configuration for UV projects:**

```toml
[project]
name = "your-project"
version = "0.1.0"
description = "Your project description"
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "pandas>=2.0.0",
    "numpy>=1.24.0",
    "scikit-learn>=1.3.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["src/test"]
python_files = ["*_test.py", "*_it_test.py", "*_e2e_test.py"]
addopts = "-v --strict-markers"

[tool.black]
line-length = 100
target-version = ["py310"]
include = '\.pyi?$'

[tool.ruff]
line-length = 100
target-version = "py310"
select = ["E", "F", "W", "I"]
ignore = []

[tool.coverage.run]
source = ["src/main"]
omit = ["src/test/*"]
```

**Key sections:**

1. **`[project]`**: Package metadata, Python version, core dependencies
2. **`[project.optional-dependencies]`**: Dev dependencies (testing, linting)
3. **`[build-system]`**: Build backend (hatchling, setuptools, etc.)
4. **`[tool.*]`**: Tool-specific configuration (pytest, black, ruff)

### uv.lock

**UV's lock file for reproducible builds:**

- **Auto-generated**: Created by `uv sync` or `uv lock`
- **Commit to git**: Ensures reproducible builds across team
- **Contains**: Exact versions + hashes of all dependencies (including transitive)
- **Fast resolution**: UV resolves dependencies in parallel

**Example workflow:**
```bash
# Developer A: Add dependency
uv add pandas
uv sync  # Updates uv.lock

# Commit changes
git add pyproject.toml uv.lock
git commit -m "feat: add pandas dependency"

# Developer B: Sync exact same versions
git pull
uv sync  # Installs exact versions from uv.lock (2-3 sec)
```

**Benefits:**
- ✅ **Reproducible**: Same versions across dev/staging/production
- ✅ **Fast**: Lock file includes resolved dependencies (no re-resolution)
- ✅ **Secure**: Hashes verify package integrity
- ✅ **Transparent**: Human-readable TOML format

---

## Makefile Integration

**Combine UV with Makefile for standardized project commands:**

```makefile
# Makefile for Python project with UV

.PHONY: help install install-dev clean test e2e integration test-all lint format check ci

help:
	@echo "Available targets:"
	@echo "  make install       - Install production dependencies"
	@echo "  make install-dev   - Install with dev dependencies"
	@echo "  make clean         - Remove virtual environment and cache"
	@echo "  make test          - Run unit tests with linting"
	@echo "  make e2e           - Run E2E tests with linting"
	@echo "  make integration   - Run integration tests with linting"
	@echo "  make test-all      - Run all tests with linting"
	@echo "  make lint          - Run linting only"
	@echo "  make format        - Format code with Black"
	@echo "  make check         - Run test-all (pre-commit)"
	@echo "  make ci            - Full CI pipeline"

# Installation
install:
	@echo "Installing dependencies with UV..."
	uv sync --no-dev

install-dev:
	@echo "Installing dependencies with dev tools..."
	uv sync

# Cleanup
clean:
	@echo "Cleaning up..."
	rm -rf .venv/
	rm -rf .pytest_cache/
	rm -rf __pycache__/
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name "__pycache__" -exec rm -rf {} +

# Testing
test:
	@echo "Running unit tests with linting..."
	uv run ruff check src/main/ src/test/
	uv run pytest src/test/unit/ -v

e2e:
	@echo "Running E2E tests with linting..."
	uv run ruff check src/main/ src/test/
	uv run pytest src/test/end_to_end_e2e_test.py -v

integration:
	@echo "Running integration tests with linting..."
	uv run ruff check src/main/ src/test/
	uv run pytest src/test/integration/ -v

test-all:
	@echo "Running all tests with linting..."
	uv run ruff check src/main/ src/test/
	uv run pytest src/test/ -v --cov=src/main --cov-report=html

# Code Quality
lint:
	@echo "Running linting..."
	uv run ruff check src/main/ src/test/

format:
	@echo "Formatting code..."
	uv run black src/main/ src/test/
	uv run ruff check --fix src/main/ src/test/

# Workflows
check: test-all

ci: clean install-dev test-all
	@echo "CI pipeline completed successfully!"
```

**Benefits:**

1. **Consistency**: Same commands across all projects
2. **Integration**: UV + pytest + linting in single commands
3. **Fast feedback**: `make test` runs unit tests only (seconds)
4. **Quality gates**: `make check` ensures comprehensive testing
5. **CI/CD ready**: `make ci` replicates CI pipeline locally
6. **Team alignment**: Everyone uses same commands

**Usage:**
```bash
# Initial setup
make install-dev

# Development workflow
make format  # Format code
make test    # Quick unit tests (seconds)
make check   # Full testing before commit

# CI/CD
make ci      # Replicate CI pipeline locally
```

---

## Directory Structure

### Basic Structure

```
your-project/
├── src/
│   ├── main/              # Application source code
│   │   ├── __init__.py
│   │   ├── module1/
│   │   ├── module2/
│   │   └── utils/
│   │
│   └── test/              # Test suite (mirrors src/main/)
│       ├── __init__.py
│       ├── module1/
│       ├── module2/
│       └── utils/
│
├── configs/               # Configuration files
├── data/                  # Data files (gitignored)
├── docs/                  # Documentation
├── pyproject.toml         # Project configuration
├── uv.lock                # Dependency lock file (or requirements.txt)
└── README.md
```

### Complete Example Structure

```
your-project/
├── src/
│   ├── main/                          # Application code
│   │   ├── __init__.py
│   │   │
│   │   ├── data/                      # Data pipeline module
│   │   │   ├── __init__.py
│   │   │   ├── ingestion.py           # Data fetching
│   │   │   ├── validation.py          # Data validation
│   │   │   └── preprocessing.py       # Data preprocessing
│   │   │
│   │   ├── models/                    # Model implementations
│   │   │   ├── __init__.py
│   │   │   ├── base.py                # Base classes
│   │   │   ├── classifier.py          # Classification models
│   │   │   └── regressor.py           # Regression models
│   │   │
│   │   ├── training/                  # Training framework
│   │   │   ├── __init__.py
│   │   │   ├── trainer.py             # Training loop
│   │   │   └── callbacks.py           # Training callbacks
│   │   │
│   │   ├── api/                       # API layer
│   │   │   ├── __init__.py
│   │   │   ├── routes.py              # API routes
│   │   │   └── schemas.py             # Request/response schemas
│   │   │
│   │   └── utils/                     # Utilities
│   │       ├── __init__.py
│   │       ├── logging.py             # Logging utilities
│   │       └── config.py              # Configuration loader
│   │
│   └── test/                          # Test suite (mirrors main/)
│       ├── __init__.py
│       │
│       ├── data/                      # Tests for data module
│       │   ├── __init__.py
│       │   ├── ingestion_test.py      # Unit: mocked API calls
│       │   ├── ingestion_it_test.py   # Integration: real API
│       │   ├── ingestion_e2e_test.py  # E2E: full pipeline
│       │   ├── validation_test.py
│       │   ├── validation_it_test.py
│       │   ├── preprocessing_test.py
│       │   └── preprocessing_e2e_test.py
│       │
│       ├── models/                    # Tests for models module
│       │   ├── __init__.py
│       │   ├── base_test.py
│       │   ├── classifier_test.py
│       │   ├── classifier_it_test.py
│       │   ├── regressor_test.py
│       │   └── regressor_it_test.py
│       │
│       ├── training/                  # Tests for training module
│       │   ├── __init__.py
│       │   ├── trainer_test.py
│       │   ├── trainer_it_test.py
│       │   ├── trainer_e2e_test.py
│       │   └── callbacks_test.py
│       │
│       ├── api/                       # Tests for API module
│       │   ├── __init__.py
│       │   ├── routes_test.py
│       │   ├── routes_it_test.py      # Integration: test routes
│       │   ├── routes_e2e_test.py     # E2E: full request cycle
│       │   └── schemas_test.py
│       │
│       └── utils/                     # Tests for utils module
│           ├── __init__.py
│           ├── logging_test.py
│           └── config_test.py
```

---

## Source Code Organization

### Module Structure

```python
# src/main/{module_name}/{file_name}.py

"""
Module docstring describing purpose.

This module handles [specific responsibility].
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class YourClass:
    """Class docstring."""

    def your_method(self, param: str) -> Any:
        """Method docstring with type hints."""
        logger.info(f"Processing {param}")
        # Implementation
        return result
```

### Common Module Types

1. **Data modules** (`data/`)
   - `ingestion.py` - Data fetching from sources
   - `validation.py` - Data quality checks
   - `preprocessing.py` - Data transformation

2. **Model modules** (`models/`)
   - `base.py` - Base classes and interfaces
   - `{model_name}.py` - Specific model implementations

3. **Training modules** (`training/`)
   - `trainer.py` - Training orchestration
   - `callbacks.py` - Training hooks

4. **API modules** (`api/`)
   - `routes.py` - API endpoints
   - `schemas.py` - Request/response validation

5. **Utility modules** (`utils/`)
   - `config.py` - Configuration management
   - `logging.py` - Logging setup

---

## Test Organization

### Test Structure Principles

1. **Mirror source structure**: Test directories exactly match source directories
2. **Co-locate test types**: All tests for a module in the same directory
3. **Clear naming**: File name indicates test type and target module
4. **Organized by module**: Not by test type

### Test Types

| Type | Suffix | Speed | Dependencies | Purpose |
|------|--------|-------|--------------|---------|
| **Unit** | `_test.py` | Fast (ms) | Mocked | Test individual functions/classes |
| **Integration** | `_it_test.py` | Medium (sec) | Real external systems | Test component interactions |
| **E2E** | `_e2e_test.py` | Slow (min) | Full system | Test complete workflows |

### Test Type Guidelines

**Unit Tests** (`{module}_test.py`):
- Test individual functions or classes in isolation
- Mock all external dependencies (DB, API, filesystem, etc.)
- Should run in milliseconds
- Focus on logic correctness

**Integration Tests** (`{module}_it_test.py`):
- Test interactions between components
- Use real external systems (test DB, API, files)
- May require setup/teardown
- Test component boundaries

**E2E Tests** (`{module}_e2e_test.py`):
- Test complete workflows from start to finish
- Use realistic data and scenarios
- May take minutes to run
- Test user-facing functionality

---

## Naming Conventions

### File Naming

```
# Source files: descriptive names in snake_case
src/main/data/ingestion.py
src/main/models/classifier.py
src/main/api/routes.py

# Test files: source name + suffix
src/test/data/ingestion_test.py          # Unit tests
src/test/data/ingestion_it_test.py       # Integration tests
src/test/data/ingestion_e2e_test.py      # E2E tests
```

### Test Class Naming

```python
# src/test/data/ingestion_test.py

class TestDataIngestion:
    """Unit tests for data ingestion module."""

    def test_parse_csv(self):
        """Test CSV parsing with valid data."""
        pass

    def test_parse_csv_invalid_format(self):
        """Test CSV parsing with invalid format."""
        pass


# src/test/data/ingestion_it_test.py

class TestDataIngestionIntegration:
    """Integration tests for data ingestion."""

    def test_fetch_from_api(self):
        """Test fetching data from real API."""
        pass


# src/test/data/ingestion_e2e_test.py

class TestDataIngestionE2E:
    """E2E tests for data ingestion pipeline."""

    def test_complete_ingestion_workflow(self):
        """Test complete workflow: fetch → validate → store."""
        pass
```

---

## Examples

### Example 1: Simple Data Module

**Source:** `src/main/data/ingestion.py`
```python
"""Data ingestion module."""

import logging
import requests
from typing import Dict, List

logger = logging.getLogger(__name__)


def fetch_data(url: str) -> List[Dict]:
    """
    Fetch data from API endpoint.

    Args:
        url: API endpoint URL

    Returns:
        List of data records

    Raises:
        requests.RequestException: If API call fails
    """
    logger.info(f"Fetching data from {url}")
    response = requests.get(url)
    response.raise_for_status()
    return response.json()
```

**Unit Test:** `src/test/data/ingestion_test.py`
```python
"""Unit tests for data ingestion."""

import pytest
from unittest.mock import Mock, patch
from src.main.data.ingestion import fetch_data


class TestDataIngestion:
    """Unit tests for data ingestion module."""

    @patch('src.main.data.ingestion.requests.get')
    def test_fetch_data_success(self, mock_get):
        """Test successful data fetching with mocked API."""
        # Mock API response
        mock_response = Mock()
        mock_response.json.return_value = [{"id": 1, "value": "test"}]
        mock_get.return_value = mock_response

        # Test
        result = fetch_data("https://api.example.com/data")

        # Assert
        assert len(result) == 1
        assert result[0]["id"] == 1
        mock_get.assert_called_once_with("https://api.example.com/data")

    @patch('src.main.data.ingestion.requests.get')
    def test_fetch_data_api_error(self, mock_get):
        """Test handling of API errors."""
        mock_get.side_effect = requests.RequestException("API Error")

        with pytest.raises(requests.RequestException):
            fetch_data("https://api.example.com/data")
```

**Integration Test:** `src/test/data/ingestion_it_test.py`
```python
"""Integration tests for data ingestion."""

import pytest
from src.main.data.ingestion import fetch_data


class TestDataIngestionIntegration:
    """Integration tests using real API calls."""

    @pytest.mark.slow
    def test_fetch_from_real_api(self):
        """Test fetching from real test API."""
        # Use a test API endpoint
        url = "https://jsonplaceholder.typicode.com/posts/1"

        result = fetch_data(url)

        # Verify real API response structure
        assert isinstance(result, dict)
        assert "id" in result
        assert "title" in result
```

**E2E Test:** `src/test/data/ingestion_e2e_test.py`
```python
"""E2E tests for complete ingestion pipeline."""

import pytest
from src.main.data.ingestion import fetch_data
from src.main.data.validation import validate_data
from src.main.data.preprocessing import preprocess_data


class TestDataIngestionE2E:
    """E2E tests for complete data pipeline."""

    @pytest.mark.slow
    def test_complete_pipeline(self, tmp_path):
        """Test complete ingestion workflow: fetch → validate → preprocess."""
        # Fetch
        url = "https://jsonplaceholder.typicode.com/posts"
        raw_data = fetch_data(url)

        # Validate
        valid_data = validate_data(raw_data)
        assert len(valid_data) > 0

        # Preprocess
        processed_data = preprocess_data(valid_data)
        assert len(processed_data) > 0

        # Verify final output format
        assert all("id" in item for item in processed_data)
```

### Example 2: Model with Multiple Test Types

**Source:** `src/main/models/classifier.py`

**Tests:**
```
src/test/models/
├── classifier_test.py      # Unit: test model logic with toy data
├── classifier_it_test.py   # Integration: test model training
└── classifier_e2e_test.py  # E2E: train → evaluate → predict
```

---

## Running Tests

### Recommended Makefile Setup

Add these targets to your `Makefile` for standardized test commands:

```makefile
# Testing targets
.PHONY: test e2e integration test-all lint check ci

test:
	@echo "Running unit tests with linting..."
	uv run ruff check src/main/ src/test/
	uv run pytest src/test/unit/ -v

e2e:
	@echo "Running E2E tests with linting..."
	uv run ruff check src/main/ src/test/
	uv run pytest src/test/end_to_end_e2e_test.py -v

integration:
	@echo "Running integration tests with linting..."
	uv run ruff check src/main/ src/test/
	uv run pytest src/test/integration/ -v

test-all:
	@echo "Running all tests with linting..."
	uv run ruff check src/main/ src/test/
	uv run pytest src/test/ -v

lint:
	@echo "Running linting..."
	uv run ruff check src/main/ src/test/

check: test-all

ci: clean install-dev test-all
```

### Quick Test Commands (with Makefile)

| Command | What It Does | Test Scope |
|---------|-------------|------------|
| `make test` | Unit tests + linting | `src/test/unit/` |
| `make e2e` | E2E tests + linting | `src/test/end_to_end_e2e_test.py` |
| `make integration` | Integration tests + linting | `src/test/integration/` |
| `make test-all` | All tests + linting | `src/test/` (everything) |
| `make lint` | Linting only | All code |
| `make check` | Alias for `test-all` | Full suite |
| `make ci` | Full CI pipeline | Clean + install + test-all |

### Basic Commands (pytest)

```bash
# Run all tests
pytest src/test/ -v

# Run tests for specific module
pytest src/test/data/ -v

# Run specific test file
pytest src/test/data/ingestion_test.py -v

# Run specific test function
pytest src/test/data/ingestion_test.py::TestDataIngestion::test_fetch_data_success -v
```

### Filter by Test Type

```bash
# Run only unit tests (fast)
pytest src/test/unit/ -v
# or: pytest src/test/ -k "not it_test and not e2e_test" -v

# Run only integration tests
pytest src/test/integration/ -v
# or: pytest src/test/ -k "it_test" -v

# Run only E2E tests
pytest src/test/ -k "e2e_test" -v

# Run fast tests only (skip @pytest.mark.slow)
pytest src/test/ -m "not slow" -v
```

### Coverage Reports

```bash
# Run with coverage
pytest src/test/ --cov=src/main --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Parallel Execution

```bash
# Install pytest-xdist
pip install pytest-xdist

# Run tests in parallel
pytest src/test/ -n auto
```

---

## Best Practices

### 1. Use Makefile for Standardized Test Commands

**Recommended:** Add Makefile targets for consistent test execution across the team:

```makefile
# Benefits:
# ✅ Consistent commands across all projects
# ✅ Integrates linting with testing automatically
# ✅ Clear separation between test types (unit, integration, E2E)
# ✅ Easy CI/CD integration

test:        # Fast feedback (unit tests only)
e2e:         # Test complete workflows
integration: # Test component interactions
test-all:    # Comprehensive testing (pre-commit)
check:       # Alias for test-all
ci:          # Full CI pipeline
```

**Why this matters:**
- 🚀 **Fast feedback loop**: `make test` runs only unit tests (seconds)
- 🔍 **Selective testing**: Run only the tests you need during development
- ✅ **Quality gates**: `make check` ensures everything passes before commit
- 🤖 **CI/CD ready**: `make ci` replicates CI pipeline locally

### 2. One Test File Per Source File (Minimum)

Every source file should have at least a unit test file:

```
src/main/data/ingestion.py    → src/test/data/ingestion_test.py (required)
                              → src/test/data/ingestion_it_test.py (optional)
                              → src/test/data/ingestion_e2e_test.py (optional)
```

### 3. Co-locate Related Tests

All tests for a module go in the same directory:

```
✅ Good:
src/test/data/
├── ingestion_test.py
├── ingestion_it_test.py
└── ingestion_e2e_test.py

❌ Bad:
src/test/unit/data/ingestion_test.py
src/test/integration/data/ingestion_test.py
src/test/e2e/data/ingestion_test.py
```

### 4. Use Descriptive Test Names

```python
✅ Good:
def test_fetch_data_with_valid_url_returns_json():
    pass

def test_fetch_data_with_invalid_url_raises_exception():
    pass

❌ Bad:
def test_1():
    pass

def test_fetch():
    pass
```

### 5. Mark Slow Tests

```python
import pytest

@pytest.mark.slow
def test_complete_training_pipeline():
    """This test takes 5+ minutes."""
    pass
```

### 6. Use Fixtures for Common Setup

```python
# conftest.py
import pytest

@pytest.fixture
def sample_data():
    """Provide sample data for tests."""
    return [{"id": 1, "value": "test"}]

# ingestion_test.py
def test_process_data(sample_data):
    """Test using fixture."""
    result = process(sample_data)
    assert len(result) == 1
```

### 7. Keep Tests Independent

Each test should be able to run independently:

```python
✅ Good:
def test_a(self):
    data = create_test_data()
    result = process(data)
    assert result is not None

def test_b(self):
    data = create_test_data()  # Own data
    result = process(data)
    assert result is not None

❌ Bad:
def test_a(self):
    self.data = create_test_data()  # Shared state

def test_b(self):
    result = process(self.data)  # Depends on test_a
```

### 8. Test One Thing Per Test

```python
✅ Good:
def test_validate_email_format():
    """Test email format validation."""
    assert validate_email("test@example.com") is True

def test_validate_email_rejects_invalid():
    """Test rejection of invalid emails."""
    assert validate_email("invalid") is False

❌ Bad:
def test_validation():
    """Test everything at once."""
    assert validate_email("test@example.com") is True
    assert validate_phone("123-456-7890") is True
    assert validate_zip("12345") is True
```

---

## Migration Guide

### From pip to UV

**CRITICAL: Migrate all projects to UV. Never use pip for new projects.**

#### Step 1: Install UV

```bash
# Linux / macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify
uv --version
```

#### Step 2: Convert requirements.txt to pyproject.toml

**If you have `requirements.txt`:**

```bash
# Option 1: Let UV initialize project
uv init --no-workspace

# Option 2: Manually create pyproject.toml
# See "Project Configuration" section for template
```

**Convert dependencies:**
```bash
# Old (pip)
pip install -r requirements.txt

# New (UV) - automatically reads requirements.txt
uv add $(cat requirements.txt)

# Or add dependencies manually
uv add pandas numpy scikit-learn
uv add --dev pytest black ruff
```

#### Step 3: Generate Lock File

```bash
# UV automatically creates uv.lock
uv sync

# Commit lock file
git add pyproject.toml uv.lock
git commit -m "build: migrate from pip to UV"
```

#### Step 4: Update Scripts and CI/CD

**Old (pip):**
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
```

**New (UV):**
```bash
uv sync           # Creates .venv automatically
uv run pytest     # No activation needed!
```

**Update CI/CD (GitHub Actions example):**

```yaml
# Old (pip)
- name: Install dependencies
  run: |
    python -m pip install --upgrade pip
    pip install -r requirements.txt

# New (UV)
- name: Install UV
  run: curl -LsSf https://astral.sh/uv/install.sh | sh

- name: Install dependencies
  run: uv sync
```

#### Step 5: Remove pip Files

```bash
# Remove old pip files
rm requirements.txt requirements-dev.txt

# Keep only UV files
# ✅ pyproject.toml
# ✅ uv.lock
# ✅ .venv/ (gitignored)
```

#### Step 6: Update Documentation

Update README.md and developer guides:

```markdown
# Old (pip)
## Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

# New (UV)
## Setup
```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Run tests
uv run pytest
```
```

### From Poetry/Pipenv to UV

**Poetry migration:**

```bash
# UV can read Poetry's pyproject.toml
uv sync  # Automatically detects Poetry format

# Generate uv.lock
uv lock

# Remove Poetry files (optional)
rm poetry.lock

# Remove Poetry from dev dependencies
uv remove --dev poetry
```

**Pipenv migration:**

```bash
# Convert Pipfile to pyproject.toml (manual)
# 1. Create pyproject.toml (see template)
# 2. Add dependencies from Pipfile

# Install with UV
uv sync

# Remove Pipenv files
rm Pipfile Pipfile.lock

# Remove Pipenv
pip uninstall pipenv
```

### From Old Project Structure to New Structure

**Old structure:**
```
project/
├── src/
│   ├── module1.py
│   └── module2.py
└── tests/
    ├── test_module1.py
    └── test_module2.py
```

**New structure:**
```
project/
├── src/
│   ├── main/
│   │   ├── module1.py
│   │   └── module2.py
│   └── test/
│       ├── module1_test.py
│       └── module2_test.py
├── pyproject.toml  # UV config
├── uv.lock         # UV lock file
└── Makefile        # Build automation
```

#### Migration Steps

1. **Migrate to UV first (see above)**

2. **Create new directories:**
   ```bash
   mkdir -p src/main src/test
   ```

3. **Move source files:**
   ```bash
   mv src/*.py src/main/
   ```

4. **Move and rename test files:**
   ```bash
   mv tests/test_module1.py src/test/module1_test.py
   mv tests/test_module2.py src/test/module2_test.py
   ```

5. **Update imports:**
   ```python
   # Old
   from module1 import func

   # New
   from src.main.module1 import func
   ```

6. **Update test imports:**
   ```python
   # Old
   from module1 import func

   # New
   from src.main.module1 import func
   ```

7. **Create Makefile (see "Makefile Integration" section)**

8. **Remove old directories:**
   ```bash
   rmdir tests/
   ```

9. **Verify migration:**
   ```bash
   make install-dev
   make test
   ```

### Complete Migration Checklist

- [ ] Install UV (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- [ ] Create `pyproject.toml` (see template)
- [ ] Convert dependencies from `requirements.txt` or `Pipfile`
- [ ] Generate `uv.lock` (`uv sync`)
- [ ] Create Makefile (see template)
- [ ] Migrate to `src/main/` and `src/test/` structure
- [ ] Update imports in all files
- [ ] Update CI/CD pipelines to use UV
- [ ] Remove old files (`requirements.txt`, `Pipfile`, `poetry.lock`)
- [ ] Update documentation (README.md, developer guides)
- [ ] Test migration (`make ci`)
- [ ] Commit changes (`git add . && git commit -m "build: migrate to UV + new structure"`)

**Estimated time:**
- Small project (<10 files): 15-30 minutes
- Medium project (10-50 files): 1-2 hours
- Large project (50+ files): 2-4 hours

---

## Summary

**Key Takeaways:**

1. ✅ **Use UV exclusively** - Never use pip (10-100x faster, built-in lock files)
2. ✅ **Standardized commands** - Use Makefile for consistency (`make install`, `make test`, `make ci`)
3. ✅ **Project structure** - Separate `src/main/` (application) from `src/test/` (tests)
4. ✅ **Test mirroring** - Test structure mirrors source structure exactly
5. ✅ **Test naming** - `{module}_test.py`, `{module}_it_test.py`, `{module}_e2e_test.py`
6. ✅ **Test co-location** - All test types for a module in same directory
7. ✅ **Dependency management** - `pyproject.toml` + `uv.lock` for reproducible builds
8. ✅ **Integrated quality** - Linting runs automatically with testing
9. ✅ **Fast feedback** - `make test` runs unit tests in seconds
10. ✅ **Independent tests** - Tests can run in any order

**Benefits:**

- ⚡ **Speed**: UV installs packages 10-100x faster than pip (2-3 sec vs 3-5 min for PyTorch)
- 🔒 **Reproducibility**: `uv.lock` ensures same versions across dev/staging/production
- 🎯 **Easy navigation**: Test location is predictable from source location
- 🚀 **Scalable**: Structure works for small and large projects
- 🔍 **Clear intent**: File names show test type and target module
- 🔧 **Selective testing**: Run only what you need during development (`make test`, `make integration`, `make e2e`)
- 🤝 **Team consistency**: Same commands and structure across all projects
- 🤖 **CI/CD ready**: `make ci` replicates full CI pipeline locally
- 📦 **No lock-in**: Standard `pyproject.toml` format, can switch tools if needed

**Quick Start (30 seconds):**

```bash
# 1. Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Initialize project
uv init my-project
cd my-project

# 3. Add dependencies
uv add pandas numpy scikit-learn
uv add --dev pytest black ruff

# 4. Create Makefile (copy from template above)
# 5. Create src/main/ and src/test/ directories
mkdir -p src/main src/test

# 6. Choose architecture pattern (see Architecture Patterns Guide)
# Example: Simple Modular
mkdir -p src/main/{data,models,api}

# 7. Start developing
make install-dev
make test
```

**PHD Systems & PHD Labs Standard:**
- ✅ All new projects use UV (no pip)
- ✅ All projects follow `src/main/` + `src/test/` structure
- ✅ All projects use Makefile for build automation
- ✅ All projects commit `uv.lock` for reproducibility
- ✅ All projects use conventional commit messages (no AI attributions)

**Next Steps:**
- ✅ You've set up the project structure (this guide)
- 🚀 Start developing with your chosen architecture pattern

---

**Document Type:** Setup Guide & Template
**Last Updated:** 2025-10-20
**Version:** 2.0

**Major Changes in v2.0:**
- ✅ Added comprehensive UV package manager documentation
- ✅ Added Python packaging tools comparison (UV, pip, Poetry, PDM, conda)
- ✅ Added complete Makefile integration guide
- ✅ Added pyproject.toml and uv.lock configuration examples
- ✅ Added migration guide from pip/Poetry/Pipenv to UV
- ✅ Renamed from "python-project-structure.md" to "python-project-setup.md"
- ✅ Updated to PHD Systems & PHD Labs standard (UV-only, no pip)
