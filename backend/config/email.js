const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'PlaceRise', email: 'placerise.notifications@gmail.com' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Email send failed:', err.message)
    } else {
      console.log('Email sent to:', to)
    }
  } catch (error) {
    console.error('Email send failed:', error.message)
  }
}

module.exports = { sendEmail }