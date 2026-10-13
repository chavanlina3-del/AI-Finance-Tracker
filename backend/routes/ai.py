from flask import Blueprint, jsonify, request
from models.transaction import Transaction
from models.budget import Budget
from models.goal import Goal
from services.ai_service import AIService
from utils.auth import token_required

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/api/ai/insights', methods=['GET'])
@token_required
def get_insights(current_user):
    transactions = Transaction.query.filter_by(user_id=current_user.id).all()
    budgets = Budget.query.filter_by(user_id=current_user.id).all()
    
    insights = AIService.analyze_spending(transactions, budgets)
    recommendations = AIService.generate_recommendations(transactions, budgets)
    
    return jsonify({
        **insights,
        'recommendations': recommendations
    }), 200

@ai_bp.route('/api/ai/prediction', methods=['GET'])
@token_required
def get_prediction(current_user):
    transactions = Transaction.query.filter_by(user_id=current_user.id).all()
    prediction = AIService.predict_expenses(transactions)
    return jsonify(prediction), 200

@ai_bp.route('/api/ai/assistant', methods=['POST'])
@token_required
def ai_assistant(current_user):
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'message': 'Message is required'}), 400
        
    question = data['message']
    transactions = Transaction.query.filter_by(user_id=current_user.id).all()
    budgets = Budget.query.filter_by(user_id=current_user.id).all()
    goals = Goal.query.filter_by(user_id=current_user.id).all()
    
    response = AIService.process_question(question, transactions, budgets, goals)
    
    return jsonify({'response': response}), 200
