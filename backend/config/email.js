const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmail = async ({ to, subject, html }) => {
  try {
    const { error } = await resend.emails.send({
      from: 'PlaceRise <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
    if (error) {
      console.error('Email send failed:', error.message)
    } else {
      console.log('Email sent to:', to)
    }
  } catch (err) {
    console.error('Email send failed:', err.message)
  }
}

module.exports = { sendEmail }