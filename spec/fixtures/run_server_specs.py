import argparse
import os
from pathlib import Path
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request

from http.server import ThreadingHTTPServer

from stripe_api import Fixtures


FIXTURES = Path(__file__).resolve().parent
REPO = FIXTURES.parents[1]
SPECS = {
    "custom-payment-flow": "custom_payment_flow_server_spec.rb",
    "elements-with-checkout-sessions": "elements_with_checkout_sessions_server_spec.rb",
    "payment-element": "payment_element_server_spec.rb",
    "prebuilt-checkout-page": "prebuilt_checkout_page_spec.rb",
}


def free_port():
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


def wait_for_server(server, url):
    for _ in range(40):
        if server.poll() is not None:
            raise RuntimeError(f"Sample server exited with status {server.returncode}")
        try:
            with urllib.request.urlopen(url, timeout=0.5):
                return
        except (urllib.error.URLError, TimeoutError):
            time.sleep(0.25)
    raise RuntimeError(f"Sample server did not start at {url}")


def run_sample(language, sample, fixture_port):
    app_port = free_port()
    domain = f"http://127.0.0.1:{app_port}"
    env = {
        **os.environ,
        "APP_FIXTURE_PORT": str(app_port),
        "DOMAIN": domain,
        "PAYMENT_METHOD_TYPES": "card",
        "PRICE": "price_local_fixture",
        "SERVER_URL": domain,
        "STATIC_DIR": "../../client/html",
        "STRIPE_FIXTURE_PORT": str(fixture_port),
        "STRIPE_PUBLISHABLE_KEY": "pk_test_local_fixture",
        "STRIPE_SECRET_KEY": "sk_test_local_fixture",
        "STRIPE_WEBHOOK_SECRET": "whsec_local_fixture",
    }

    if language == "node":
        command = ["node", "--require", str(FIXTURES / "start_node.cjs"), "server.js"]
    else:
        command = [sys.executable, str(FIXTURES / "start_python.py")]

    with subprocess.Popen(command, cwd=REPO / sample / "server" / language, env=env) as server:
        try:
            wait_for_server(server, domain)
            subprocess.run(
                ["bundle", "exec", "rspec", "-r",
                 "./spec/fixtures/stripe_test_helper.rb", f"spec/{SPECS[sample]}"],
                cwd=REPO,
                env=env,
                check=True,
            )
        finally:
            server.terminate()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run an existing payment API spec with a local Stripe fixture.")
    parser.add_argument("language", choices=("node", "python"))
    parser.add_argument("sample", choices=SPECS)
    arguments = parser.parse_args()
    with ThreadingHTTPServer(("127.0.0.1", 0), Fixtures) as fixture:
        fixture_thread = threading.Thread(target=fixture.serve_forever, daemon=True)
        fixture_thread.start()
        try:
            run_sample(arguments.language, arguments.sample, fixture.server_port)
        finally:
            fixture.shutdown()
