from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, joinedload, selectinload

from app.auth.jwt import decode_access_token
from app.config.database import get_db
from app.models.user import Role, User, UserType

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    # has_permission() walks role.permissions, so load both eagerly here rather
    # than firing two extra queries on every single authenticated request.
    user = (
        db.query(User)
        .options(joinedload(User.role).selectinload(Role.permissions))
        .filter(User.id == payload["sub"])
        .first()
    )
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive")

    return user


def get_current_customer(user: User = Depends(get_current_user)) -> User:
    if user.user_type != UserType.CUSTOMER:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Customer account required")
    return user


def get_current_staff(user: User = Depends(get_current_user)) -> User:
    """Any authenticated staff/admin user, regardless of specific role."""
    if user.user_type != UserType.STAFF:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Staff account required")
    return user


def require_permission(permission_code: str):
    """Dependency factory: require_permission('projects.manage')"""

    def dependency(user: User = Depends(get_current_staff)) -> User:
        if not user.has_permission(permission_code):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return dependency
