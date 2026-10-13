from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db
from models.goal import Goal
from utils.auth import token_required

goals_bp = Blueprint('goals', __name__)

@goals_bp.route('/api/goals', methods=['GET'])
@token_required
def get_goals(current_user):
    goals = Goal.query.filter_by(user_id=current_user.id).all()
    return jsonify({'goals': [g.to_dict() for g in goals]}), 200

@goals_bp.route('/api/goals', methods=['POST'])
@token_required
def create_goal(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data'}), 400
        
    goal_name = data.get('goal_name')
    target_amount = data.get('target_amount')
    
    if not all([goal_name, target_amount]):
        return jsonify({'message': 'goal_name and target_amount required'}), 400
        
    target_date_str = data.get('target_date')
    target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date() if target_date_str else None

    new_goal = Goal(
        user_id=current_user.id,
        goal_name=goal_name,
        target_amount=target_amount,
        current_amount=data.get('current_amount', 0),
        target_date=target_date,
        status=data.get('status', 'active')
    )
    
    try:
        db.session.add(new_goal)
        db.session.commit()
        return jsonify({'message': 'Goal created successfully', 'goal': new_goal.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create goal', 'error': str(e)}), 500

@goals_bp.route('/api/goals/<int:id>', methods=['PUT'])
@token_required
def update_goal(current_user, id):
    goal = Goal.query.filter_by(id=id, user_id=current_user.id).first()
    if not goal:
        return jsonify({'message': 'Goal not found'}), 404

    data = request.get_json()
    if 'goal_name' in data:
        goal.goal_name = data['goal_name']
    if 'target_amount' in data:
        goal.target_amount = data['target_amount']
    if 'current_amount' in data:
        goal.current_amount = data['current_amount']
    if 'target_date' in data:
        goal.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data['target_date'] else None
    if 'status' in data:
        goal.status = data['status']
        
    try:
        db.session.commit()
        return jsonify({'message': 'Goal updated successfully', 'goal': goal.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update goal', 'error': str(e)}), 500

@goals_bp.route('/api/goals/<int:id>', methods=['DELETE'])
@token_required
def delete_goal(current_user, id):
    goal = Goal.query.filter_by(id=id, user_id=current_user.id).first()
    if not goal:
        return jsonify({'message': 'Goal not found'}), 404
        
    try:
        db.session.delete(goal)
        db.session.commit()
        return jsonify({'message': 'Goal deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete goal', 'error': str(e)}), 500
