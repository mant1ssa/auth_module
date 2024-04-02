const nodemailer = require('nodemailer');


// ************* Logging ************** //

// const timestamp = () => '[' + (new Date()).toLocaleString('ru-RU') + ']';
 
const smtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_SMTP_ADDRESS,
        pass: process.env.EMAIL_SMTP_PASSWORD
    }
});


const sendMail = async (options) => {
    let result;
    try {
        result = await smtp.sendMail(options)
    } catch (e) {
        console.log("send mail error: ", e)
    }
}


module.exports = { 
    name : 'mail',
    sendMail 
};