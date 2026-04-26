"""
pytest tests for the prediction service.
Run: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app

client = TestClient(app)

VALID_CHECKINS = [
    {"energy": 2, "stress": 4, "workload": 4, "sentiment_score": -0.3, "checked_in_at": "2026-04-20T09:00:00Z"},
    {"energy": 3, "stress": 3, "workload": 3, "sentiment_score": 0.0,  "checked_in_at": "2026-04-19T09:00:00Z"},
    {"energy": 4, "stress": 2, "workload": 2, "sentiment_score": 0.2,  "checked_in_at": "2026-04-18T09:00:00Z"},
]


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_predict_basic():
    r = client.post("/predict", json={
        "user_id": "test-user-1",
        "energy": 2, "stress": 4, "workload": 4,
        "sentiment_score": -0.4
    }, headers={"x-internal-secret": ""})
    assert r.status_code == 200
    body = r.json()
    assert 0.0 <= body["risk_score"] <= 1.0
    assert body["risk_level"] in ("low", "medium", "high")


def test_predict_with_history():
    r = client.post("/predict", json={
        "user_id": "test-user-2",
        "checkins": VALID_CHECKINS,
    })
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body["contributing_factors"], list)


def test_predict_high_risk():
    r = client.post("/predict", json={
        "user_id": "test-high",
        "energy": 1, "stress": 5, "workload": 5,
        "sentiment_score": -0.9,
        "checkins": [
            {"energy": 1, "stress": 5, "workload": 5, "sentiment_score": -0.9,
             "checked_in_at": f"2026-04-{20-i:02d}T09:00:00Z"}
            for i in range(10)
        ],
    })
    assert r.status_code == 200
    assert r.json()["risk_level"] == "high"
    assert r.json()["predicted_burnout_date"] is not None


def test_predict_low_risk():
    r = client.post("/predict", json={
        "user_id": "test-low",
        "energy": 5, "stress": 1, "workload": 1,
        "sentiment_score": 0.8,
    })
    assert r.status_code == 200
    assert r.json()["risk_level"] == "low"


def test_predict_missing_fields_422():
    r = client.post("/predict", json={"user_id": "test"})
    assert r.status_code == 422


def test_predict_invalid_range_422():
    r = client.post("/predict", json={
        "user_id": "test",
        "energy": 6, "stress": 0, "workload": 3,
    })
    assert r.status_code == 422


def test_risk_score_bounds():
    """Risk score must always be 0.0–1.0 regardless of inputs."""
    for energy, stress, workload in [(1, 5, 5), (5, 1, 1), (3, 3, 3)]:
        r = client.post("/predict", json={
            "user_id": "bounds-test",
            "energy": energy, "stress": stress, "workload": workload,
        })
        assert 0.0 <= r.json()["risk_score"] <= 1.0
