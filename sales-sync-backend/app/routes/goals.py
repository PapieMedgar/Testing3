from flask import Blueprint, request, jsonify
from app.models.goal import Goal, GoalType
from app.models.user import User, UserRole
from app.models.shop import Shop
from app import db
from datetime import datetime
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

goals = Blueprint('goals', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != UserRole.ADMIN:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@goals.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
@admin_required
def create_goal():
    data = request.get_json()
    
    if not all(k in data for k in ['title', 'goal_type', 'target_value', 'start_date', 'end_date']):
        return jsonify({'error': 'Missing required fields'}), 400
        
    # Validate goal type
    if data['goal_type'] not in [gt.value for gt in GoalType]:
        return jsonify({'error': 'Invalid goal type'}), 400
    
    # Convert dates
    try:
        start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    # Create goal
    goal = Goal(
        title=data['title'],
        description=data.get('description'),
        goal_type=data['goal_type'],
        target_value=data['target_value'],
        start_date=start_date,
        end_date=end_date,
        creator_id=get_jwt_identity(),
        user_id=data.get('user_id'),  # Allow assigning goal to specific user
        region=data.get('region'),
        shop_id=data.get('shop_id')
    )
    
    # Validate user_id if provided
    if goal.user_id:
        assigned_user = User.query.get(goal.user_id)
        if not assigned_user:
            return jsonify({'error': 'Invalid user_id provided'}), 400
    
    db.session.add(goal)
    db.session.commit()
    
    return jsonify(goal.to_dict()), 201

@goals.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_goals():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Get query parameters
    goal_type = request.args.get('type')
    region = request.args.get('region')
    
    query = Goal.query
    
    # Filter by type if specified
    if goal_type:
        query = query.filter(Goal.goal_type == goal_type)
    
    # Filter by region if specified
    if region:
        query = query.filter(Goal.region == region)
        
    # Filter by user role and permissions
    if user.role != UserRole.ADMIN:
        # Regular users only see goals assigned to them
        query = query.filter((Goal.user_id == current_user_id) | (Goal.user_id.is_(None)))
    
    # Get active goals (end date not passed)
    active = request.args.get('active', 'true').lower() == 'true'
    if active:
        query = query.filter(Goal.end_date >= datetime.utcnow())
    
    goals = query.order_by(Goal.created_at.desc()).all()
    return jsonify([goal.to_dict() for goal in goals]), 200

@goals.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    data = request.get_json()
    
    # Update fields if provided
    if 'title' in data:
        goal.title = data['title']
    if 'description' in data:
        goal.description = data['description']
    if 'target_value' in data:
        goal.target_value = data['target_value']
    if 'start_date' in data:
        goal.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
    if 'end_date' in data:
        goal.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
    if 'region' in data:
        goal.region = data['region']
    if 'shop_id' in data:
        goal.shop_id = data['shop_id']
    if 'user_id' in data:
        # Validate user exists
        if data['user_id'] is not None:
            assigned_user = User.query.get(data['user_id'])
            if not assigned_user:
                return jsonify({'error': 'Invalid user_id provided'}), 400
        goal.user_id = data['user_id']
    
    db.session.commit()
    return jsonify(goal.to_dict()), 200

@goals.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    db.session.delete(goal)
    db.session.commit()
    return '', 204

# Goal progress tracking
def update_visit_goals(visit_id, shop_id=None):
    """
    Update goals related to visits when a new visit is created
    """
    now = datetime.utcnow()
    
    # Update individual visit goals
    individual_goals = Goal.query.filter(
        Goal.goal_type == GoalType.INDIVIDUAL_VISITS.value,
        Goal.start_date <= now,
        Goal.end_date >= now
    ).all()
    
    for goal in individual_goals:
        goal.current_value += 1
    
    # Update shop visit goals if shop_id is provided
    if shop_id:
        shop_goals = Goal.query.filter(
            Goal.goal_type == GoalType.SHOP_VISITS.value,
            Goal.start_date <= now,
            Goal.end_date >= now,
            Goal.shop_id == shop_id
        ).all()
        
        for goal in shop_goals:
            goal.current_value += 1
    
    db.session.commit()

def update_agent_goal():
    """
    Update agent count goals
    """
    now = datetime.utcnow()
    agent_count = User.query.filter(User.role == 'AGENT').count()
    
    agent_goals = Goal.query.filter(
        Goal.goal_type == GoalType.AGENT_COUNT.value,
        Goal.start_date <= now,
        Goal.end_date >= now
    ).all()
    
    for goal in agent_goals:
        goal.current_value = agent_count
    
    db.session.commit()

def update_manager_goal():
    """
    Update manager count goals
    """
    now = datetime.utcnow()
    manager_count = User.query.filter(User.role == 'MANAGER').count()
    
    manager_goals = Goal.query.filter(
        Goal.goal_type == GoalType.MANAGER_COUNT.value,
        Goal.start_date <= now,
        Goal.end_date >= now
    ).all()
    
    for goal in manager_goals:
        goal.current_value = manager_count
    
    db.session.commit()
