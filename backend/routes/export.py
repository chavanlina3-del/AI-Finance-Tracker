from flask import Blueprint, jsonify, Response, request
import csv
import io
from datetime import datetime
from sqlalchemy import func
from models.transaction import Transaction
from models.budget import Budget
from utils.auth import token_required

export_bp = Blueprint('export', __name__)

@export_bp.route('/api/export/csv', methods=['GET'])
@token_required
def export_csv(current_user):
    transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.transaction_date.desc()).all()
    
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method'])
    
    for t in transactions:
        cw.writerow([
            t.transaction_date.isoformat(),
            t.type,
            t.category,
            t.description,
            f"{t.amount:.2f}",
            t.payment_method
        ])
        
    output = si.getvalue()
    
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=transactions.csv"}
    )

@export_bp.route('/api/export/report', methods=['GET'])
@token_required
def export_report(current_user):
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    query = Transaction.query.filter_by(user_id=current_user.id)
    
    if start_date_str:
        query = query.filter(Transaction.transaction_date >= datetime.strptime(start_date_str, '%Y-%m-%d').date())
    if end_date_str:
        query = query.filter(Transaction.transaction_date <= datetime.strptime(end_date_str, '%Y-%m-%d').date())
        
    transactions = query.order_by(Transaction.transaction_date.asc()).all()
    
    total_income = sum(float(t.amount) for t in transactions if t.type == 'income')
    total_expenses = sum(float(t.amount) for t in transactions if t.type == 'expense')
    balance = total_income - total_expenses
    
    category_summary = {}
    for t in transactions:
        if t.type == 'expense':
            if t.category not in category_summary:
                category_summary[t.category] = 0
            category_summary[t.category] += float(t.amount)
            
    cat_summary_list = [{'category': k, 'total': v} for k, v in category_summary.items()]
    
    today = datetime.today()
    budget = Budget.query.filter_by(user_id=current_user.id, month=today.month, year=today.year).first()
    
    report = {
        'user_name': current_user.full_name,
        'date_range': f"{start_date_str or 'Beginning'} to {end_date_str or 'Today'}",
        'total_income': total_income,
        'total_expenses': total_expenses,
        'balance': balance,
        'category_summary': cat_summary_list,
        'budget_info': budget.to_dict() if budget else None,
        'transactions': [t.to_dict() for t in transactions]
    }
    
    return jsonify(report), 200
