import {mkdir} from 'node:fs/promises';
import {$, browser} from '@wdio/globals';

const expoGo = 'host.exp.exponent';

export async function launchApp() {
  await browser.terminateApp(expoGo);
  await browser.execute('mobile: deepLink', {
    url: 'exp://127.0.0.1:8081',
    package: expoGo,
  });

  const dismiss = elementByText('Got it');
  if (await dismiss.waitForDisplayed({timeout: 5000}).catch(() => false)) {
    await dismiss.click();
  }
}

export async function takeScreenshot(name: string) {
  await mkdir('tmp/screenshots', {recursive: true});
  await browser.saveScreenshot(`tmp/screenshots/${name}.png`);
}

export function elementByText(text: string) {
  return $(`android=new UiSelector().text("${text}")`);
}

export function elementByResourceId(id: string) {
  return $(`android=new UiSelector().resourceIdMatches(".*${id}")`);
}
