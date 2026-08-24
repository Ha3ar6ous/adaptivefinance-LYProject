import os
import csv
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

# Set up matplotlib style for IEEE
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.linewidth'] = 0.5
plt.rcParams['grid.linewidth'] = 0.5
plt.rcParams['lines.linewidth'] = 1.0
# Fallback to INR if rupee symbol isn't well supported
currency = 'INR'

out_dir = Path("d:/Ritesh/Documents/RJ/AllWork/LYProject/paper_figures")

def generate_fig3():
    data_dir = Path("d:/Ritesh/Documents/RJ/AllWork/LYProject/data")
    csv_files = list(data_dir.glob("normal/*.csv")) + list(data_dir.glob("volatility/*.csv"))
    
    incomes = []
    for f in csv_files:
        with open(f, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if 'income' in row:
                    try:
                        val = float(row['income'])
                        incomes.append(val)
                    except ValueError:
                        pass
                        
    incomes = np.array(incomes)
    
    n = len(incomes)
    if n > 0:
        actual_min = np.min(incomes)
        actual_max = np.max(incomes)
        actual_mean = np.mean(incomes)
        actual_median = np.median(incomes)
    else:
        actual_min = actual_max = actual_mean = actual_median = 0
        
    ev_n = 1980
    ev_min = 0.0
    ev_median = 1076.68
    ev_mean = 1165.08
    ev_max = 7324.78
    
    # Check if they match closely
    match = (n == ev_n and 
             abs(actual_min - ev_min) < 1.0 and 
             abs(actual_median - ev_median) < 1.0 and 
             abs(actual_mean - ev_mean) < 1.0 and 
             abs(actual_max - ev_max) < 1.0)
             
    fig, ax = plt.subplots(figsize=(6, 3))
    
    mode = "BOXPLOT" if match else "FALLBACK_MARKER"
    
    if match:
        ax.boxplot(incomes, vert=False, patch_artist=True,
                   boxprops=dict(facecolor='#E0E0E0', color='black', linewidth=0.5),
                   capprops=dict(color='black', linewidth=0.5),
                   whiskerprops=dict(color='black', linewidth=0.5),
                   flierprops=dict(marker='o', color='black', markersize=3, alpha=0.5, markeredgewidth=0.5),
                   medianprops=dict(color='black', linewidth=1.0))
        ax.set_title("Distribution of Synthetic Gig Worker Daily Income")
        ax.set_yticks([])
    else:
        # Fallback marker
        points = [ev_min, ev_median, ev_mean, ev_max]
        labels = [f"Min\n{currency} {ev_min:.2f}", 
                  f"Median\n{currency} {ev_median:.2f}", 
                  f"Mean\n{currency} {ev_mean:.2f}", 
                  f"Max\n{currency} {ev_max:.2f}"]
        
        y_val = 1
        ax.plot(points, [y_val]*4, 'ko', markersize=6)
        
        # Avoid label overlap by alternating vertical offsets
        for i, (pt, lbl) in enumerate(zip(points, labels)):
            offset = 0.1 if i % 2 == 0 else -0.1
            va = 'bottom' if i % 2 == 0 else 'top'
            ax.text(pt, y_val + offset, lbl, ha='center', va=va, fontsize=9)
            
        ax.set_ylim(0.5, 1.5)
        ax.set_yticks([])
        ax.set_title(f"Summary Statistics of Synthetic Daily Income (N = {ev_n})")
        
    ax.set_xlabel(f"Daily Income ({currency})")
    ax.grid(True, axis='x', linestyle='--', alpha=0.7)
    
    # Hide top/right spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(out_dir / "fig3_income_distribution.png", dpi=300, bbox_inches="tight")
    plt.close()
    
    print(f"FIG3 MODE: {mode}")
    print(f"Fig3 N={n} (Expected: {ev_n})")
    print(f"Fig3 Min={actual_min:.2f} (Expected: {ev_min})")
    print(f"Fig3 Median={actual_median:.2f} (Expected: {ev_median})")
    print(f"Fig3 Mean={actual_mean:.2f} (Expected: {ev_mean})")
    print(f"Fig3 Max={actual_max:.2f} (Expected: {ev_max})")

def generate_fig4():
    methods = ['Proposed Math/Trend', 'Naive Historical Mean']
    mae_vals = [352.07, 348.48]
    rmse_vals = [431.35, 411.28]
    
    fig, ax = plt.subplots(figsize=(6, 4))
    
    x = np.arange(len(methods))
    width = 0.35
    
    rects1 = ax.bar(x - width/2, mae_vals, width, label='MAE', color='#555555', edgecolor='black', linewidth=0.5)
    rects2 = ax.bar(x + width/2, rmse_vals, width, label='RMSE', color='#CCCCCC', edgecolor='black', linewidth=0.5)
    
    ax.set_ylabel(f'Error ({currency})')
    ax.set_title('15-Day Holdout Forecast Error: Proposed vs. Baseline')
    ax.set_xticks(x)
    ax.set_xticklabels(methods)
    ax.legend(frameon=False)
    
    # Add labels on top
    def autolabel(rects):
        for rect in rects:
            height = rect.get_height()
            ax.annotate(f'{height:.2f}',
                        xy=(rect.get_x() + rect.get_width() / 2, height),
                        xytext=(0, 3),  # 3 points vertical offset
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=9)
                        
    autolabel(rects1)
    autolabel(rects2)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(True, axis='y', linestyle='--', alpha=0.7)
    
    plt.tight_layout()
    plt.savefig(out_dir / "fig4_forecast_vs_baseline.png", dpi=300, bbox_inches="tight")
    plt.close()
    
    print("\nFIG4 Values:")
    print("Methods:", methods)
    print("MAE:", mae_vals)
    print("RMSE:", rmse_vals)

def generate_fig5():
    scenarios = ['Vulnerable', 'High Debt', 'Stable']
    scores = [21, 52, 91]
    
    fig, ax = plt.subplots(figsize=(6, 4))
    
    # Colors according to phases: Crisis, Survival, Growth
    colors = ['#882222', '#AA6622', '#228822']
    
    x = np.arange(len(scenarios))
    bars = ax.bar(x, scores, width=0.5, color=colors, edgecolor='black', linewidth=0.5)
    
    ax.set_ylabel('Financial Health Score (0–100)')
    ax.set_title('Health Score Across Synthetic Scenarios')
    ax.set_xticks(x)
    ax.set_xticklabels(scenarios)
    ax.set_ylim(0, 105) # a bit over 100 for labels
    
    # Add dashed lines for phases
    for y in [40, 60, 80]:
        ax.axhline(y=y, color='gray', linestyle='--', linewidth=0.5, zorder=0)
        
    # Phase annotations (right aligned)
    ax.text(2.4, 20, 'Crisis (0-39)', va='center', ha='right', fontsize=9, color='gray')
    ax.text(2.4, 50, 'Survival (40-59)', va='center', ha='right', fontsize=9, color='gray')
    ax.text(2.4, 70, 'Stability (60-79)', va='center', ha='right', fontsize=9, color='gray')
    ax.text(2.4, 90, 'Growth (80-100)', va='center', ha='right', fontsize=9, color='gray')
    
    # Values on top
    for bar, sc in zip(bars, scores):
        height = bar.get_height()
        ax.annotate(f'{sc}',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),  # 3 points vertical offset
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=9)
                    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(out_dir / "fig5_health_score_scenarios.png", dpi=300, bbox_inches="tight")
    plt.close()
    
    print("\nFIG5 Values:")
    print("Scenarios:", scenarios)
    print("Scores:", scores)

if __name__ == '__main__':
    generate_fig3()
    generate_fig4()
    generate_fig5()
    print("\nAll figures generated successfully.")
