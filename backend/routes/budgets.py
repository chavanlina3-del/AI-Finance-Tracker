from flask import Blueprint, request, jsonify
from sqlalchemy import func, extract
from models import db
from models.budget import Budget, CategoryBudget
from models.transaction import Transaction
from utils.auth import token_required

budgets_bp = Blueprint('budgets', __name__)

@budgets_bp.route('/api/budgets', methods=['GET'])
@token_required
def get_budgets(current_user):
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    query = Budget.query.filter_by(user_id=current_user.id)
    if month:
        query = query.filter_by(month=month)
    if year:
        query = query.filter_by(year=year)
        
    budgets = query.all()
    
    result = []
    for budget in budgets:
        budget_dict = budget.to_dict()
        
        # Calculate spent amounts per category
        for cat_budget in budget_dict['category_budgets']:
            spent = db.session.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == current_user.id,
                Transaction.type == 'expense',
                Transaction.category == cat_budget['category'],
                extract('month', Transaction.transaction_date) == budget.month,
                extract('year', Transaction.transaction_date) == budget.year
            ).scalar() or 0
            cat_budget['spent_amount'] = float(spent)
            
        result.append(budget_dict)

    return jsonify({'budgets': result}), 200

@budgets_bp.route('/api/budgets', methods=['POST'])
@token_required
def create_budget(current_user):
    data = request.get_json()
    month = data.get('month')
    year = data.get('year')
    total_budget = data.get('total_budget')

    if not all([month, year, total_budget]):
        return jsonify({'message': 'month, year, total_budget required'}), 400

    existing = Budget.query.filter_by(user_id=current_user.id, month=month, year=year).first()
    if existing:
        return jsonify({'message': 'Budget for this month and year already exists'}), 400

    new_budget = Budget(user_id=current_user.id, month=month, year=year, total_budget=total_budget)
    db.session.add(new_budget)
    db.session.flush()

    category_budgets = data.get('category_budgets', [])
    for cb in category_budgets:
        new_cb = CategoryBudget(
            budget_id=new_budget.id,
            category=cb.get('category'),
            budget_amount=cb.get('budget_amount')
        )
        db.session.add(new_cb)

    try:
        db.session.commit()
        return jsonify({'message': 'Budget created successfully', 'budget': new_budget.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create budget', 'error': str(e)}), 500

@budgets_bp.route('/api/budgets/<int:id>', methods=['PUT'])
@token_required
def update_budget(current_user, id):
    budget = Budget.query.filter_by(id=id, user_id=current_user.id).first()
    if not budget:
        return jsonify({'message': 'Budget not found'}), 404

    data = request.get_json()
    if 'total_budget' in data:
        budget.total_budget = data['total_budget']
        
    if 'category_budgets' in data:
        CategoryBudget.query.filter_by(budget_id=budget.id).delete()
        for cb in data['category_budgets']:
            new_cb = CategoryBudget(
                budget_id=budget.id,
                category=cb.get('category'),
                budget_amount=cb.get('budget_amount')
            )
            db.session.add(new_cb)

    try:
        db.session.commit()
        return jsonify({'message': 'Budget updated successfully', 'budget': budget.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update budget', 'error': str(e)}), 500

@budgets_bp.route('/api/budgets/<int:id>', methods=['DELETE'])
@token_required
def delete_budget(current_user, id):
    budget = Budget.query.filter_by(id=id, user_id=current_user.id).first()
    if not budget:
        return jsonify({'message': 'Budget not found'}), 404

    try:
        db.session.delete(budget)
        db.session.commit()
        return jsonify({'message': 'Budget deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete budget', 'error': str(e)}), 500
