from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.user import User, UserRole, users_schema, user_schema
from app.models.shop import Shop, shops_schema, shop_schema
from app.models.checkin import CheckIn, CheckInStatus, checkins_schema, checkin_schema

manager_bp = Blueprint('manager', __name__)

def require_manager():
    """Ensure only managers can access routes"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(int(current_user_id))
    if not current_user or current_user.role != UserRole.MANAGER:
        return jsonify({"error": "Manager access required"}), 403
    return current_user

# View assigned agents - now based on manager_id hierarchy
@manager_bp.route('/my-agents', methods=['GET'])
@jwt_required()
def get_my_agents():
    current_user = require_manager()
    if isinstance(current_user, tuple):  # Error response
        return current_user
    
    # Get all agents managed by this manager
    agents = User.query.filter_by(manager_id=current_user.id, role=UserRole.AGENT).all()
    return users_schema.jsonify(agents)

@manager_bp.route('/agents/<int:agent_id>/checkins', methods=['GET'])
@jwt_required()
def get_agent_checkins(agent_id):
    current_user = require_manager()
    if isinstance(current_user, tuple):
        return current_user
    
    # Verify the agent belongs to this manager
    agent = User.query.filter_by(id=agent_id, manager_id=current_user.id, role=UserRole.AGENT).first()
    if not agent:
        return jsonify({"error": "Agent not found or not managed by you"}), 404
    
    # Apply filters from query parameters
    query = CheckIn.query.filter_by(agent_id=agent_id)
    
    # Date filtering
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    status = request.args.get('status')
    
    if from_date:
        try:
            from_date_obj = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            query = query.filter(CheckIn.timestamp >= from_date_obj)
        except ValueError:
            return jsonify({"error": "Invalid from_date format"}), 400
    
    if to_date:
        try:
            to_date_obj = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
            query = query.filter(CheckIn.timestamp <= to_date_obj)
        except ValueError:
            return jsonify({"error": "Invalid to_date format"}), 400
    
    if status:
        if hasattr(CheckInStatus, status.upper()):
            query = query.filter(CheckIn.status == CheckInStatus[status.upper()])
        else:
            return jsonify({"error": "Invalid status"}), 400
    
    checkins = query.order_by(CheckIn.timestamp.desc()).all()
    return checkins_schema.jsonify(checkins)

# View all checkins from my agents
@manager_bp.route('/my-checkins', methods=['GET'])  
@jwt_required()
def get_all_my_agents_checkins():
    current_user = require_manager()
    if isinstance(current_user, tuple):
        return current_user
    
    # Get all agents managed by this manager
    agent_ids = [agent.id for agent in User.query.filter_by(manager_id=current_user.id, role=UserRole.AGENT).all()]
    
    if not agent_ids:
        return jsonify([])
    
    # Start with base query
    query = CheckIn.query.filter(CheckIn.agent_id.in_(agent_ids))
    
    # Apply filters from query parameters
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    status = request.args.get('status')
    
    if from_date:
        try:
            from_date_obj = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            query = query.filter(CheckIn.timestamp >= from_date_obj)
        except ValueError:
            return jsonify({"error": "Invalid from_date format"}), 400
    
    if to_date:
        try:
            to_date_obj = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
            query = query.filter(CheckIn.timestamp <= to_date_obj)
        except ValueError:
            return jsonify({"error": "Invalid to_date format"}), 400
    
    if status:
        if hasattr(CheckInStatus, status.upper()):
            query = query.filter(CheckIn.status == CheckInStatus[status.upper()])
        else:
            return jsonify({"error": "Invalid status"}), 400
    
    # Get all checkins from these agents, ordered by most recent first
    checkins = query.order_by(CheckIn.timestamp.desc()).all()
    return checkins_schema.jsonify(checkins)

# Flag anomalies in checkins
@manager_bp.route('/checkins/<int:checkin_id>/flag', methods=['POST'])
@jwt_required()
def flag_checkin(checkin_id):
    current_user = require_manager()
    if isinstance(current_user, tuple):
        return current_user
    
    checkin = CheckIn.query.get_or_404(checkin_id)
    
    # Verify this checkin belongs to one of the manager's agents
    agent = User.query.filter_by(id=checkin.agent_id, manager_id=current_user.id, role=UserRole.AGENT).first()
    if not agent:
        return jsonify({"error": "Unauthorized to flag this checkin"}), 403
    
    # Flag the checkin
    checkin.status = CheckInStatus.FLAGGED
    db.session.commit()
    
    return checkin_schema.jsonify(checkin)