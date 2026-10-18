import csv
import json
from pathlib import Path


ARTIFACT_PATH = Path(__file__).resolve().parents[1] / "artifacts" / "volatility_model.json"
# Frozen validation-selected deployment rule. Legacy 7-day calibration artifacts
# are research candidates and must not silently override this 30-entry rule.
RUNTIME_THRESHOLDS = {"low_max_cv": 0.45, "medium_max_cv": 0.75}


def _income_values(records):
    values = []
    for record in records:
        try:
            values.append(max(float(record.get("income", 0) or 0), 0))
        except (TypeError, ValueError):
            continue
    return values


def _mean(values):
    return sum(values) / len(values) if values else 0


def _std(values, avg):
    if len(values) < 2:
        return 0
    variance = sum((value - avg) ** 2 for value in values) / (len(values) - 1)
    return variance ** 0.5


def _label_from_cv(cv):
    if cv < 0.45:
        return "low"
    if cv < 0.75:
        return "medium"
    return "high"


def _load_thresholds():
    return RUNTIME_THRESHOLDS.copy()


def classify_volatility(records):
    incomes = _income_values(records)
    if len(incomes) < 3:
        return {
            "label": "unknown",
            "score": 0,
            "features": {"entryCount": len(incomes)},
            "note": "At least 3 income entries are needed for volatility.",
        }

    recent = incomes[-min(len(incomes), 30) :]
    avg = _mean(recent)
    std = _std(recent, avg)
    cv = std / avg if avg else 0
    thresholds = _load_thresholds()

    if cv < thresholds.get("low_max_cv", 0.45):
        label = "low"
    elif cv < thresholds.get("medium_max_cv", 0.75):
        label = "medium"
    else:
        label = "high"

    score = min(round(cv, 3), 2)
    return {
        "label": label,
        "score": score,
        "features": {
            "entryCount": len(incomes),
            "recentAverageIncome": round(avg, 2),
            "recentStdIncome": round(std, 2),
            "coefficientOfVariation": round(cv, 3),
        },
        "note": "Volatility is based on recent income variation.",
    }


def train_volatility_model(csv_dir):
    csv_path = Path(csv_dir)
    cvs = []
    for file_path in csv_path.glob("*.csv"):
        with file_path.open(newline="", encoding="utf-8") as file:
            for row in csv.DictReader(file):
                try:
                    if row.get("rolling_cv_7"):
                        cvs.append(float(row["rolling_cv_7"]))
                except ValueError:
                    continue

    # Offline 7-day quantiles remain diagnostic; runtime does not load this file.
    low_max = 0.45
    medium_max = 0.75
    if len(cvs) >= 10:
        ordered = sorted(cvs)
        low_max = ordered[int(len(ordered) * 0.33)]
        medium_max = ordered[int(len(ordered) * 0.66)]

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    artifact = {"low_max_cv": round(low_max, 3), "medium_max_cv": round(medium_max, 3)}
    ARTIFACT_PATH.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    return artifact

