import {expect} from '@wdio/globals';
import {
  launchApp,
  takeScreenshot,
  elementByText,
  elementByResourceId,
} from './helpers';

describe('Payment with card', () => {
  beforeEach(launchApp);

  afterEach(async function () {
    if (this.currentTest?.state === 'failed') {
      await takeScreenshot(this.currentTest.fullTitle().replace(/\s+/g, '_'));
    }
  });

  async function payWithCard(number: string) {
    await elementByText('Card').click();
    await elementByText('Name').setValue('Stripe Test');
    await elementByResourceId('card_number_edit_text').setValue(number);
    const futureYear = (new Date().getFullYear() + 2).toString().slice(-2);
    await elementByResourceId('expiry_date_edit_text').setValue(`12/${futureYear}`);
    await elementByResourceId('cvc_edit_text').setValue('123');
    await elementByResourceId('postal_code_edit_text').setValue('10001');
    await elementByText('PAY').click();
  }

  it('confirms a valid test card', async () => {
    await payWithCard('4242424242424242');
    await expect(elementByText('Success')).toBeDisplayed();
    await elementByText('OK').click();
  });

  it('shows an error for a declined test card', async () => {
    await payWithCard('4000000000000002');
    await expect(elementByText('Error code: Failed')).toBeDisplayed();
    await elementByText('OK').click();
  });
});
