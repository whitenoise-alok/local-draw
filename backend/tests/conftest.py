from unittest.mock import patch
import mongomock

# Patch before importing main so the module-level MongoClient() call gets a mock
patch("pymongo.MongoClient", mongomock.MongoClient).start()

import os  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402
from main import app, canvases as _canvases, UPLOADS_DIR  # noqa: E402

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def clean_db():
    _canvases.drop()
    yield
    _canvases.drop()


@pytest.fixture(autouse=True)
def clean_uploads():
    """Remove only files created during the test, leaving any real uploads intact."""
    before = set(os.listdir(UPLOADS_DIR)) if os.path.isdir(UPLOADS_DIR) else set()
    yield
    after = set(os.listdir(UPLOADS_DIR)) if os.path.isdir(UPLOADS_DIR) else set()
    for name in after - before:
        os.remove(os.path.join(UPLOADS_DIR, name))


@pytest.fixture
def client():
    return TestClient(app)
