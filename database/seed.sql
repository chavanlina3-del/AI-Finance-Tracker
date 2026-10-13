USE ai_finance_tracker;

-- NOTE: Password for demo user is 'Demo@123'
-- The actual hashing should be done via backend seed script, so a placeholder hash is used here.
-- This insert might be bypassed by seed.py which inserts the actual hashed password.
INSERT INTO users (id, full_name, email, password_hash)
VALUES (1, 'John Doe', 'demo@example.com', 'pbkdf2:sha256:600000$placeholder$hash')
ON DUPLICATE KEY UPDATE id=1;

-- Insert Transactions for July, August, September 2026
INSERT INTO transactions (user_id, type, amount, category, description, transaction_date, payment_method) VALUES
(1, 'income', 3200.00, 'Salary', 'July Salary', '2026-07-01', 'Bank Transfer'),
(1, 'expense', 800.00, 'Rent', 'July Rent', '2026-07-02', 'Bank Transfer'),
(1, 'expense', 150.00, 'Food', 'Groceries', '2026-07-05', 'Credit Card'),
(1, 'expense', 45.50, 'Transportation', 'Gas', '2026-07-10', 'Credit Card'),
(1, 'income', 500.00, 'Freelance', 'Web design project', '2026-07-15', 'PayPal'),
(1, 'expense', 60.00, 'Entertainment', 'Movie tickets', '2026-07-20', 'Credit Card'),
(1, 'expense', 120.00, 'Bills', 'Electricity Bill', '2026-07-25', 'Bank Transfer'),

(1, 'income', 3200.00, 'Salary', 'August Salary', '2026-08-01', 'Bank Transfer'),
(1, 'expense', 800.00, 'Rent', 'August Rent', '2026-08-02', 'Bank Transfer'),
(1, 'expense', 180.00, 'Food', 'Groceries and Dining Out', '2026-08-08', 'Credit Card'),
(1, 'expense', 50.00, 'Transportation', 'Gas', '2026-08-12', 'Credit Card'),
(1, 'expense', 200.00, 'Education', 'Online Course', '2026-08-15', 'Credit Card'),
(1, 'expense', 100.00, 'Shopping', 'New clothes', '2026-08-18', 'Credit Card'),
(1, 'expense', 130.00, 'Bills', 'Internet and Phone', '2026-08-22', 'Bank Transfer'),
(1, 'expense', 75.00, 'Healthcare', 'Pharmacy', '2026-08-28', 'Credit Card'),

(1, 'income', 3200.00, 'Salary', 'September Salary', '2026-09-01', 'Bank Transfer'),
(1, 'expense', 800.00, 'Rent', 'September Rent', '2026-09-02', 'Bank Transfer'),
(1, 'expense', 210.00, 'Food', 'Groceries', '2026-09-05', 'Credit Card'),
(1, 'expense', 55.00, 'Transportation', 'Gas', '2026-09-10', 'Credit Card'),
(1, 'income', 150.00, 'Investment', 'Dividends', '2026-09-15', 'Bank Transfer'),
(1, 'expense', 90.00, 'Shopping', 'Shoes', '2026-09-20', 'Credit Card'),
(1, 'expense', 140.00, 'Bills', 'Water and Electricity', '2026-09-25', 'Bank Transfer'),
(1, 'expense', 85.00, 'Entertainment', 'Concert tickets', '2026-09-28', 'Credit Card');

-- Insert Budgets
INSERT INTO budgets (id, user_id, month, year, total_budget) VALUES
(1, 1, 8, 2026, 3100.00),
(2, 1, 9, 2026, 3100.00);

-- Insert Category Budgets for August 2026
INSERT INTO category_budgets (budget_id, category, budget_amount) VALUES
(1, 'Food', 500.00),
(1, 'Shopping', 300.00),
(1, 'Transportation', 200.00),
(1, 'Bills', 400.00),
(1, 'Entertainment', 200.00),
(1, 'Healthcare', 150.00),
(1, 'Education', 200.00),
(1, 'Rent', 800.00),
(1, 'Travel', 100.00),
(1, 'Other', 150.00);

-- Insert Category Budgets for September 2026
INSERT INTO category_budgets (budget_id, category, budget_amount) VALUES
(2, 'Food', 500.00),
(2, 'Shopping', 300.00),
(2, 'Transportation', 200.00),
(2, 'Bills', 400.00),
(2, 'Entertainment', 200.00),
(2, 'Healthcare', 150.00),
(2, 'Education', 200.00),
(2, 'Rent', 800.00),
(2, 'Travel', 100.00),
(2, 'Other', 150.00);

-- Insert Financial Goals
INSERT INTO financial_goals (user_id, goal_name, target_amount, current_amount, target_date, status) VALUES
(1, 'New Laptop', 1500.00, 650.00, '2027-03-01', 'active'),
(1, 'Emergency Fund', 5000.00, 2200.00, '2027-12-31', 'active'),
(1, 'Online Course', 200.00, 200.00, '2026-08-01', 'completed');
