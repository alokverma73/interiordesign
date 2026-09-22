import datetime
import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from app.models.project import ProjectCategory, ProjectStatus


class ProjectCreate(BaseModel):
    name: str
    slug: str
    category: ProjectCategory
    location: Optional[str] = None
    client_type: Optional[str] = None
    completion_date: Optional[datetime.date] = None
    area_sqft: Optional[int] = None
    description: Optional[str] = None
    design_concept: Optional[str] = None
    materials_used: List[str] = []
    cover_image_url: Optional[str] = None
    gallery: List[str] = []
    before_after_images: List[Dict[str, Any]] = []
    is_featured: bool = False
    is_published: bool = False
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    service_ids: List[uuid.UUID] = []
    customer_id: Optional[uuid.UUID] = None


class ProjectUpdateSchema(BaseModel):
    name: Optional[str] = None
    category: Optional[ProjectCategory] = None
    location: Optional[str] = None
    client_type: Optional[str] = None
    completion_date: Optional[datetime.date] = None
    area_sqft: Optional[int] = None
    description: Optional[str] = None
    design_concept: Optional[str] = None
    materials_used: Optional[List[str]] = None
    cover_image_url: Optional[str] = None
    gallery: Optional[List[str]] = None
    before_after_images: Optional[List[Dict[str, Any]]] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    status: Optional[ProjectStatus] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    service_ids: Optional[List[uuid.UUID]] = None
    customer_id: Optional[uuid.UUID] = None
    start_date: Optional[datetime.date] = None
    expected_completion_date: Optional[datetime.date] = None


class ProjectOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    category: ProjectCategory
    location: Optional[str]
    client_type: Optional[str]
    completion_date: Optional[datetime.date]
    area_sqft: Optional[int]
    description: Optional[str]
    design_concept: Optional[str]
    materials_used: List[str]
    cover_image_url: Optional[str]
    gallery: List[str]
    before_after_images: List[Dict[str, Any]]
    is_featured: bool
    is_published: bool
    status: ProjectStatus
    seo_title: Optional[str]
    seo_description: Optional[str]

    model_config = {"from_attributes": True}


class MilestoneOut(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    status: ProjectStatus
    is_completed: bool
    completed_at: Optional[datetime.date]
    due_date: Optional[datetime.date]

    model_config = {"from_attributes": True}


class ProjectPortalOut(ProjectOut):
    """Extended view returned to the logged-in customer for their own project."""
    start_date: Optional[datetime.date]
    expected_completion_date: Optional[datetime.date]
    milestones: List[MilestoneOut] = []
