const Module = require("node:module");
const net = require("node:net");

const load = Module._load;
Module._load = function (name, ...args) {
  const result = load.call(this, name, ...args);
  if (name !== "stripe") return result;
  return new Proxy(result, {
    apply(target, receiver, [key, config]) {
      return Reflect.apply(target, receiver, [key, stripeConfig(config)]);
    },
    construct(target, [key, config], constructor) {
      return Reflect.construct(target, [key, stripeConfig(config)], constructor);
    },
  });
};

function stripeConfig(config) {
  return {
    ...config,
    host: "127.0.0.1",
    port: Number(process.env.STRIPE_FIXTURE_PORT),
    protocol: "http",
  };
}

const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (_port, callback) {
  return listen.call(this, Number(process.env.APP_FIXTURE_PORT), "127.0.0.1", callback);
};
