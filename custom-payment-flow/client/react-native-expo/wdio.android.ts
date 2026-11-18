export const config: WebdriverIO.Config = {
  specs: ['./e2e/*.spec.ts'],
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Android Emulator',
      'appium:appPackage': 'host.exp.exponent',
      'appium:appActivity': '.experience.HomeActivity',
      'appium:autoLaunch': false,
      'appium:noReset': true,
      'appium:newCommandTimeout': 180,
    },
  ],
  logLevel: 'warn',
  services: [['appium', {args: {address: '127.0.0.1'}}]],
  framework: 'mocha',
  reporters: ['spec'],
  waitforTimeout: 30000,
  mochaOpts: {timeout: 90000},
};
