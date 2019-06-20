
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service : 'gmail',
    auth: {
      user: '467Kudos@gmail.com',
      pass: 'KudosTest'  
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  module.exports = transporter;