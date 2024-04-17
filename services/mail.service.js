const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
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
      throw(error);
    } else {
      return("Server is ready to take our messages");
    }
  });

module.exports = { 
    name: 'mail',
    settings: {

    },
    actions: {
        /** 
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
            async handler(ctx) {
                let message = {
                    from: 'ItsEasy777@yandex.ru',
                    to: `${ctx.params.email_address}`,
                    subject: 'Ваш код авторизации',
                    text: `Сегодня настолько крутой день, что твой код - ${ctx.params.code}`,
                }
                
                let info = await smtp.sendMail(message);
                if (info.response.substr(0, 3) == '250') {
                    return `Письмо успешно отправлено на адрес ${ctx.params.email_address}!`
                }
                return `Ошибка отправки письма на адрес ${ctx.params.email_address}!`
            }
        }
    },
    created() {},
    started() {},
    stopped() {}
};