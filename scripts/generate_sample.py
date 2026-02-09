"""Generate a realistic 1000-user sample cohort CSV for CohortIQ."""
import csv
import random
from datetime import datetime, timedelta

random.seed(42)

# 16 weekly cohorts: 2025-09-01 to 2025-12-15
start = datetime(2025, 9, 1)
cohort_dates = []
d = start
while len(cohort_dates) < 16:
    # Monday start
    d = d - timedelta(days=d.weekday())
    cohort_dates.append(d)
    d += timedelta(weeks=1)

# Users per cohort (varied: 50-80, total ~1000)
users_per_cohort = [
    65, 70, 55, 60, 75, 68, 72, 58,
    80, 62, 50, 65, 70, 55, 60, 45,
]

# Base retention curve (exponential decay with seasonal variation)
base_retention = [100, 72, 55, 44, 37, 32, 28, 25, 22, 20, 18, 17, 16, 15, 14, 13]

rows = []
user_id = 1

for ci, cohort_date in enumerate(cohort_dates):
    n_users = users_per_cohort[ci]

    # Seasonal effect: later cohorts (Nov-Dec) have worse retention
    season_factor = 1.0
    if ci >= 8:   # ~Oct onwards
        season_factor = 0.85
    if ci >= 12:  # ~Nov onwards
        season_factor = 0.7

    # Early cohorts retain slightly better (product-market fit improving)
    maturity_bonus = max(0, (ci - 4) * 0.02)

    for _ in range(n_users):
        uid = f"U{user_id:04d}"
        signup = cohort_date.strftime("%Y-%m-%d")

        # signup event
        rows.append([uid, signup, signup])

        # How many weeks this user stays active
        max_weeks = len(base_retention) - 1
        for week in range(1, max_weeks + 1):
            # Adjusted retention probability
            base_prob = base_retention[week] / 100.0
            prob = base_prob * season_factor * (1 + maturity_bonus)
            prob = min(prob, 0.98)

            # Individual variation
            prob += random.gauss(0, 0.08)
            prob = max(0.02, min(0.98, prob))

            if random.random() < prob:
                event_date = cohort_date + timedelta(weeks=week)
                # Add some within-week randomness (0-6 days offset)
                event_date += timedelta(days=random.randint(0, 6))
                rows.append([uid, signup, event_date.strftime("%Y-%m-%d")])
            else:
                # Once user drops, small chance of re-engagement
                if random.random() < 0.05:
                    event_date = cohort_date + timedelta(weeks=week + random.randint(1, 3))
                    event_date += timedelta(days=random.randint(0, 6))
                    rows.append([uid, signup, event_date.strftime("%Y-%m-%d")])
                break

        user_id += 1

# Sort by signup_date then user_id
rows.sort(key=lambda r: (r[1], r[0], r[2]))

import os
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "sample_cohort_data.csv")
with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["user_id", "signup_date", "event_date"])
    writer.writerows(rows)

print(f"Generated {len(rows)} rows for {user_id - 1} users across {len(cohort_dates)} cohorts")
print(f"Output: {output_path}")
