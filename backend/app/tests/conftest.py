import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

client = TestClient(app)

@pytest.fixture
def test_client():
    return client
