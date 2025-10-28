from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from app.services.media import build_media_url, save_image
from app.services.security import enforce_csrf, require_roles


uploads_bp = Blueprint("uploads", __name__, url_prefix="/admin/uploads")


@uploads_bp.before_request
def ensure_admin():
    if request.method == "OPTIONS":
        return None
    g.current_admin = require_roles("Admin")
    return None


def _handle_image_upload(subdir: str):
    enforce_csrf()
    file = request.files.get("file")
    if not file:
        return jsonify({"detail": "Envie um arquivo de imagem."}), 400
    try:
        relative_path = save_image(file, subdir)
    except ValueError as exc:
        return jsonify({"detail": str(exc)}), 400
    url = build_media_url(relative_path, external=True)
    return jsonify({"path": relative_path, "url": url}), 201


@uploads_bp.post("/members")
def upload_member_photo():
    return _handle_image_upload("members")


@uploads_bp.post("/trails")
def upload_trail_thumbnail():
    return _handle_image_upload("trails")
