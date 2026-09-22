"""Proxy boundary tests with an in-memory upstream; no network or real tokens."""
import io
import unittest
from email.message import Message
from types import SimpleNamespace
from unittest.mock import Mock, patch

import serve


class ProxyTests(unittest.TestCase):
    def handler(self, path="/v1/answer", method="POST", headers=None, body=b"{}"):
        handler = object.__new__(serve.GraphStudioHandler)
        handler.server = SimpleNamespace(api_url="http://127.0.0.1:8000/api", api_token="test-only-secret")
        handler.command, handler.path = method, path
        handler.headers = Message()
        for key, value in {"Host": "127.0.0.1:4173", "Content-Length": str(len(body)), **(headers or {})}.items():
            handler.headers[key] = value
        handler.rfile, handler.wfile = io.BytesIO(body), io.BytesIO()
        handler.send_response, handler.send_header, handler.end_headers = Mock(), Mock(), Mock()
        handler.close_connection = False
        return handler

    def upstream(self, status=200, payload=b'{"status":"answered"}', headers=None):
        response = Mock(status=status)
        response.read.return_value = payload
        values = headers or {}
        response.getheader.side_effect = lambda name, default=None: values.get(name, default)
        connection = Mock()
        connection.getresponse.return_value = response
        return connection

    def test_auth_is_server_side_and_diagnostic_headers_survive(self):
        handler = self.handler(headers={"Authorization": "Bearer ignored", "Cookie": "private"})
        connection = self.upstream(429, b'{"detail":"rate limited"}', {"Retry-After": "5", "X-Request-ID": "request-test"})
        with patch("serve.http.client.HTTPConnection", return_value=connection):
            handler.proxy_request()
        args, kwargs = connection.request.call_args
        self.assertEqual(args, ("POST", "/api/v1/answer"))
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-only-secret")
        self.assertNotIn("Cookie", kwargs["headers"])
        handler.send_response.assert_called_once_with(429)
        handler.send_header.assert_any_call("Cache-Control", "no-store")
        handler.send_header.assert_any_call("Retry-After", "5")
        handler.send_header.assert_any_call("X-Request-ID", "request-test")
        connection.close.assert_called_once()

    def test_forbidden_routes_and_origins_never_reach_upstream(self):
        for path, method, headers in [
            ("/v1/admin/reload", "POST", {}), ("/v1/graphs", "POST", {}),
            ("/v1/graphs", "GET", {"Origin": "https://other.example"}),
            ("/v1/graphs/%2e%2e/admin", "GET", {}),
        ]:
            with self.subTest(path=path, method=method, headers=headers):
                handler = self.handler(path, method, headers)
                with patch("serve.http.client.HTTPConnection") as connection:
                    handler.proxy_request()
                connection.assert_not_called()
                handler.send_response.assert_called_once_with(403)
                self.assertTrue(handler.close_connection)

    def test_body_framing_is_bounded_and_connection_closed(self):
        for headers in [{"Content-Length": "-1"}, {"Content-Length": "oops"}, {"Content-Length": "2000001"}, {"Transfer-Encoding": "chunked"}]:
            with self.subTest(headers=headers):
                handler = self.handler(headers=headers)
                with patch("serve.http.client.HTTPConnection") as connection:
                    handler.proxy_request()
                connection.assert_not_called()
                handler.send_response.assert_called_once_with(400)
                self.assertTrue(handler.close_connection)

    def test_network_errors_are_sanitized_and_timeouts_are_distinct(self):
        for error, status in [(TimeoutError("private hostname"), 504), (OSError("private credential"), 502)]:
            with self.subTest(status=status):
                handler, connection = self.handler(), self.upstream()
                connection.request.side_effect = error
                with patch("serve.http.client.HTTPConnection", return_value=connection):
                    handler.proxy_request()
                handler.send_response.assert_called_once_with(status)
                self.assertNotIn(b"private", handler.wfile.getvalue())
                connection.close.assert_called_once()

    def test_oversized_response_is_rejected(self):
        handler, connection = self.handler(), self.upstream(payload=b"12345")
        with patch("serve.MAX_PROXY_RESPONSE_BYTES", 4), patch("serve.http.client.HTTPConnection", return_value=connection):
            handler.proxy_request()
        handler.send_response.assert_called_once_with(502)
        connection.getresponse().read.assert_called_once_with(5)
        connection.close.assert_called_once()

    def test_documents_reject_cross_origin_and_bad_framing(self):
        handler = self.handler("/app-api/workspaces", headers={"Origin": "https://other.example"})
        handler.handle_document_api()
        handler.send_response.assert_called_once_with(403)
        for length in ["-1", "2000001"]:
            with self.assertRaises(serve.InvalidDocument):
                self.handler(headers={"Content-Length": length}).read_body()

    def test_security_headers_do_not_advertise_wildcard_cors(self):
        handler = self.handler()
        with patch("http.server.SimpleHTTPRequestHandler.end_headers"):
            serve.GraphStudioHandler.end_headers(handler)
        for key, value in serve.SECURITY_HEADERS.items():
            handler.send_header.assert_any_call(key, value)
        self.assertFalse(any(call.args[0] == "Access-Control-Allow-Origin" for call in handler.send_header.call_args_list))


if __name__ == "__main__":
    unittest.main()
