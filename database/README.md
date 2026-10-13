# Database Layer - AI Finance Tracker

## Overview
This folder contains the database schema, initial seed data, and a Python script to set up the MySQL database `ai_finance_tracker`.

## Tables

### `users`
- **id**: INT AUTO_INCREMENT PRIMARY KEY
- **full_name**: VARCHAR(100) NOT NULL
- **email**: VARCHAR(150) UNIQUE NOT NULL
- **password_hash**: VARCHAR(255) NOT NULL
- **created_at**: TIMESTAMP

### `transactions`
- **id**: INT AUTO_INCREMENT PRIMARY KEY
- **user_id**: INT NOT NULL (FK)
- **type**: ENUM('income', 'expense')
- **amount**: DECIMAL(12,2)
- **category**: VARCHAR(50)
- **description**: VARCHAR(255)
- **transaction_date**: DATE
- **payment_method**: VARCHAR(50)
- **notes**: TEXT
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### `budgets`
- **id**: INT AUTO_INCREMENT PRIMARY KEY
- **user_id**: INT NOT NULL (FK)
- **month**: INT NOT NULL (1-12)
- **year**: INT NOT NULL
- **total_budget**: DECIMAL(12,2)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### `category_budgets`
- **id**: INT AUTO_INCREMENT PRIMARY KEY
- **budget_id**: INT NOT NULL (FK)
- **category**: VARCHAR(50) NOT NULL
- **budget_amount**: DECIMAL(12,2) NOT NULL

### `financial_goals`
- **id**: INT AUTO_INCREMENT PRIMARY KEY
- **user_id**: INT NOT NULL (FK)
- **goal_name**: VARCHAR(100) NOT NULL
- **target_amount**: DECIMAL(12,2) NOT NULL
- **current_amount**: DECIMAL(12,2) DEFAULT 0.00
- **target_date**: DATE
- **status**: ENUM('active', 'completed', 'cancelled')
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

## Relationships (ER Description)
- **users** (1) -> (N) **transactions**: One user has many transactions. Cascade delete on user deletion.
- **users** (1) -> (N) **budgets**: One user has many monthly budgets. Cascade delete on user deletion.
- **budgets** (1) -> (N) **category_budgets**: One budget has many category-specific budgets. Cascade delete on budget deletion.
- **users** (1) -> (N) **financial_goals**: One user has many financial goals. Cascade delete on user deletion.

## Setup Instructions
1. Ensure MySQL is running on your machine.
2. Set environment variables if you are not using the default `root` user with an empty password on `localhost`:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME` (Defaults to `ai_finance_tracker`)
3. Install the required Python dependencies:
   ```bash
   pip install mysql-connector-python werkzeug
   ```
4. Run the seed script:
   ```bash
   python database/seed.py
   ```

Running the `seed.py` script will create the database, build the tables, and insert a demo user (`demo@example.com` / `Demo@123`) along with realistic demo data spanning several months.
