require 'spec_helper'
Stripe.api_base = "http://127.0.0.1:#{ENV.fetch('STRIPE_FIXTURE_PORT')}"

module CheckoutFixture
  def transmit(uri, req, payload, &block)
    if uri.host == 'checkout.stripe.com' && uri.path.start_with?('/c/pay/cs_test_fixture')
      uri = URI("#{Stripe.api_base}#{uri.request_uri}")
    end
    super(uri, req, payload, &block)
  end
end
RestClient::Request.prepend(CheckoutFixture)
RSpec.configure { |config| config.example_status_persistence_file_path = nil }
