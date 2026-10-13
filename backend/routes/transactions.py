from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import desc, asc
from models import db
from models.transaction import Transaction
from utils.auth import token_required
from utils.validators import validate_amount, validate_transaction_type, validate_date

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/api/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    query = Transaction.query.filter_by(user_id=current_user.id)
    
    # Query params
    search = request.args.get('search')
    category = request.args.get('category')
    tx_type = request.args.get('type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    sort_by = request.args.get('sort_by', 'transaction_date')
    sort_order = request.args.get('sort_order', 'desc')
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    if search:
        query = query.filter(Transaction.description.ilike(f'%{search}%'))
    if category:
        query = query.filter(Transaction.category == category)
    if tx_type:
        query = query.filter(Transaction.type == tx_type)
    if start_date:
        query = query.filter(Transaction.transaction_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Transaction.transaction_date <= datetime.strptime(end_date, '%Y-%m-%d').date())

    if sort_by == 'amount':
        order_col = Transaction.amount
    else:
        order_col = Transaction.transaction_date

    if sort_order == 'asc':
        query = query.order_by(asc(order_col))
    else:
        query = query.order_by(desc(order_col))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'transactions': [tx.to_dict() for tx in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@transactions_bp.route('/api/transactions', methods=['POST'])
@token_required
def create_transaction(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    tx_type = data.get('type')
    amount = data.get('amount')
    category = data.get('category')
    transaction_date = data.get('transaction_date')

    if not all([tx_type, amount, category, transaction_date]):
        return jsonify({'message': 'type, amount, category, transaction_date are required'}), 400

    if not validate_transaction_type(tx_type):
        return jsonify({'message': 'Invalid transaction type'}), 400
    if not validate_amount(amount):
        return jsonify({'message': 'Invalid amount'}), 400
    if not validate_date(transaction_date):
        return jsonify({'message': 'Invalid date format'}), 400

    new_tx = Transaction(
        user_id=current_user.id,
        type=tx_type,
        amount=amount,
        category=category,
        description=data.get('description'),
        transaction_date=datetime.strptime(transaction_date, '%Y-%m-%d').date(),
        payment_method=data.get('payment_method'),
        notes=data.get('notes')
    )

    try:
        db.session.add(new_tx)
        db.session.commit()
        return jsonify({'message': 'Transaction created successfully', 'transaction': new_tx.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create transaction', 'error': str(e)}), 500

@transactions_bp.route('/api/transactions/<int:id>', methods=['PUT'])
@token_required
def update_transaction(current_user, id):
    tx = Transaction.query.filter_by(id=id, user_id=current_user.id).first()
    if not tx:
        return jsonify({'message': 'Transaction not found'}), 404

    data = request.get_json()
    
    if 'type' in data:
        if not validate_transaction_type(data['type']):
            return jsonify({'message': 'Invalid transaction type'}), 400
        tx.type = data['type']
    if 'amount' in data:
        if not validate_amount(data['amount']):
            return jsonify({'message': 'Invalid amount'}), 400
        tx.amount = data['amount']
    if 'category' in data:
        tx.category = data['category']
    if 'transaction_date' in data:
        if not validate_date(data['transaction_date']):
            return jsonify({'message': 'Invalid date format'}), 400
        tx.transaction_date = datetime.strptime(data['transaction_date'], '%Y-%m-%d').date()
    if 'description' in data:
        tx.description = data['description']
    if 'payment_method' in data:
        tx.payment_method = data['payment_method']
    if 'notes' in data:
        tx.notes = data['notes']

    try:
        db.session.commit()
        return jsonify({'message': 'Transaction updated successfully', 'transaction': tx.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update transaction', 'error': str(e)}), 500

@transactions_bp.route('/api/transactions/<int:id>', methods=['DELETE'])
@token_required
def delete_transaction(current_user, id):
    tx = Transaction.query.filter_by(id=id, user_id=current_user.id).first()
    if not tx:
        return jsonify({'message': 'Transaction not found'}), 404

    try:
        db.session.delete(tx)
        db.session.commit()
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete transaction', 'error': str(e)}), 500
