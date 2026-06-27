from unittest.mock import patch
import mongomock

# Patch before importing main so the module-level MongoClient() call gets a mock
patch("pymongo.MongoClient", mongomock.MongoClient).start()

from fastapi.testclient import TestClient  # noqa: E402
from main import app, canvases as _canvases  # noqa: E402

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def clean_db():
    _canvases.drop()
    yield
    _canvases.drop()


@pytest.fixture
def client():
    return TestClient(app)
