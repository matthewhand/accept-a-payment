import os
import sys

import stripe

host = "127.0.0.1"
api_base = f"http://{host}:{os.environ['STRIPE_FIXTURE_PORT']}"
stripe.api_base = api_base

initialize = stripe.StripeClient.__init__
def fixture_initialize(client, *args, **kwargs):
    initialize(client, *args, base_addresses={"api": api_base}, **kwargs)
stripe.StripeClient.__init__ = fixture_initialize
sys.path.insert(0, os.getcwd())

from server import app
app.run(host=host, port=int(os.environ["APP_FIXTURE_PORT"]))
