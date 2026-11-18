import itertools
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlsplit

records = {}
ids = itertools.count(1)

class Fixtures(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/health" or path.startswith("/c/pay/cs_test_fixture"):
            self.reply(200, {"fixture": True})
            return
        key = path.rsplit("/", 1)[-1]
        if path.startswith(("/v1/checkout/sessions/", "/v1/payment_intents/")) and key in records:
            self.reply(200, records[key])
        else:
            self.error(404, f"Fixture does not exist for {path}")

    def do_POST(self):
        if self.headers.get("Authorization") != "Bearer sk_test_local_fixture":
            self.error(401, "A synthetic credential is required")
            return
        values = parse_qs(self.rfile.read(int(self.headers.get("Content-Length", 0))).decode())
        if self.path == "/v1/payment_intents":
            self.payment_intent(values)
        elif self.path == "/v1/checkout/sessions":
            self.checkout_session(values)
        else:
            self.error(404, f"Unsupported fixture route {self.path}")

    def payment_intent(self, values):
        if values.get("confirm") == ["true"] or "payment_method" in values:
            self.error(400, "This fixture only models unconfirmed intents")
            return
        methods = [value[0] for key, value in sorted(values.items())
                   if key.startswith("payment_method_types[")]
        if not methods and values.get("automatic_payment_methods[enabled]") == ["true"]:
            methods = ["card"]
        if methods == ["au_becs_debit"] and values.get("currency", [""])[0].lower() == "usd":
            self.error(400, "This payment method is available to Stripe accounts in AU")
            return
        if not methods or "currency" not in values or "amount" not in values:
            self.error(400, "Missing payment intent data")
            return
        prefix = "payment_method_options[acss_debit][mandate_options]"
        options = {name: values[f"{prefix}[{name}]"][0]
                   for name in ("payment_schedule", "transaction_type")
                   if f"{prefix}[{name}]" in values}
        key = f"pi_fixture{next(ids)}"
        self.save(key, "payment_intent", {
            "currency": values["currency"][0].lower(),
            "amount": int(values["amount"][0]),
            "payment_method_types": methods,
            "payment_method_options": {"acss_debit": {"mandate_options": options}},
            "status": "requires_payment_method",
        })

    def checkout_session(self, values):
        key = f"cs_test_fixture{next(ids)}"
        items = [int(value[0]) for name, value in values.items()
                 if name.startswith("line_items[") and name.endswith("[quantity]")]
        methods = [value[0] for name, value in values.items()
                   if name.startswith("payment_method_types[")]
        if "mode" not in values or not items:
            self.error(400, "Missing checkout mode or line items")
            return
        self.save(key, "checkout.session", {
            "mode": values["mode"][0],
            "line_items": {"object": "list", "data": [
                {"id": f"li_fixture{i}", "object": "item", "quantity": quantity}
                for i, quantity in enumerate(items)
            ]},
            "payment_method_types": methods or ["card"],
            "customer_email": values.get("customer_email", [None])[0],
            "adaptive_pricing": {"enabled": values.get("adaptive_pricing[enabled]") == ["true"]},
            "url": f"https://checkout.stripe.com/c/pay/{key}#fixture",
            "status": "open",
            "payment_status": "unpaid",
            "payment_intent": None,
        })

    def save(self, key, kind, fields):
        record = {"id": key, "object": kind, "client_secret": f"{key}_secret_fixture", **fields}
        records[key] = record
        self.reply(200, record)

    def error(self, status, message):
        self.reply(status, {"error": {"type": "invalid_request_error", "message": message}})

    def reply(self, status, response):
        body = json.dumps(response).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Request-Id", "req_local_fixture")
        self.end_headers()
        self.wfile.write(body)
