const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('🔧 Testing Gmail SMTP configuration...');

  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: parseInt(process.env.BREVO_SMTP_PORT),
    secure: process.env.BREVO_SMTP_PORT === '465',
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });

  console.log('📧 Configuration:', {
    host: process.env.BREVO_SMTP_HOST,
    port: process.env.BREVO_SMTP_PORT,
    secure: process.env.BREVO_SMTP_PORT === '465',
    user: process.env.BREVO_SMTP_USER,
    passLength: process.env.BREVO_SMTP_PASS?.length || 0,
  });

  try {
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    console.log('📤 Sending test email...');
    const result = await transporter.sendMail({
      from: process.env.BREVO_FROM_EMAIL,
      to: 'hey@kanishkumar.in',
      subject: 'Test Email from Gmail SMTP',
      text: 'This is a test email to verify Gmail SMTP configuration.',
      html: '<p>This is a <strong>test email</strong> to verify Gmail SMTP configuration.</p>',
    });

    console.log('✅ Test email sent successfully:', {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });

  } catch (error) {
    console.log('❌ SMTP test failed:', {
      error: error.message,
      code: error.code,
      command: error.command,
    });
  }
}

testEmail().then(() => process.exit(0)).catch(e => {
  console.error('Script error:', e);
  process.exit(1);
});