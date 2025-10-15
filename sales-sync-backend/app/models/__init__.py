# Import models in proper order to avoid circular dependencies
# Import base models first
from .user import User, UserRole, UserSchema, user_schema, users_schema, manager_agent_association, shop_manager_association
from .shop import Shop, ShopSchema, shop_schema, shops_schema
from .checkin import CheckIn, CheckInStatus, CheckInSchema, checkin_schema, checkins_schema
from .visit_response import VisitResponse, VisitType, VisitResponseSchema, visit_response_schema, visit_responses_schema

# Ensure all models are registered
__all__ = [
    'User', 'UserRole', 'UserSchema', 'user_schema', 'users_schema',
    'Shop', 'ShopSchema', 'shop_schema', 'shops_schema', 
    'CheckIn', 'CheckInStatus', 'CheckInSchema', 'checkin_schema', 'checkins_schema',
    'VisitResponse', 'VisitType', 'VisitResponseSchema', 'visit_response_schema', 'visit_responses_schema',
    'manager_agent_association', 'shop_manager_association'
]
