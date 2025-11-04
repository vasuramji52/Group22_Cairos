// backend/tests/mail.test.js
jest.mock('@sendgrid/mail'); // hoisted mock

describe('mail.js', () => {
  let sgMail; // re-bound per test
  let mail;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Re-require the mock AFTER reset so we share the same instance as mail.js
    sgMail = require('@sendgrid/mail');
    // You can re-stub setApiKey if you want to assert on it; not required
    sgMail.setApiKey = jest.fn();
  });

  it('throws error if SENDGRID_FROM is not set', async () => {
    process.env.SENDGRID_API_KEY = 'fakekey';
    process.env.SENDGRID_FROM = ''; // missing

    // Now require the module so it captures env at load
    mail = require('../mail');

    await expect(
      mail.sendMail({ to: 'a@b.com', subject: 'sub', html: '<b>hi</b>' })
    ).rejects.toThrow('SENDGRID_FROM not set in .env');
  });

  it('calls sgMail.send with correct params and returns response', async () => {
    const resp = [{ statusCode: 202 }];
    process.env.SENDGRID_API_KEY = 'fakekey';
    process.env.SENDGRID_FROM = 'test@example.com';

    // Configure the SAME sgMail instance that mail.js will use
    sgMail.send.mockResolvedValue(resp);

    // Require mail.js AFTER env + mocks are ready
    mail = require('../mail');

    const result = await mail.sendMail({
      to: 'a@b.com',
      subject: 'sub',
      html: '<b>hi</b>'
    });

    expect(sgMail.send).toHaveBeenCalledWith({
      to: 'a@b.com',
      from: 'test@example.com',
      subject: 'sub',
      html: '<b>hi</b>'
    });
    expect(result).toBe(resp);
  });

  it('logs success message after sending', async () => {
    const resp = [{ statusCode: 202 }];
    process.env.SENDGRID_API_KEY = 'fakekey';
    process.env.SENDGRID_FROM = 'test@example.com';

    sgMail.send.mockResolvedValue(resp);
    mail = require('../mail');

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await mail.sendMail({ to: 'a@b.com', subject: 'sub', html: '<b>hi</b>' });
    expect(logSpy).toHaveBeenCalledWith('✅ Sent email to a@b.com');
    logSpy.mockRestore();
  });
});
