from datetime import datetime, timedelta


def _parse_date(value):
    if isinstance(value, datetime):
        return value.date()
    text = str(value).replace("Z", "+00:00")
    return datetime.fromisoformat(text[:10]).date()


def _clean_records(records):
    cleaned = []
    for record in records:
        try:
            cleaned.append(
                {
                    "date": _parse_date(record["date"]),
                    "income": max(float(record.get("income", 0) or 0), 0),
                }
            )
        except (KeyError, TypeError, ValueError):
            continue
    return sorted(cleaned, key=lambda item: item["date"])


def _weekday_adjustment(records, base):
    by_weekday = {}
    for record in records:
        by_weekday.setdefault(record["date"].weekday(), []).append(record["income"])

    adjustments = {}
    for weekday, values in by_weekday.items():
        if values:
            adjustments[weekday] = (sum(values) / len(values)) - base
    return adjustments


def forecast_income(records, horizon=15):
    entries = _clean_records(records)
    if not entries:
        return {
            "horizon": horizon,
            "points": [],
            "method": "insufficient_data",
            "note": "Add income entries to generate a forecast.",
        }

    horizon = max(1, min(int(horizon or 15), 30))
    incomes = [entry["income"] for entry in entries]
    recent = incomes[-min(len(incomes), 14) :]
    base = sum(recent) / len(recent)
    adjustments = _weekday_adjustment(entries[-min(len(entries), 42) :], base)

    method = "cold_start_rolling_weekday" if len(entries) < 15 else "trend_weekday"
    slope = 0
    if len(entries) >= 15:
        window = incomes[-min(len(incomes), 30) :]
        mid = len(window) // 2
        early = sum(window[:mid]) / max(mid, 1)
        late = sum(window[mid:]) / max(len(window) - mid, 1)
        slope = max(min((late - early) / max(len(window), 1), base * 0.08), -base * 0.08)

    last_date = entries[-1]["date"]
    points = []
    for day in range(1, horizon + 1):
        forecast_date = last_date + timedelta(days=day)
        weekday_delta = adjustments.get(forecast_date.weekday(), 0)
        value = max(base + (slope * day) + weekday_delta, 0)
        points.append(
            {
                "date": forecast_date.isoformat(),
                "income": round(value, 2),
            }
        )

    return {
        "horizon": horizon,
        "points": points,
        "method": method,
        "note": (
            "Cold-start forecast uses recent average and weekday pattern."
            if len(entries) < 15
            else "Forecast uses recent trend and weekday pattern."
        ),
    }

