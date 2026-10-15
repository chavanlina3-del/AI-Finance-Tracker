# FinAI Tracker - AI-Powered Personal Finance & Budget Coach

A modern, responsive, zero-dependency financial tracker web application with integrated authentication and an intelligent AI financial advisor.

---

## 🚀 Quick Start Guide

### Option 1: Direct Browser Launch (No server required!)
Simply double-click or open either of these files directly in any web browser (Chrome, Edge, Firefox, Safari, etc.):
- **[`login.html`](login.html)** &mdash; Full Authentication Page (Sign In & Register)
- **[`index.html`](index.html)** &mdash; Full Dashboard Application

### Option 2: Local HTTP Server (Optional)
If you prefer running via a local web server:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .
```
Then navigate to: `http://localhost:8000/login.html`

---

## 🔑 Demo Login Credentials

The application is pre-configured with a ready-to-test demonstration account:
- **Email:** `demo@finance.ai`
- **Password:** `password123`
- **1-Click Access:** Alternatively, click the **"⚡ 1-Click Demo Access"** button on [`login.html`](login.html) to instantly sign in without typing.

You can also switch to the **"Create Account"** tab on [`login.html`](login.html) to register a brand new user profile with custom name, email, and preferred currency.

---

## 🌟 Key Features

1. **Authentication & Session Security**
   - Clean split-screen login & registration interface
   - Persistent session storage with "Remember Me"
   - Password reveal toggle and input validation
   - Seamless logout and user switcher

2. **Real-Time Financial Dashboard**
   - KPI metric cards: Total Net Balance, Monthly Inflows, Monthly Outflows, and Savings Rate %
   - Interactive Cash Flow bar chart (Last 6 Months Income vs Expense)
   - Visual Expense Breakdown by category doughnut chart
   - Recent transaction ledger with inline edit and delete actions
   - Category budget health gauges

3. **Transaction Management**
   - Add, edit, and delete transactions with instant balance updates
   - Multi-criteria filtering: Search description, filter by Type (Income/Expense), filter by Category, and sort by Date/Amount
   - One-click **Export to CSV** for spreadsheets and accounting

4. **Budgets & Spending Limits**
   - Set monthly spending ceilings per category (Food, Housing, Utilities, Transportation, Entertainment, Shopping)
   - Dynamic color-coded alerts:
     - 🟢 **Safe** (< 80%)
     - 🟡 **Warning** (80% - 99%)
     - 🔴 **Over Budget** (>= 100%)

5. **Milestone Savings Goals**
   - Create custom financial targets (e.g., Emergency Fund, Vacation, New Laptop)
   - Real-time progress percentage bars and target deadline tracker
   - One-click deposit simulator to contribute towards goals

6. **FinAI Intelligent Financial Coach**
   - **Automated Heuristic Audits:** Anomaly detection, savings margin analysis, and category concentration warnings
   - **End-of-Month Forecast:** Daily burn-rate extrapolation and projected surplus calculation
   - **Interactive Chat Assistant:** Ask questions like:
     - *"How can I save $200 this month?"*
     - *"What is my biggest expense category?"*
     - *"Give me a 50/30/20 budget breakdown"*
     - *"Am I on track with my budget?"*

7. **Customization & Data Privacy**
   - **Multi-Currency Support:** USD ($), EUR (€), GBP (£), INR (₹), CAD (CA$), AUD (A$), and JPY (¥)
   - **Theme Engine:** Instant Dark Mode and Light Mode toggling
   - **Data Portability:** 1-Click Complete JSON Backup download
   - **Local Sandbox Storage:** All your data remains private and stored in your browser's local sandbox
