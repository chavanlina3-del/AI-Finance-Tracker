from datetime import date
from dateutil.relativedelta import relativedelta

class AnalyticsService:
    @staticmethod
    def get_monthly_summary(transactions, months_back):
        today = date.today()
        summary = []
        for i in range(months_back - 1, -1, -1):
            target_date = today - relativedelta(months=i)
            m = target_date.month
            y = target_date.year
            
            inc = sum(float(t.amount) for t in transactions if t.type == 'income' and t.transaction_date.month == m and t.transaction_date.year == y)
            exp = sum(float(t.amount) for t in transactions if t.type == 'expense' and t.transaction_date.month == m and t.transaction_date.year == y)
            
            summary.append({
                'month': m,
                'year': y,
                'income': inc,
                'expenses': exp,
                'savings': inc - exp
            })
        return summary

    @staticmethod
    def get_category_spending(transactions, month, year):
        category_totals = {}
        for t in transactions:
            if t.type == 'expense' and t.transaction_date.month == month and t.transaction_date.year == year:
                if t.category not in category_totals:
                    category_totals[t.category] = 0
                category_totals[t.category] += float(t.amount)
        return [{'category': k, 'amount': v} for k, v in category_totals.items()]

    @staticmethod
    def get_top_categories(transactions, limit):
        category_totals = {}
        for t in transactions:
            if t.type == 'expense':
                if t.category not in category_totals:
                    category_totals[t.category] = 0
                category_totals[t.category] += float(t.amount)
        
        sorted_cats = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [{'category': k, 'amount': v} for k, v in sorted_cats]

    @staticmethod
    def get_spending_trend(transactions, months_back):
        return AnalyticsService.get_monthly_summary(transactions, months_back)

    @staticmethod
    def calculate_budget_utilization(budget, transactions, month, year):
        if not budget:
            return None
            
        spent = sum(float(t.amount) for t in transactions if t.type == 'expense' and t.transaction_date.month == month and t.transaction_date.year == year)
        
        category_utilization = []
        for cb in budget.category_budgets:
            cat_spent = sum(float(t.amount) for t in transactions if t.type == 'expense' and t.category == cb.category and t.transaction_date.month == month and t.transaction_date.year == year)
            category_utilization.append({
                'category': cb.category,
                'budgeted': float(cb.budget_amount),
                'spent': cat_spent,
                'remaining': float(cb.budget_amount) - cat_spent
            })
            
        return {
            'total_budget': float(budget.total_budget),
            'total_spent': spent,
            'total_remaining': float(budget.total_budget) - spent,
            'categories': category_utilization
        }
