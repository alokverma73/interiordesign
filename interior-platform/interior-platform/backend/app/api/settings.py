from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_permission
from app.config.database import get_db
from app.models.content import WebsiteSetting
from app.schemas.content import WebsiteSettingUpdate

router = APIRouter(tags=["Settings"])


@router.get("/settings")
def get_public_settings(group: str | None = None, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Public, read-only view of CMS content: hero copy, company info, homepage
    sections, footer, etc. Returned as a flat {key: value} map for easy
    frontend consumption.
    """
    query = db.query(WebsiteSetting)
    if group:
        query = query.filter(WebsiteSetting.group == group)
    return {s.key: s.value for s in query.all()}


admin_router = APIRouter(prefix="/admin/settings", tags=["Admin - Settings"])


@admin_router.get("")
def admin_list_settings(db: Session = Depends(get_db), _=Depends(require_permission("settings.manage"))):
    return [{"key": s.key, "value": s.value, "group": s.group} for s in db.query(WebsiteSetting).all()]


@admin_router.put("")
def admin_upsert_setting(
    payload: WebsiteSettingUpdate, db: Session = Depends(get_db), _=Depends(require_permission("settings.manage"))
):
    setting = db.query(WebsiteSetting).filter(WebsiteSetting.key == payload.key).first()
    if setting:
        setting.value = payload.value
        setting.group = payload.group
    else:
        setting = WebsiteSetting(**payload.model_dump())
        db.add(setting)
    db.commit()
    return {"key": payload.key, "value": payload.value, "group": payload.group}
