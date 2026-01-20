#!/usr/bin/env python3
import csv
import json
import os
from collections import defaultdict
from datetime import datetime
from pathlib import Path

FORECASTER_NAME = "ash"
INPUT_CSV = "fatebook-forecasts.csv"
OUTPUT_JSON = "fatebook-stats.json"

COL_QUESTION = "Question title"
COL_FORECAST_BY = "Forecast created by"
COL_PROBABILITY = "Forecast (scale = 0-1)"
COL_FORECAST_DATE = "Forecast created at"
COL_RESOLUTION = "Resolution"
COL_RESOLVED_AT = "Resolved at"
COL_BRIER = "Your Brier score for this question"
COL_TAGS = "Question tags"


def parse_date(date_str):
    """Parse date string, stripping time component."""
    if not date_str:
        return None
    date_part = date_str.split(" ")[0].split("T")[0]
    try:
        return datetime.strptime(date_part, "%Y-%m-%d")
    except ValueError:
        try:
            return datetime.strptime(date_part, "%m/%d/%Y")
        except ValueError:
            return None


def load_forecasts(csv_path):
    """Load and filter forecasts from CSV."""
    forecasts = []

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get(COL_FORECAST_BY, "").lower() != FORECASTER_NAME.lower():
                continue

            prob_str = row.get(COL_PROBABILITY, "").strip()
            if not prob_str:
                continue

            try:
                probability = float(prob_str)
            except ValueError:
                continue

            forecast = {
                "probability": probability,
                "forecast_date": parse_date(row.get(COL_FORECAST_DATE, "")),
                "resolution": row.get(COL_RESOLUTION, "").strip().upper(),
                "resolved_date": parse_date(row.get(COL_RESOLVED_AT, "")),
                "brier": row.get(COL_BRIER, "").strip(),
                "tags": row.get(COL_TAGS, "").strip(),
            }
            forecasts.append(forecast)

    return forecasts


def calculate_stats(forecasts):
    """Calculate all aggregate statistics."""
    total = len(forecasts)
    if total == 0:
        return empty_stats()

    resolved = [f for f in forecasts if f["resolution"] in ("YES", "NO")]
    pending = [f for f in forecasts if f["resolution"] not in ("YES", "NO")]

    correct = [
        f
        for f in resolved
        if (f["resolution"] == "YES" and f["probability"] >= 0.5)
        or (f["resolution"] == "NO" and f["probability"] < 0.5)
    ]
    incorrect = [f for f in resolved if f not in correct]

    brier_scores = []
    for f in resolved:
        outcome = 1 if f["resolution"] == "YES" else 0
        brier = (f["probability"] - outcome) ** 2
        brier_scores.append(brier)

    avg_brier = sum(brier_scores) / len(brier_scores) if brier_scores else None

    avg_confidence = sum(f["probability"] * 100 for f in forecasts) / total

    calibration = calculate_calibration(resolved)
    # NOTE: Redundant
    day_of_week = calculate_day_of_week(forecasts, resolved, correct)

    monthly = calculate_monthly(forecasts)

    categories = calculate_categories(forecasts, resolved)

    conf_dist = calculate_confidence_distribution(forecasts)

    return {
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "summary": {
            "total": total,
            "resolved": len(resolved),
            "pending": len(pending),
            "correct": len(correct),
            "incorrect": len(incorrect),
            "brierScore": round(avg_brier, 3) if avg_brier else None,
            "avgConfidence": round(avg_confidence, 1),
        },
        "calibration": calibration,
        "dayOfWeek": day_of_week,
        "monthlyActivity": monthly,
        "categories": categories,
        "confidenceDistribution": conf_dist,
    }


def calculate_calibration(resolved):
    """Calculate calibration data for 10% buckets."""
    buckets = defaultdict(lambda: {"count": 0, "correct": 0})

    bucket_labels = [
        "0-10",
        "10-20",
        "20-30",
        "30-40",
        "40-50",
        "50-60",
        "60-70",
        "70-80",
        "80-90",
        "90-100",
    ]

    for f in resolved:
        prob_pct = f["probability"] * 100
        bucket_idx = min(int(prob_pct // 10), 9)
        bucket_label = bucket_labels[bucket_idx]

        buckets[bucket_label]["count"] += 1
        if f["resolution"] == "YES":
            buckets[bucket_label]["correct"] += 1

    result = []
    for label in bucket_labels:
        data = buckets[label]
        count = data["count"]
        correct_count = data["correct"]
        actual_rate = correct_count / count if count > 0 else None

        result.append(
            {
                "bucket": label,
                "count": count,
                "correct": correct_count,
                "actualRate": round(actual_rate, 3)
                if actual_rate is not None
                else None,
            }
        )

    return result


# NOTE: REDUNDANT
def calculate_day_of_week(forecasts, resolved, correct):
    """Calculate day of week statistics."""
    days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    stats = {day: {"made": 0, "resolved": 0, "correct": 0} for day in days}

    for f in forecasts:
        if f["forecast_date"]:
            day = f["forecast_date"].strftime("%A")
            stats[day]["made"] += 1

    for f in resolved:
        if f["resolved_date"]:
            day = f["resolved_date"].strftime("%A")
            stats[day]["resolved"] += 1

    for f in correct:
        if f["resolved_date"]:
            day = f["resolved_date"].strftime("%A")
            stats[day]["correct"] += 1

    return stats


def calculate_monthly(forecasts):
    """Calculate monthly activity."""
    monthly = defaultdict(lambda: {"made": 0, "resolved": 0})

    for f in forecasts:
        if f["forecast_date"]:
            month_key = f["forecast_date"].strftime("%Y-%m")
            monthly[month_key]["made"] += 1

        if f["resolved_date"]:
            month_key = f["resolved_date"].strftime("%Y-%m")
            monthly[month_key]["resolved"] += 1

    return dict(sorted(monthly.items()))


def calculate_categories(forecasts, resolved):
    """Calculate category statistics from tags."""
    categories = defaultdict(
        lambda: {"count": 0, "resolved": 0, "correct": 0, "brier_sum": 0}
    )

    for f in forecasts:
        # Use first tag as category, or "uncategorized"
        tags = f["tags"].split(",") if f["tags"] else []
        category = (
            tags[0].strip().lower() if tags and tags[0].strip() else "uncategorized"
        )

        categories[category]["count"] += 1

        if f["resolution"] in ("YES", "NO"):
            categories[category]["resolved"] += 1
            outcome = 1 if f["resolution"] == "YES" else 0
            brier = (f["probability"] - outcome) ** 2
            categories[category]["brier_sum"] += brier

            is_correct = (f["resolution"] == "YES" and f["probability"] >= 0.5) or (
                f["resolution"] == "NO" and f["probability"] < 0.5
            )
            if is_correct:
                categories[category]["correct"] += 1

    result = {}
    for cat, data in categories.items():
        resolved_count = data["resolved"]
        result[cat] = {
            "count": data["count"],
            "correct": data["correct"],
            "brierScore": round(data["brier_sum"] / resolved_count, 3)
            if resolved_count > 0
            else None,
        }

    return result


def calculate_confidence_distribution(forecasts):
    """Calculate confidence distribution in quartiles."""
    ranges = [
        {"range": "0-25", "min": 0, "max": 25},
        {"range": "25-50", "min": 25, "max": 50},
        {"range": "50-75", "min": 50, "max": 75},
        {"range": "75-100", "min": 75, "max": 100},
    ]

    result = []
    for r in ranges:
        count = sum(
            1
            for f in forecasts
            if r["min"] <= f["probability"] * 100 < r["max"]
            or (r["max"] == 100 and f["probability"] * 100 == 100)
        )
        result.append({"range": r["range"], "count": count})

    return result


def empty_stats():
    """Return empty stats structure."""
    return {
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "summary": {
            "total": 0,
            "resolved": 0,
            "pending": 0,
            "correct": 0,
            "incorrect": 0,
            "brierScore": None,
            "avgConfidence": 0,
        },
        "calibration": [],
        "dayOfWeek": {},
        "monthlyActivity": {},
        "categories": {},
        "confidenceDistribution": [],
    }


def main():
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent

    csv_path = repo_root / INPUT_CSV
    json_path = repo_root / OUTPUT_JSON

    if not csv_path.exists():
        print(f"Error: {INPUT_CSV} not found at {csv_path}")
        print("Please export your Fatebook data and place it in the repository root.")
        return 1

    print(f"Loading forecasts from {csv_path}...")
    forecasts = load_forecasts(csv_path)
    print(f"Found {len(forecasts)} forecasts by '{FORECASTER_NAME}'")

    print("Calculating statistics...")
    stats = calculate_stats(forecasts)

    print(f"Writing anonymized stats to {json_path}...")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    print("Done!")
    print(f"\nSummary:")
    print(f"  Total predictions: {stats['summary']['total']}")
    print(f"  Resolved: {stats['summary']['resolved']}")
    print(f"  Brier score: {stats['summary']['brierScore']}")
    print(
        f"  Accuracy: {stats['summary']['correct']}/{stats['summary']['resolved']} correct"
    )

    return 0


if __name__ == "__main__":
    exit(main())
