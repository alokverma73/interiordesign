import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_user
from app.config.database import get_db
from app.models.communication import Conversation, Message, Notification, NotificationType
from app.models.project import Project
from app.models.user import User, UserType

router = APIRouter(prefix="/dashboard/projects/{project_id}/messages", tags=["Messaging"])


class MessageCreate(BaseModel):
    body: str
    attachments: List[str] = []


class MessageOut(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    body: str
    attachments: List[str]
    is_read: bool

    model_config = {"from_attributes": True}


def _get_or_create_conversation(db: Session, project: Project) -> Conversation:
    convo = (
        db.query(Conversation)
        .options(selectinload(Conversation.messages))
        .filter(Conversation.project_id == project.id)
        .first()
    )
    if not convo:
        convo = Conversation(project_id=project.id)
        db.add(convo)
        db.commit()
        db.refresh(convo)
    return convo


def _assert_access(project: Project, user: User) -> None:
    if user.user_type == UserType.CUSTOMER and project.customer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this project.")


@router.get("", response_model=List[MessageOut])
def list_messages(project_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
    _assert_access(project, user)

    convo = _get_or_create_conversation(db, project)
    # Mark other party's messages as read.
    for m in convo.messages:
        if m.sender_id != user.id:
            m.is_read = True
    db.commit()
    return convo.messages


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    project_id: uuid.UUID,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
    _assert_access(project, user)

    convo = _get_or_create_conversation(db, project)
    message = Message(conversation_id=convo.id, sender_id=user.id, body=payload.body, attachments=payload.attachments)
    db.add(message)

    # Notify the other party.
    recipients = set()
    if project.customer_id and project.customer_id != user.id:
        recipients.add(project.customer_id)
    for member in project.members:
        if member.user_id != user.id:
            recipients.add(member.user_id)

    for recipient_id in recipients:
        db.add(
            Notification(
                user_id=recipient_id,
                type=NotificationType.NEW_MESSAGE,
                title=f"New message on {project.name}",
                body=payload.body[:140],
                link=f"/dashboard/projects/{project_id}",
            )
        )

    db.commit()
    db.refresh(message)
    return message
