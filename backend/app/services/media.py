from __future__ import annotations

import os
from pathlib import Path
from typing import Optional
from uuid import uuid4

from flask import current_app, url_for
from werkzeug.datastructures import FileStorage

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_IMAGE_UPLOAD_BYTES = 512 * 1024  # 512 KB


def _static_root() -> Path:
    static_folder = current_app.static_folder
    if not static_folder:
        raise RuntimeError("Static folder is not configured.")
    return Path(static_folder)


def _uploads_root() -> Path:
    root = _static_root() / "uploads"
    root.mkdir(parents=True, exist_ok=True)
    return root


def _ensure_subdir(subdir: str) -> Path:
    safe_subdir = subdir.strip().strip("/").replace("..", "")
    target = _uploads_root() / safe_subdir
    target.mkdir(parents=True, exist_ok=True)
    return target


def save_image(file: FileStorage, subdir: str) -> str:
    if not file or not file.filename:
        raise ValueError("Nenhum arquivo foi enviado.")

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError("Formato de imagem não suportado.")

    stream = file.stream
    position = stream.tell()
    stream.seek(0, os.SEEK_END)
    size = stream.tell()
    stream.seek(position, os.SEEK_SET)
    if size > MAX_IMAGE_UPLOAD_BYTES:
        raise ValueError("A imagem deve ter no máximo 512 KB.")
    stream.seek(0)

    destination_dir = _ensure_subdir(subdir)
    filename = f"{uuid4().hex}{extension}"
    destination_path = destination_dir / filename
    file.save(destination_path)

    relative_path = f"uploads/{subdir.strip().strip('/')}/{filename}"
    return relative_path


def delete_media(path: Optional[str]) -> None:
    if not path:
        return
    safe_path = Path(path.strip().lstrip("/"))
    full_path = (_static_root() / safe_path).resolve()
    static_root = _static_root().resolve()
    if not str(full_path).startswith(str(static_root)):
        # evita remover fora do diretório estático
        return
    try:
        full_path.unlink()
    except FileNotFoundError:
        pass


def build_media_url(
    path: Optional[str],
    *,
    external: bool = False,
    fallback: Optional[str] = None,
) -> Optional[str]:
    if path:
        normalized = path.strip()
        if normalized.startswith("http://") or normalized.startswith("https://"):
            return normalized
        return url_for("static", filename=normalized, _external=external)
    if fallback:
        return url_for("static", filename=fallback, _external=external)
    return None
