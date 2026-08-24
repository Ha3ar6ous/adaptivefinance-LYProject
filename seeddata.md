# Seeding Vijay Kumar's Database

You can run the scripts below to seed or reset the user's data for the demo. This will manage the user profile for Vijay Kumar (ijay.k@gmail.com with password password).

## 1. Seed Data

To populate the account with 70 days of highly volatile but high-income entries, along with a high-debt and low-bank balance profile, run:

`ash
cd server
node seed_vijay.js
``n
Once you run this command, you can:
1. Log in to the application as ijay.k@gmail.com with the password password.
2. Go to the dashboard.
3. Refresh the page to trigger the analytics update, and you should see all the metrics and insights showing up based on this seeded data.

## 2. Reset Data

If you want to clear the data (reset all profile numbers to 0 and delete all entries) to start fresh, run:

`ash
cd server
node reset_seed_vijay.js
``n