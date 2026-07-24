from fastapi import FastAPI
from pydantic import BaseModel, Field

from modules.forecast import forecast_income
from modules.volatility import classify_volatility


class IncomeEntry(BaseModel):
    date: str
    platform: str | None = None
    hours_worked: float = 0
    orders_completed: float = 0
    income: float = 0


class AnalyzeRequest(BaseModel):
    userId: str
    entries: list[IncomeEntry] = Field(default_factory=list)
    horizon: int = 15


app = FastAPI(title="Adaptive Finance ML Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/forecast")
def forecast(payload: AnalyzeRequest):
    records = [entry.model_dump() for entry in payload.entries]
    return forecast_income(records, payload.horizon)


@app.post("/volatility")
def volatility(payload: AnalyzeRequest):
    records = [entry.model_dump() for entry in payload.entries]
    return classify_volatility(records)


@app.post("/analyze")
def analyze(payload: AnalyzeRequest):
    records = [entry.model_dump() for entry in payload.entries]
    return {
        "forecast": forecast_income(records, payload.horizon),
        "volatility": classify_volatility(records),
    }

