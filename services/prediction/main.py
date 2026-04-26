"""
Resylia Burnout Prediction Microservice
Phase 1: Rule-based scoring (no training data yet)
Phase 2: LightGBM trained on accumulated check-in data
Deploy on Railway (always-on Python service)
"""

import os
import math
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

app = FastAPI(title="Resylia Prediction Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.resylia.com"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

INTERNAL_SECRET = os.getenv("PREDICTION_SERVICE_SECRET", "")

# ── Auth ──────────────────────────────────────────────────────────────────────

def verify_internal_secret(x_internal_secret: str = Header(default="")):
    if INTERNAL_SECRET and x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

# ── Schemas ───────────────────────────────────────────────────────────────────

class CheckinRecord(BaseModel):
    energy: int = Field(..., ge=1, le=5)
    stress: int = Field(..., ge=1, le=5)
    workload: int = Field(..., ge=1, le=5)
    sentiment_score: float = Field(default=0.0, ge=-1.0, le=1.0)
    checked_in_at: str  # ISO datetime string

class PredictRequest(BaseModel):
    user_id: str
    checkins: list[CheckinRecord] = Field(default_factory=list)
    # Single check-in mode (from check-in submission)
    energy: Optional[int] = Field(default=None, ge=1, le=5)
    stress: Optional[int] = Field(default=None, ge=1, le=5)
    workload: Optional[int] = Field(default=None, ge=1, le=5)
    sentiment_score: float = Field(default=0.0, ge=-1.0, le=1.0)

class PredictResponse(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str
    predicted_burnout_date: Optional[str]
    contributing_factors: list[str]

# ── Prediction logic ──────────────────────────────────────────────────────────

def slope(values: list[float]) -> float:
    """Linear regression slope — positive means worsening for stress, improving for energy."""
    n = len(values)
    if n < 2:
        return 0.0
    x_mean = (n - 1) / 2
    y_mean = sum(values) / n
    num = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
    den = sum((i - x_mean) ** 2 for i in range(n))
    return num / den if den != 0 else 0.0


def checkin_frequency_score(checkins: list[CheckinRecord], window_days: int = 14) -> float:
    """1.0 = checked in every day, 0.0 = no check-ins."""
    if not checkins:
        return 0.0
    cutoff = datetime.utcnow() - timedelta(days=window_days)
    days_with_checkin = set()
    for c in checkins:
        try:
            dt = datetime.fromisoformat(c.checked_in_at.replace("Z", "+00:00"))
            if dt >= cutoff:
                days_with_checkin.add(dt.date())
        except Exception:
            pass
    return len(days_with_checkin) / window_days


def compute_streak_breaks(checkins: list[CheckinRecord]) -> int:
    """Count gaps of 2+ days without a check-in in the last 14 days."""
    if not checkins:
        return 0
    cutoff = date.today() - timedelta(days=14)
    dates = set()
    for c in checkins:
        try:
            d = datetime.fromisoformat(c.checked_in_at.replace("Z", "+00:00")).date()
            if d >= cutoff:
                dates.add(d)
        except Exception:
            pass
    breaks = 0
    current = date.today()
    for i in range(14):
        d = current - timedelta(days=i)
        if d not in dates and (d - timedelta(days=1)) not in dates:
            if i > 0:
                breaks += 1
    return min(breaks, 5)


def rule_based_score(
    checkins: list[CheckinRecord],
    latest_energy: int,
    latest_stress: int,
    latest_workload: int,
    latest_sentiment: float,
) -> tuple[float, list[str]]:
    """
    Phase 1 rule-based burnout risk model.
    Returns (risk_score: 0.0–1.0, contributing_factors: list[str])
    """
    factors = []
    score = 0.0

    # === Current check-in signals (weight: 50%) ===
    stress_norm   = (latest_stress   - 1) / 4   # 0..1
    energy_norm   = (5 - latest_energy)  / 4     # 0..1 (inverted — low energy = higher risk)
    workload_norm = (latest_workload - 1) / 4    # 0..1

    current_score = (stress_norm * 0.4 + energy_norm * 0.35 + workload_norm * 0.25)
    score += current_score * 0.5

    if latest_stress >= 4:     factors.append("high_stress")
    if latest_energy <= 2:     factors.append("low_energy")
    if latest_workload >= 4:   factors.append("high_workload")

    # === Trend signals (weight: 30%) ===
    if len(checkins) >= 3:
        recent = checkins[:14]  # last 14 entries
        energies  = [c.energy   for c in reversed(recent)]
        stresses  = [c.stress   for c in reversed(recent)]
        workloads = [c.workload for c in reversed(recent)]

        stress_trend   =  slope(stresses)    # positive = worsening
        energy_trend   = -slope(energies)    # negative slope = worsening
        workload_trend =  slope(workloads)

        trend_score = max(0, min(1, (
            (stress_trend   / 0.5) * 0.4 +
            (energy_trend   / 0.5) * 0.35 +
            (workload_trend / 0.5) * 0.25
        ) * 0.5 + 0.5))  # normalize to 0..1

        score += (trend_score - 0.5) * 0.3  # positive contribution if trending bad

        if stress_trend > 0.3:   factors.append("stress_trending_up")
        if energy_trend > 0.3:   factors.append("energy_declining")
        if workload_trend > 0.3: factors.append("workload_increasing")

    # === Behavioral signals (weight: 15%) ===
    freq = checkin_frequency_score(checkins)
    breaks = compute_streak_breaks(checkins)

    if freq < 0.5:
        score += 0.1
        factors.append("low_checkin_frequency")
    if breaks >= 3:
        score += 0.05
        factors.append("streak_breaks")

    # === Sentiment (weight: 5%) ===
    if latest_sentiment < -0.5:
        score += 0.05
        factors.append("negative_sentiment")

    return max(0.0, min(1.0, score)), factors


def days_until_burnout(risk_score: float) -> Optional[int]:
    """Rough estimate of weeks until critical burnout given current trajectory."""
    if risk_score < 0.7:
        return None
    # High risk → roughly 4–6 weeks depending on score
    return max(14, int(42 * (1 - risk_score) * 2))


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0", "model": "rule_based_v1"}


@app.post("/predict", response_model=PredictResponse)
def predict(
    body: PredictRequest,
    _: bool = Depends(verify_internal_secret),
):
    # Determine latest readings
    if body.checkins:
        latest = body.checkins[0]  # most recent first
        energy   = latest.energy
        stress   = latest.stress
        workload = latest.workload
        sentiment = latest.sentiment_score
    elif body.energy and body.stress and body.workload:
        energy   = body.energy
        stress   = body.stress
        workload = body.workload
        sentiment = body.sentiment_score
    else:
        raise HTTPException(status_code=422, detail="Provide either checkins list or individual scores")

    risk_score, factors = rule_based_score(
        checkins=body.checkins,
        latest_energy=energy,
        latest_stress=stress,
        latest_workload=workload,
        latest_sentiment=sentiment,
    )

    if risk_score >= 0.7:
        risk_level = "high"
    elif risk_score >= 0.4:
        risk_level = "medium"
    else:
        risk_level = "low"

    days = days_until_burnout(risk_score)
    predicted_date = (date.today() + timedelta(days=days)).isoformat() if days else None

    return PredictResponse(
        risk_score=round(risk_score, 3),
        risk_level=risk_level,
        predicted_burnout_date=predicted_date,
        contributing_factors=factors,
    )
