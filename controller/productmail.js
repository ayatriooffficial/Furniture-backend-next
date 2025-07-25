const nodemailer = require('nodemailer');

// Controller function to send purchase confirmation email
exports.sendPurchaseConfirmation = async (req, res) => {
  try {
    // const { userEmail, productName } = req.body;

    // Create a Nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ayatrio.official@gmail.com', // Your Gmail email address
        pass: process.env.SEND_EMAIL_APP_PASS
      }
    });
    let message = `
    Dear Customer,
    
    Thank you for purchasing Curtains ! We truly appreciate your business and hope you enjoy your purchase.
    
    If you have any questions or need further assistance, please don't hesitate to contact us.
    
    Regards,
    \nThe Ayatrio Team
  `;

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: 'ayatrio.official@gmail.com', // Sender address
      to: 'hussainashraf202324@gmail.com', 
      subject: 'Purchase Confirmation', // Subject line
      text: message // Plain text body
    });

    // console.log('Message sent: %s', info.messageId);
    res.status(200).send('Purchase confirmation email sent successfully!');
  } catch (error) {
    console.error('Error occurred while sending email:', error);
    res.status(500).send('Error occurred while sending email');
  }
};
