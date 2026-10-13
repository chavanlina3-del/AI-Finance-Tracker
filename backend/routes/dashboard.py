from flask import Blueprint, jsonify
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, extract
from models import db
from models.transaction import Transaction
from models.budget import Budget
from utils.auth import token_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    today = date.today()
    current_month = today.month
    current_year = today.year

    # All time totals
    income_sum = db.session.query(func.sum(Transaction.amount)).filter_by(user_id=current_user.id, type='income').scalar() or 0
    expense_sum = db.session.query(func.sum(Transaction.amount)).filter_by(user_id=current_user.id, type='expense').scalar() or 0
    balance = float(income_sum) - float(expense_sum)

    # Current month totals
    monthly_income_sum = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'income',
        extract('month', Transaction.transaction_date) == current_month,
        extract('year', Transaction.transaction_date) == current_year
    ).scalar() or 0
    
    monthly_expense_sum = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'expense',
        extract('month', Transaction.transaction_date) == current_month,
        extract('year', Transaction.transaction_date) == current_year
    ).scalar() or 0

    monthly_budget_obj = Budget.query.filter_by(user_id=current_user.id, month=current_month, year=current_year).first()
    monthly_budget = float(monthly_budget_obj.total_budget) if monthly_budget_obj else 0
    remaining_budget = monthly_budget - float(monthly_expense_sum)

    savings_rate = 0
    if float(monthly_income_sum) > 0:
        savings_rate = ((float(monthly_income_sum) - float(monthly_expense_sum)) / float(monthly_income_sum)) * 100

    recent_transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.transaction_date.desc()).limit(10).all()

    # Expense by category (current month)
    category_expenses = db.session.query(Transaction.category, func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == 'expense',
        extract('month', Transaction.transaction_date) == current_month,
        extract('year', Transaction.transaction_date) == current_year
    ).group_by(Transaction.category).all()
    expense_by_category = [{'category': row[0], 'amount': float(row[1])} for row in category_expenses]

    # Monthly trend (last 6 months)
    monthly_trend = []
    for i in range(5, -1, -1):
        target_date = today - relativedelta(months=i)
        t_month = target_date.month
        t_year = target_date.year
        
        inc = db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == 'income',
            extract('month', Transaction.transaction_date) == t_month,
            extract('year', Transaction.transaction_date) == t_year
        ).scalar() or 0
        
        exp = db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == 'expense',
            extract('month', Transaction.transaction_date) == t_month,
            extract('year', Transaction.transaction_date) == t_year
        ).scalar() or 0
        
        monthly_trend.append({
            'month': t_month,
            'year': t_year,
            'income': float(inc),
            'expenses': float(exp)
        })

    return jsonify({
        'total_income': float(income_sum),
        'total_expenses': float(expense_sum),
        'balance': balance,
        'monthly_income': float(monthly_income_sum),
        'monthly_expenses': float(monthly_expense_sum),
        'monthly_budget': monthly_budget,
        'remaining_budget': remaining_budget,
        'savings_rate': savings_rate,
        'recent_transactions': [tx.to_dict() for tx in recent_transactions],
        'expense_by_category': expense_by_category,
        'monthly_trend': monthly_trend
    }), 200
