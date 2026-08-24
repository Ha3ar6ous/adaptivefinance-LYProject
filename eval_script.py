import csv
import json
import glob
import math
from pathlib import Path
from datetime import datetime
import sys

# 1. Dataset stats
data_dir = Path("d:/Ritesh/Documents/RJ/AllWork/LYProject/data")
normal_csvs = list(data_dir.glob("normal/*.csv"))
volatility_csvs = list(data_dir.glob("volatility/*.csv"))

total_rows = 0
incomes = []
platforms = set()
for csv_file in normal_csvs + volatility_csvs:
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1
            if 'platform' in row: platforms.add(row['platform'])
            if 'income' in row: incomes.append(float(row['income']))

print("=== DATASET STATISTICS ===")
print(f"Total Rows: {total_rows}")
print(f"Number of Datasets: {len(normal_csvs) + len(volatility_csvs)}")
print(f"Number of Platforms: {len(platforms)} {list(platforms)}")
if incomes:
    print(f"Income Min: {min(incomes)}, Max: {max(incomes)}, Mean: {sum(incomes)/len(incomes):.2f}, Median: {sorted(incomes)[len(incomes)//2]}")


# 2. Forecasting Evaluation
sys.path.append("d:/Ritesh/Documents/RJ/AllWork/LYProject/ml_service")
try:
    from modules.forecast import forecast_income
    
    # Simple holdout evaluation on one dataset
    test_csv = data_dir / "normal" / "gig_income_data.csv"
    if test_csv.exists():
        records = []
        with open(test_csv, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append({"date": row.get("date"), "income": row.get("income")})
        
        # Take first N as train, last 15 as test
        train = records[:-15]
        test = records[-15:]
        if train and test:
            forecast_res = forecast_income(train, horizon=15)
            preds = [p['income'] for p in forecast_res['points']]
            actuals = [float(t['income']) for t in test]
            
            mae = sum(abs(p - a) for p, a in zip(preds, actuals)) / len(actuals)
            rmse = math.sqrt(sum((p - a)**2 for p, a in zip(preds, actuals)) / len(actuals))
            
            baseline = sum(float(t['income']) for t in train[-15:]) / 15 if len(train) >= 15 else 0
            base_mae = sum(abs(baseline - a) for a in actuals) / len(actuals)
            base_rmse = math.sqrt(sum((baseline - a)**2 for a in actuals) / len(actuals))
            
            print("\n=== FORECASTING EVALUATION ===")
            print(f"Test Set: 15 days holdout")
            print(f"Model MAE: {mae:.2f}, RMSE: {rmse:.2f}")
            print(f"Baseline (Hist Mean) MAE: {base_mae:.2f}, RMSE: {base_rmse:.2f}")
except Exception as e:
    print(f"Error in forecast eval: {e}")

# 3. Volatility Evaluation
try:
    from modules.volatility import classify_volatility
    print("\n=== VOLATILITY CLASSIFICATION ===")
    correct = 0
    total = 0
    for csv_file in volatility_csvs:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            window = []
            for row in reader:
                window.append(row)
                if len(window) > 30: window.pop(0)
                if len(window) >= 30 and 'volatility_label' in row:
                    truth = row['volatility_label'].lower()
                    pred = classify_volatility(window)['label']
                    if truth == pred: correct += 1
                    total += 1
    if total > 0:
        print(f"Rule Consistency Accuracy: {correct/total*100:.2f}% ({correct}/{total})")
except Exception as e:
    print(f"Error in volatility eval: {e}")

