from __future__ import annotations

import hashlib
import mimetypes
import os
from contextlib import closing
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from uuid import uuid4

from flask import current_app, url_for
from werkzeug.datastructures import FileStorage

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".odt",
    ".ods",
    ".txt",
}
MAX_IMAGE_UPLOAD_BYTES = 512 * 1024  # 512 KB
MAX_DOCUMENT_DOWNLOAD_BYTES = 20 * 1024 * 1024  # 20 MB
MAX_DOCUMENT_UPLOAD_BYTES = MAX_DOCUMENT_DOWNLOAD_BYTES
_DOCUMENT_CHUNK_SIZE = 8192
_DOCUMENT_USER_AGENT = "ROTA-Backend/1.0"


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


def save_document_file(file: FileStorage, subdir: str = "documents") -> str:
    if not file or not file.filename:
        raise ValueError("Nenhum arquivo foi enviado.")

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise ValueError("Formato de documento não suportado.")

    stream = file.stream
    position = stream.tell()
    stream.seek(0, os.SEEK_END)
    size = stream.tell()
    stream.seek(position, os.SEEK_SET)
    if size > MAX_DOCUMENT_UPLOAD_BYTES:
        raise ValueError("O documento deve ter no máximo 20 MB.")
    stream.seek(0)

    clean_subdir = subdir.strip().strip("/") or "documents"
    destination_dir = _ensure_subdir(clean_subdir)
    filename = f"{uuid4().hex}{extension}"
    destination_path = destination_dir / filename
    file.save(destination_path)

    relative_path = f"uploads/{clean_subdir}/{filename}"
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


def _normalize_static_relative(path: str) -> str:
    normalized = path.strip().lstrip("/")
    if normalized.startswith("static/"):
        normalized = normalized[len("static/") :]
    return normalized


def cache_document(
    url: str,
    *,
    subdir: str = "documents",
    filename_hint: Optional[str] = None,
) -> str:
    """
    Garante que um documento esteja disponível localmente.

    Retorna o caminho relativo ao diretório estático (por exemplo,
    'uploads/documents/abc123.pdf').
    """
    normalized = (url or "").strip()
    if not normalized:
        raise ValueError("Informe o endereço do documento.")

    if normalized.startswith(("http://", "https://")):
        return _download_document(
            normalized,
            subdir=subdir,
            filename_hint=filename_hint,
        )

    relative = _normalize_static_relative(normalized)
    if not relative:
        raise ValueError("Caminho do documento inválido.")

    static_root = _static_root().resolve()
    candidate = (static_root / relative).resolve()

    if not str(candidate).startswith(str(static_root)):
        raise ValueError("Caminho do documento inválido.")
    if not candidate.exists():
        raise ValueError("Arquivo de documento local não encontrado.")

    return str(candidate.relative_to(static_root))


def _download_document(
    url: str,
    *,
    subdir: str,
    filename_hint: Optional[str],
) -> str:
    subdir_clean = subdir.strip().strip("/") or "documents"
    try:
        request = Request(
            url,
            headers={
                "User-Agent": _DOCUMENT_USER_AGENT,
                "Accept": "*/*",
            },
        )
        with closing(urlopen(request, timeout=30)) as response:
            total = 0
            chunks: list[bytes] = []
            while True:
                chunk = response.read(_DOCUMENT_CHUNK_SIZE)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_DOCUMENT_DOWNLOAD_BYTES:
                    raise ValueError("O documento deve ter no máximo 20 MB.")
                chunks.append(chunk)

            if not chunks:
                raise ValueError("O documento enviado está vazio.")

            content = b"".join(chunks)
            content_type = response.headers.get("Content-Type", "")
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Não foi possível baixar o documento.") from exc

    extension = _resolve_document_extension(url, content_type)
    filename = _build_document_filename(url, filename_hint, extension)

    destination_dir = _ensure_subdir(subdir_clean)
    destination_path = destination_dir / filename

    if not destination_path.exists():
        destination_path.write_bytes(content)

    return f"uploads/{subdir_clean}/{filename}"


def _resolve_document_extension(url: str, content_type: str) -> str:
    parsed = urlparse(url)
    extension = Path(parsed.path or "").suffix.lower()
    if extension:
        return extension

    content_main = (content_type or "").split(";", 1)[0].strip().lower()
    guessed = mimetypes.guess_extension(content_main) if content_main else None
    if guessed:
        return guessed.lower()
    return ".bin"


def _build_document_filename(
    url: str,
    filename_hint: Optional[str],
    extension: str,
) -> str:
    ext = extension.lower()
    if not ext.startswith("."):
        ext = f".{ext}"
    if len(ext) > 10 or any(
        not (char.isalnum() or char == ".") for char in ext.replace(".", "", 1)
    ):
        ext = ".bin"

    hint = (filename_hint or "").strip()
    seed = f"{url}|{hint}"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:32]
    return f"{digest}{ext}"
