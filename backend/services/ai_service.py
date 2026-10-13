import numpy as np
from datetime import date
from dateutil.relativedelta import relativedelta

class AIService:
    @staticmethod
    def analyze_spending(transactions, budgets):
        today = date.today()
        expense_txs = [t for t in transactions if t.type == 'expense' and t.transaction_date.month == today.month and t.transaction_date.year == today.year]
        
        category_totals = {}
        for t in expense_txs:
            if t.category not in category_totals:
                category_totals[t.category] = 0
            category_totals[t.category] += float(t.amount)
            
        highest_spending_category = max(category_totals, key=category_totals.get) if category_totals else None
        lowest_spending_category = min(category_totals, key=category_totals.get) if category_totals else None
        total_spending = sum(category_totals.values())
        average_daily_spending = total_spending / today.day if today.day > 0 else 0
        
        # Savings rate (rough estimate based on this month's income vs expense)
        income_txs = [t for t in transactions if t.type == 'income' and t.transaction_date.month == today.month and t.transaction_date.year == today.year]
        total_income = sum(float(t.amount) for t in income_txs)
        savings_rate = ((total_income - total_spending) / total_income * 100) if total_income > 0 else 0

        # MoM Change
        last_month_date = today - relativedelta(months=1)
        last_month_exp = sum(float(t.amount) for t in transactions if t.type == 'expense' and t.transaction_date.month == last_month_date.month and t.transaction_date.year == last_month_date.year)
        
        if last_month_exp > 0:
            mom_change = ((total_spending - last_month_exp) / last_month_exp) * 100
        else:
            mom_change = 0

        insights = []
        if highest_spending_category:
            insights.append(f"Your highest expense category is {highest_spending_category} at ${category_totals[highest_spending_category]:.2f}.")
        if total_spending > last_month_exp and last_month_exp > 0:
            insights.append(f"Your spending has increased by {mom_change:.1f}% compared to last month.")
        elif total_spending < last_month_exp and last_month_exp > 0:
            insights.append(f"Great job! Your spending is down by {abs(mom_change):.1f}% compared to last month.")

        return {
            'highest_spending_category': highest_spending_category,
            'lowest_spending_category': lowest_spending_category,
            'total_spending': total_spending,
            'average_daily_spending': average_daily_spending,
            'savings_rate': savings_rate,
            'month_over_month_change': mom_change,
            'insights': insights
        }

    @staticmethod
    def predict_expenses(transactions):
        today = date.today()
        # Last 3 months
        historical_expenses = []
        for i in range(1, 4):
            m_date = today - relativedelta(months=i)
            exp = sum(float(t.amount) for t in transactions if t.type == 'expense' and t.transaction_date.month == m_date.month and t.transaction_date.year == m_date.year)
            historical_expenses.append(exp)
            
        if not historical_expenses:
            return {
                'predicted_total_expense': 0,
                'predicted_by_category': [],
                'suggested_budget': 0,
                'confidence_note': 'Not enough data for estimates',
                'method_description': 'Needs at least 1 month of prior data'
            }
            
        avg_expense = np.mean(historical_expenses)
        
        # Category breakdown based on last 3 months
        cat_totals = {}
        for t in transactions:
            if t.type == 'expense' and t.transaction_date >= (today - relativedelta(months=3)).replace(day=1) and t.transaction_date < today.replace(day=1):
                if t.category not in cat_totals:
                    cat_totals[t.category] = 0
                cat_totals[t.category] += float(t.amount)
                
        predicted_by_category = [{'category': k, 'predicted_amount': v / 3} for k, v in cat_totals.items()]
        
        return {
            'predicted_total_expense': float(avg_expense),
            'predicted_by_category': predicted_by_category,
            'suggested_budget': float(avg_expense * 1.1), # Add 10% buffer
            'confidence_note': 'Estimates based on your historical spending patterns',
            'method_description': '3-month Simple Moving Average (SMA)'
        }

    @staticmethod
    def generate_recommendations(transactions, budgets):
        recs = []
        today = date.today()
        
        # Check if they are over budget in any category
        current_budget = next((b for b in budgets if b.month == today.month and b.year == today.year), None)
        if current_budget:
            for cb in current_budget.category_budgets:
                spent = sum(float(t.amount) for t in transactions if t.type == 'expense' and t.category == cb.category and t.transaction_date.month == today.month and t.transaction_date.year == today.year)
                if spent > float(cb.budget_amount):
                    recs.append(f"You have exceeded your budget for {cb.category}. Consider cutting back for the rest of the month.")
                    
        # General recs
        expense_txs = [t for t in transactions if t.type == 'expense' and t.transaction_date.month == today.month and t.transaction_date.year == today.year]
        total_exp = sum(float(t.amount) for t in expense_txs)
        
        if total_exp > 0:
            recs.append("Review your highest expense category and see if there are any recurring subscriptions you no longer need.")
            
        if not recs:
            recs.append("You are on track with your finances! Keep up the good work.")
            
        return recs

    @staticmethod
    def process_question(question, transactions, budgets, goals):
        question = question.lower()
        today = date.today()
        
        if "spend this month" in question or "spent this month" in question:
            spent = sum(float(t.amount) for t in transactions if t.type == 'expense' and t.transaction_date.month == today.month and t.transaction_date.year == today.year)
            return f"You have spent ${spent:.2f} this month."
            
        if "highest expense" in question:
            category_totals = {}
            for t in transactions:
                if t.type == 'expense':
                    if t.category not in category_totals:
                        category_totals[t.category] = 0
                    category_totals[t.category] += float(t.amount)
            if not category_totals:
                return "You have no expenses recorded."
            highest_cat = max(category_totals, key=category_totals.get)
            return f"Your highest expense category overall is {highest_cat} with a total of ${category_totals[highest_cat]:.2f}."
            
        if "within my monthly budget" in question or "over budget" in question:
            current_budget = next((b for b in budgets if b.month == today.month and b.year == today.year), None)
            if not current_budget:
                return "You don't have a budget set for this month."
            spent = sum(float(t.amount) for t in transactions if t.type == 'expense' and t.transaction_date.month == today.month and t.transaction_date.year == today.year)
            remaining = float(current_budget.total_budget) - spent
            if remaining >= 0:
                return f"Yes, you are within budget. You have ${remaining:.2f} remaining."
            else:
                return f"No, you are over budget by ${abs(remaining):.2f}."
                
        if "predict" in question or "next month" in question:
            pred = AIService.predict_expenses(transactions)
            return f"Based on your history, your predicted expenses for next month are ${pred['predicted_total_expense']:.2f}."
            
        if "reduce" in question:
            return "To reduce your expenses, consider reviewing your highest spending categories and identifying non-essential purchases. Creating a stricter budget can also help."
            
        return "I can help you with questions about your spending this month, highest expenses, budgets, and predictions based on your data. Try asking 'How much did I spend this month?'"
