const SibApiV3Sdk = require('@getbrevo/brevo')

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY

const sendEmail = async ({ to, subject, html }) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    sendSmtpEmail.subject = subject
    sendSmtpEmail.htmlContent = html
    sendSmtpEmail.sender = { name: 'PlaceRise', email: 'placerise.notifications@gmail.com' }
    sendSmtpEmail.to = [{ email: to }]

    await apiInstance.sendTransacEmail(sendSmtpEmail)
    console.log('Email sent to:', to)
  } catch (error) {
    console.error('Email send failed:', error.message)
  }
}

module.exports = { sendEmail }