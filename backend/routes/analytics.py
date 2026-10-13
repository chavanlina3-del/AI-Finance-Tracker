from flask import Blueprint, jsonify
from datetime import date
from dateutil.relativedelta import relativedelta
from models import db
from models.transaction import Transaction
from models.budget import Budget
from sqlalchemy import extract, func
from services.analytics_service import AnalyticsService
from utils.auth import token_required

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics', methods=['GET'])
@token_required
def get_analytics(current_user):
    transactions = Transaction.query.filter_by(user_id=current_user.id).all()
    today = date.today()
    current_month = today.month
    current_year = today.year
    
    budget_obj = Budget.query.filter_by(user_id=current_user.id, month=current_month, year=current_year).first()

    monthly_summary = AnalyticsService.get_monthly_summary(transactions, 12)
    category_spending = AnalyticsService.get_category_spending(transactions, current_month, current_year)
    top_categories = AnalyticsService.get_top_categories(transactions, 5)
    
    # Average monthly expense
    expense_txs = [t for t in transactions if t.type == 'expense']
    total_exp = sum(float(t.amount) for t in expense_txs)
    
    unique_months = set((t.transaction_date.month, t.transaction_date.year) for t in expense_txs)
    months_count = len(unique_months)
    avg_monthly_expense = total_exp / months_count if months_count > 0 else 0
    
    # Average daily expense (current month)
    curr_month_exp = sum(float(t.amount) for t in expense_txs if t.transaction_date.month == current_month and t.transaction_date.year == current_year)
    avg_daily_expense = curr_month_exp / today.day
    
    spending_trend = AnalyticsService.get_spending_trend(transactions, 6)
    budget_utilization = AnalyticsService.calculate_budget_utilization(budget_obj, transactions, current_month, current_year)
    
    income_vs_expense = AnalyticsService.get_monthly_summary(transactions, 6)

    return jsonify({
        'monthly_summary': monthly_summary,
        'category_spending': category_spending,
        'top_categories': top_categories,
        'average_monthly_expense': avg_monthly_expense,
        'average_daily_expense': avg_daily_expense,
        'spending_trend': spending_trend,
        'budget_utilization': budget_utilization,
        'income_vs_expense': income_vs_expense
    }), 200
