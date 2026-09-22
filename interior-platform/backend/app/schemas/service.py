import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    slug: str = Field(min_length=2, max_length=180)
    short_description: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    gallery: List[str] = []
    features: List[str] = []
    process_steps: List[Dict[str, Any]] = []
    faqs: List[Dict[str, Any]] = []
    cta_label: Optional[str] = "Request a Quote"
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    gallery: Optional[List[str]] = None
    features: Optional[List[str]] = None
    process_steps: Optional[List[Dict[str, Any]]] = None
    faqs: Optional[List[Dict[str, Any]]] = None
    cta_label: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    short_description: Optional[str]
    description: Optional[str]
    cover_image_url: Optional[str]
    gallery: List[str]
    features: List[str]
    process_steps: List[Dict[str, Any]]
    faqs: List[Dict[str, Any]]
    cta_label: Optional[str]
    seo_title: Optional[str]
    seo_description: Optional[str]
    display_order: int
    is_active: bool

    model_config = {"from_attributes": True}
