from __future__ import annotations

from typing import Any

from flask import Blueprint, g, jsonify, request
from pydantic import BaseModel, Field, ValidationError, field_validator

from app.core.db import get_db
from app.repositories.MembersRepository import MembersRepository
from app.routes import format_validation_error
from app.services.media import build_media_url, delete_media
from app.services.security import enforce_csrf, require_roles


members_bp = Blueprint("members", __name__, url_prefix="/members")
admin_members_bp = Blueprint("admin_members", __name__, url_prefix="/admin/members")


class MemberPayload(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=160)
    role: str | None = Field(default=None, max_length=160)
    bio: str | None = Field(default=None, max_length=4000)
    order_index: int = Field(default=0, ge=0, le=10000)
    photo_path: str | None = Field(default=None, max_length=512)

    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Informe o nome do membro.")
        return cleaned

    @field_validator("role", "bio", "photo_path")
    @classmethod
    def normalize_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


def _serialize_member(
    member,
    *,
    include_internal: bool = False,
    external: bool = False,
) -> dict[str, Any]:
    payload = {
        "id": member.id,
        "full_name": member.full_name,
        "role": member.role,
        "bio": member.bio,
        "order_index": member.order_index,
        "photo_url": build_media_url(member.photo_path, external=external),
        "created_at": member.created_at.isoformat() if member.created_at else None,
        "updated_at": member.updated_at.isoformat() if member.updated_at else None,
    }
    if include_internal:
        payload["photo_path"] = member.photo_path
    return payload


@members_bp.get("")
def list_members():
    repo = MembersRepository(get_db())
    members = repo.list_members()
    return jsonify(
        {
            "total": len(members),
            "members": [
                _serialize_member(member, external=True) for member in members
            ],
        }
    )


@members_bp.get("/<int:member_id>")
def get_member(member_id: int):
    repo = MembersRepository(get_db())
    member = repo.get_member(member_id)
    if not member:
        return jsonify({"detail": "Membro não encontrado."}), 404
    return jsonify({"member": _serialize_member(member, external=True)})


@admin_members_bp.before_request
def ensure_admin():
    if request.method == "OPTIONS":
        return None
    g.current_admin = require_roles("Admin")
    return None


def _parse_payload() -> MemberPayload:
    data = request.get_json(silent=True) or {}
    return MemberPayload.model_validate(data)


@admin_members_bp.get("")
def admin_list_members():
    repo = MembersRepository(get_db())
    members = repo.list_members()
    return jsonify(
        {
            "total": len(members),
            "members": [
                _serialize_member(member, include_internal=True, external=True)
                for member in members
            ],
        }
    )


@admin_members_bp.post("")
def admin_create_member():
    enforce_csrf()
    try:
        payload = _parse_payload()
    except ValidationError as exc:
        return jsonify({"detail": format_validation_error(exc)}), 422

    repo = MembersRepository(get_db())
    member = repo.create_member(
        full_name=payload.full_name,
        role=payload.role,
        bio=payload.bio,
        order_index=payload.order_index,
        photo_path=payload.photo_path,
    )
    return (
        jsonify(
            {
                "member": _serialize_member(
                    member, include_internal=True, external=True
                )
            }
        ),
        201,
    )


@admin_members_bp.put("/<int:member_id>")
def admin_update_member(member_id: int):
    enforce_csrf()
    try:
        payload = _parse_payload()
    except ValidationError as exc:
        return jsonify({"detail": format_validation_error(exc)}), 422

    repo = MembersRepository(get_db())
    try:
        member, removed_path = repo.update_member(
            member_id,
            full_name=payload.full_name,
            role=payload.role,
            bio=payload.bio,
            order_index=payload.order_index,
            photo_path=payload.photo_path,
        )
    except LookupError:
        return jsonify({"detail": "Membro não encontrado."}), 404

    delete_media(removed_path)

    return jsonify(
        {
            "member": _serialize_member(
                member, include_internal=True, external=True
            )
        }
    )


@admin_members_bp.delete("/<int:member_id>")
def admin_delete_member(member_id: int):
    enforce_csrf()
    repo = MembersRepository(get_db())
    try:
        photo_path = repo.delete_member(member_id)
    except LookupError:
        return jsonify({"detail": "Membro não encontrado."}), 404
    delete_media(photo_path)
    return jsonify({"ok": True})
