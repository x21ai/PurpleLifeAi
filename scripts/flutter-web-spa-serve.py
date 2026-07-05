#!/usr/bin/env python3
"""Serve Flutter web build with SPA fallback for GoRouter path URLs."""

from __future__ import annotations

import argparse
import http.server
import os
import sys
from pathlib import Path


class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self) -> None:
        requested = Path(self.translate_path(self.path))
        if requested.is_file():
            return super().do_GET()
        self.path = "/index.html"
        return super().do_GET()

    def log_message(self, format: str, *args) -> None:
        sys.stderr.write("[flutter-web-serve] %s - %s\n" % (self.address_string(), format % args))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port", type=int)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--bind", default="0.0.0.0")
    args = parser.parse_args()

    os.chdir(args.directory)
    server = http.server.ThreadingHTTPServer(
        (args.bind, args.port),
        lambda *handler_args, **handler_kwargs: SpaHandler(
            *handler_args, directory=str(args.directory), **handler_kwargs
        ),
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
