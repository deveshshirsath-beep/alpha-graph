#!/usr/bin/env python3
"""Serve Atlas V2, proxy Graph QA, and persist planner documents as JSON files."""

from __future__ import annotations

import argparse
import http.client
import json
import os
import re
import shutil
import threading
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional
from urllib.parse import unquote, urlsplit
from uuid import uuid4


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
DATA_ROOT = ROOT / ".planner-data" / "workspaces"
ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")
MAX_BODY_BYTES = 2_000_000
MAX_PROXY_RESPONSE_BYTES = 20_000_000
SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class DocumentNotFound(Exception):
    pass


class InvalidDocument(Exception):
    pass


class PlannerDocumentStore:
    """A small filesystem document store with workspace/project/chat containment."""

    def __init__(self, root: Path):
        self.root = root
        self.lock = threading.RLock()
        self.root.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def clean_id(value: str) -> str:
        if not ID_PATTERN.fullmatch(value):
            raise InvalidDocument("Document id contains unsupported characters")
        return value

    @staticmethod
    def clean_text(value: Any, field: str, limit: int = 160) -> str:
        if not isinstance(value, str) or not value.strip():
            raise InvalidDocument(f"{field} is required")
        normalized = value.strip()
        if len(normalized) > limit:
            raise InvalidDocument(f"{field} must be {limit} characters or fewer")
        return normalized

    @staticmethod
    def read_json(path: Path) -> Dict[str, Any]:
        if not path.is_file():
            raise DocumentNotFound(str(path.name))
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise InvalidDocument(f"Could not read {path.name}: {error}") from error
        if not isinstance(value, dict):
            raise InvalidDocument(f"{path.name} is not a JSON document")
        return value

    @staticmethod
    def write_json(path: Path, value: Mapping[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(path.suffix + ".tmp")
        temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        temporary.replace(path)

    @staticmethod
    def list_documents(paths: Iterable[Path]) -> List[Dict[str, Any]]:
        values: List[Dict[str, Any]] = []
        for path in paths:
            try:
                values.append(PlannerDocumentStore.read_json(path))
            except (DocumentNotFound, InvalidDocument):
                continue
        values.sort(key=lambda item: str(item.get("updatedAt", "")), reverse=True)
        return values

    def workspace_dir(self, workspace_id: str) -> Path:
        return self.root / self.clean_id(workspace_id)

    def project_dir(self, workspace_id: str, project_id: str) -> Path:
        return self.workspace_dir(workspace_id) / "projects" / self.clean_id(project_id)

    def chat_path(self, workspace_id: str, project_id: str, chat_id: str) -> Path:
        return self.project_dir(workspace_id, project_id) / "chats" / f"{self.clean_id(chat_id)}.json"

    def list_workspaces(self) -> List[Dict[str, Any]]:
        with self.lock:
            return self.list_documents(self.root.glob("*/workspace.json"))

    def get_workspace(self, workspace_id: str) -> Dict[str, Any]:
        with self.lock:
            return self.read_json(self.workspace_dir(workspace_id) / "workspace.json")

    def create_workspace(self, payload: Mapping[str, Any]) -> Dict[str, Any]:
        with self.lock:
            identifier = f"workspace-{uuid4()}"
            timestamp = utc_now()
            document = {"id": identifier, "name": self.clean_text(payload.get("name"), "name"), "createdAt": timestamp, "updatedAt": timestamp}
            self.write_json(self.workspace_dir(identifier) / "workspace.json", document)
            return document

    def update_workspace(self, workspace_id: str, payload: Mapping[str, Any]) -> Dict[str, Any]:
        with self.lock:
            path = self.workspace_dir(workspace_id) / "workspace.json"
            document = self.read_json(path)
            if "name" in payload:
                document["name"] = self.clean_text(payload.get("name"), "name")
            document["updatedAt"] = utc_now()
            self.write_json(path, document)
            return document

    def delete_workspace(self, workspace_id: str) -> None:
        with self.lock:
            directory = self.workspace_dir(workspace_id)
            if not directory.joinpath("workspace.json").is_file():
                raise DocumentNotFound(workspace_id)
            shutil.rmtree(directory)

    def list_projects(self, workspace_id: str) -> List[Dict[str, Any]]:
        with self.lock:
            workspace = self.workspace_dir(workspace_id)
            if not workspace.joinpath("workspace.json").is_file():
                raise DocumentNotFound(workspace_id)
            return self.list_documents(workspace.glob("projects/*/project.json"))

    def get_project(self, workspace_id: str, project_id: str) -> Dict[str, Any]:
        with self.lock:
            return self.read_json(self.project_dir(workspace_id, project_id) / "project.json")

    def create_project(self, workspace_id: str, payload: Mapping[str, Any]) -> Dict[str, Any]:
        with self.lock:
            if not self.workspace_dir(workspace_id).joinpath("workspace.json").is_file():
                raise DocumentNotFound(workspace_id)
            identifier = f"project-{uuid4()}"
            timestamp = utc_now()
            document = {"id": identifier, "workspaceId": workspace_id, "name": self.clean_text(payload.get("name"), "name"), "createdAt": timestamp, "updatedAt": timestamp}
            self.write_json(self.project_dir(workspace_id, identifier) / "project.json", document)
            return document

    def update_project(self, workspace_id: str, project_id: str, payload: Mapping[str, Any]) -> Dict[str, Any]:
        with self.lock:
            path = self.project_dir(workspace_id, project_id) / "project.json"
            document = self.read_json(path)
            if "name" in payload:
                document["name"] = self.clean_text(payload.get("name"), "name")
            document["updatedAt"] = utc_now()
            self.write_json(path, document)
            return document

    def delete_project(self, workspace_id: str, project_id: str) -> None:
        with self.lock:
            directory = self.project_dir(workspace_id, project_id)
            if not directory.joinpath("project.json").is_file():
                raise DocumentNotFound(project_id)
            shutil.rmtree(directory)

    def list_chats(self, workspace_id: str, project_id: str) -> List[Dict[str, Any]]:
        with self.lock:
            project = self.project_dir(workspace_id, project_id)
            if not project.joinpath("project.json").is_file():
                raise DocumentNotFound(project_id)
            return self.list_documents(project.glob("chats/*.json"))

    def get_chat(self, workspace_id: str, project_id: str, chat_id: str) -> Dict[str, Any]:
        with self.lock:
            return self.read_json(self.chat_path(workspace_id, project_id, chat_id))

    def create_chat(self, workspace_id: str, project_id: str, payload: Mapping[str, Any]) -> Dict[str, Any]:
        with self.lock:
            if not self.project_dir(workspace_id, project_id).joinpath("project.json").is_file():
                raise DocumentNotFound(project_id)
            identifier = f"chat-{uuid4()}"
            timestamp = utc_now()
            messages = payload.get("messages", [])
            if not isinstance(messages, list):
                raise InvalidDocument("messages must be a JSON array")
            document = {
                "id": identifier,
                "workspaceId": workspace_id,
                "projectId": project_id,
                "title": self.clean_text(payload.get("title") or "New graph chat", "title"),
                "graphId": str(payload.get("graphId") or "")[:128],
                "messages": messages,
                "createdAt": timestamp,
                "updatedAt": timestamp,
            }
            self.write_json(self.chat_path(workspace_id, project_id, identifier), document)
            return document

    def update_chat(self, workspace_id: str, project_id: str, chat_id: str, payload: Mapping[str, Any]) -> Dict[str, Any]:
        with self.lock:
            path = self.chat_path(workspace_id, project_id, chat_id)
            document = self.read_json(path)
            if "title" in payload:
                document["title"] = self.clean_text(payload.get("title"), "title")
            if "graphId" in payload:
                document["graphId"] = str(payload.get("graphId") or "")[:128]
            if "messages" in payload:
                if not isinstance(payload.get("messages"), list):
                    raise InvalidDocument("messages must be a JSON array")
                document["messages"] = payload["messages"]
            document["updatedAt"] = utc_now()
            self.write_json(path, document)
            return document

    def delete_chat(self, workspace_id: str, project_id: str, chat_id: str) -> None:
        with self.lock:
            path = self.chat_path(workspace_id, project_id, chat_id)
            if not path.is_file():
                raise DocumentNotFound(chat_id)
            path.unlink()


class GraphStudioHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def end_headers(self):
        for name, value in SECURITY_HEADERS.items():
            self.send_header(name, value)
        super().end_headers()

    def allowed_origin(self) -> bool:
        origin = self.headers.get("Origin")
        if not origin:
            return True
        parsed = urlsplit(origin)
        return parsed.scheme in {"http", "https"} and parsed.netloc == self.headers.get("Host")

    def do_GET(self):
        if self.path.startswith(("/v1/", "/health/")):
            self.proxy_request()
            return
        if self.path.startswith("/app-api/"):
            self.handle_document_api()
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith("/v1/"):
            self.proxy_request()
            return
        if self.path.startswith("/app-api/"):
            self.handle_document_api()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_PATCH(self):
        if self.path.startswith("/app-api/"):
            self.handle_document_api()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        if self.path.startswith("/app-api/"):
            self.handle_document_api()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_OPTIONS(self):
        if self.path.startswith(("/v1/", "/app-api/")):
            self.send_response(HTTPStatus.NO_CONTENT)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def read_body(self) -> Dict[str, Any]:
        try:
            length = int(self.headers.get("content-length", "0"))
        except ValueError as error:
            raise InvalidDocument("Invalid Content-Length") from error
        if length < 0 or length > MAX_BODY_BYTES or self.headers.get("transfer-encoding"):
            self.close_connection = True
            raise InvalidDocument("A valid bounded Content-Length is required")
        if not length:
            return {}
        try:
            value = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise InvalidDocument("Request body must be valid JSON") from error
        if not isinstance(value, dict):
            raise InvalidDocument("Request body must be a JSON object")
        return value

    def send_json(self, status: int, value: Optional[Mapping[str, Any]] = None) -> None:
        payload = b"" if value is None else json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if payload:
            self.wfile.write(payload)

    def handle_document_api(self) -> None:
        if not self.allowed_origin():
            self.close_connection = True
            self.send_json(HTTPStatus.FORBIDDEN, {"error": "origin_rejected", "message": "Cross-origin document access is not allowed."})
            return
        parts = [unquote(part) for part in urlsplit(self.path).path.split("/") if part]
        try:
            if parts[:2] != ["app-api", "workspaces"]:
                raise DocumentNotFound("route")
            store = self.server.document_store
            payload = self.read_body() if self.command in {"POST", "PATCH"} else {}
            tail = parts[2:]

            if not tail:
                if self.command == "GET":
                    self.send_json(HTTPStatus.OK, {"items": store.list_workspaces()})
                elif self.command == "POST":
                    self.send_json(HTTPStatus.CREATED, store.create_workspace(payload))
                else:
                    self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "method_not_allowed"})
                return

            workspace_id = tail[0]
            if len(tail) == 1:
                if self.command == "GET":
                    self.send_json(HTTPStatus.OK, store.get_workspace(workspace_id))
                elif self.command == "PATCH":
                    self.send_json(HTTPStatus.OK, store.update_workspace(workspace_id, payload))
                elif self.command == "DELETE":
                    store.delete_workspace(workspace_id)
                    self.send_json(HTTPStatus.NO_CONTENT)
                else:
                    self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "method_not_allowed"})
                return

            if tail[1] != "projects":
                raise DocumentNotFound("route")
            if len(tail) == 2:
                if self.command == "GET":
                    self.send_json(HTTPStatus.OK, {"items": store.list_projects(workspace_id)})
                elif self.command == "POST":
                    self.send_json(HTTPStatus.CREATED, store.create_project(workspace_id, payload))
                else:
                    self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "method_not_allowed"})
                return

            project_id = tail[2]
            if len(tail) == 3:
                if self.command == "GET":
                    self.send_json(HTTPStatus.OK, store.get_project(workspace_id, project_id))
                elif self.command == "PATCH":
                    self.send_json(HTTPStatus.OK, store.update_project(workspace_id, project_id, payload))
                elif self.command == "DELETE":
                    store.delete_project(workspace_id, project_id)
                    self.send_json(HTTPStatus.NO_CONTENT)
                else:
                    self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "method_not_allowed"})
                return

            if tail[3] != "chats":
                raise DocumentNotFound("route")
            if len(tail) == 4:
                if self.command == "GET":
                    self.send_json(HTTPStatus.OK, {"items": store.list_chats(workspace_id, project_id)})
                elif self.command == "POST":
                    self.send_json(HTTPStatus.CREATED, store.create_chat(workspace_id, project_id, payload))
                else:
                    self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "method_not_allowed"})
                return

            chat_id = tail[4]
            if len(tail) == 5 and self.command == "GET":
                self.send_json(HTTPStatus.OK, store.get_chat(workspace_id, project_id, chat_id))
            elif len(tail) == 5 and self.command == "PATCH":
                self.send_json(HTTPStatus.OK, store.update_chat(workspace_id, project_id, chat_id, payload))
            elif len(tail) == 5 and self.command == "DELETE":
                store.delete_chat(workspace_id, project_id, chat_id)
                self.send_json(HTTPStatus.NO_CONTENT)
            else:
                self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "method_not_allowed"})
        except DocumentNotFound:
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "document_not_found"})
        except InvalidDocument as error:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_document", "message": str(error)})
        except OSError as error:
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "storage_error", "message": str(error)})

    def proxy_request(self):
        route = unquote(urlsplit(self.path).path)
        allowed_route = (
            self.command == "GET" and re.fullmatch(r"/(?:health/(?:live|ready)|v1/(?:graphs(?:/[A-Za-z0-9][A-Za-z0-9._-]{0,127})?|ontology|tool-schema|tools))", route)
        ) or (self.command == "POST" and route in {"/v1/answer", "/v1/plan", "/v1/query", "/v1/entities/resolve"})
        if not self.allowed_origin() or not allowed_route:
            self.close_connection = True
            self.send_json(HTTPStatus.FORBIDDEN, {"error": "proxy_route_forbidden", "message": "This UI proxy permits same-origin query access only, not snapshot administration."})
            return
        target = urlsplit(self.server.api_url)
        try:
            body_length = int(self.headers.get("content-length", "0"))
            if body_length < 0 or body_length > MAX_BODY_BYTES or self.headers.get("transfer-encoding"):
                raise ValueError()
        except ValueError:
            self.close_connection = True
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_body", "message": "A valid bounded Content-Length is required."})
            return
        body = self.rfile.read(body_length) if body_length else None
        headers = {key: value for key, value in self.headers.items() if key.lower() in {"authorization", "content-type", "accept"}}
        token = getattr(self.server, "api_token", "")
        if token:
            headers = {key: value for key, value in headers.items() if key.lower() != "authorization"}
            headers["Authorization"] = f"Bearer {token}"
        connection_class = http.client.HTTPSConnection if target.scheme == "https" else http.client.HTTPConnection
        connection = connection_class(target.hostname, target.port, timeout=180)
        try:
            connection.request(self.command, target.path.rstrip("/") + self.path, body=body, headers=headers)
            response = connection.getresponse()
            payload = response.read(MAX_PROXY_RESPONSE_BYTES + 1)
            if len(payload) > MAX_PROXY_RESPONSE_BYTES:
                self.send_json(HTTPStatus.BAD_GATEWAY, {"error": "response_too_large", "message": "The planner response exceeded the proxy limit. Narrow the question."})
                return
            self.send_response(response.status)
            self.send_header("Content-Type", response.getheader("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            for name in ("Retry-After", "WWW-Authenticate", "X-Request-ID"):
                value = response.getheader(name)
                if value:
                    self.send_header(name, value)
            self.end_headers()
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True
        except TimeoutError:
            self.send_json(HTTPStatus.GATEWAY_TIMEOUT, {"error": "planner_timeout", "message": "The planner exceeded the request timeout."})
        except (OSError, http.client.HTTPException):
            self.send_json(HTTPStatus.BAD_GATEWAY, {"error": "planner_unavailable", "message": "The configured planner API is unavailable."})
        finally:
            connection.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve Atlas V2 with Graph Query Planner APIs.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=4173, type=int)
    parser.add_argument("--api-url", default=os.environ.get("GRAPH_QA_API_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--data-dir", default=os.environ.get("GRAPH_STUDIO_DATA_DIR", str(DATA_ROOT)))
    args = parser.parse_args()
    target = urlsplit(args.api_url)
    if target.scheme not in {"http", "https"} or not target.hostname or target.username or target.password or target.query or target.fragment:
        raise SystemExit("GRAPH_QA_API_URL must be an HTTP(S) base URL without credentials, query or fragment")

    if not DIST.joinpath("index.html").is_file():
        raise SystemExit("dist/index.html is missing; run the frontend build first")
    server = ThreadingHTTPServer((args.host, args.port), GraphStudioHandler)
    server.api_url = args.api_url.rstrip("/")
    server.api_token = os.environ.get("GRAPH_QA_BEARER_TOKEN", "")
    server.document_store = PlannerDocumentStore(Path(args.data_dir).resolve())
    print(f"Atlas Graph Studio: http://{args.host}:{args.port}")
    print(f"Graph QA proxy: {server.api_url}")
    print(f"Planner JSON documents: {Path(args.data_dir).resolve()}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
