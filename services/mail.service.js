const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const e = require('express');
dotenv.config({ path: '/home/molterez/moleculer-demo/process.env' })


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

smtp.transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

module.exports = { 
    name: 'mail',
    settings: {

    },
    actions: {
        /** 
         * @param {object} body
         * 
        */
        sendmail: {
            rest:{
                method: "POST",
                path: "/send"
            },
            params: {
                email_address: "string",
                code: "string"
            },
            async handler(body) {
                let {email_address, code} = body.params
                let message = {
                    from: 'fater45top@yandex.ru',
                    to: `${email_address}`,
                    subject: 'Message from Node js',
                    text: `${code}`,
                }
                let info = await smtp.sendMail(message)
                if (info.response.substr(0, 3) == '250') {
                    return `Письмо успешно отправлено на адрес ${email_address}!`
                }
                return `Ошибка отправки письма на адрес ${email_address}!`
            }
        }
    },
    created() {},
    started() {},
    stopped() {}
};