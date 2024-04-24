const ApiErrors = require("./response.service.js");
const {Context} = require("moleculer");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const { methods } = require("./api.service.js");
const nodemailer = require('nodemailer');
dotenv.config({ path: '/home/molterez/moleculer-demo/process.env' })

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: 'notification_service_database',
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

const smtp = nodemailer.createTransport({
    // pool: true ,
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_SMTP_ADDRESS,
        pass: process.env.EMAIL_SMTP_PASSWORD
    }
}); 


module.exports = {
    name: "notification",
    settings: {},
    validator: true,
    actions: {
    /**
     * Get all users
     */
        getNotofications: {
            rest: {
                method: "GET",
                path: "/notification"
            },
            // params: {
            //     name: "string"
            // },
            async handler(){

                let notifications;
                try{
                    notifications = await pool.query("SELECT category_id, type_id, title, description FROM notification");

                    console.log(notifications);
                }catch(e){
                    console.log(e);
                    throw new Error(e);
                }

                return {
                    count: notifications.rowCount,
                    data: notifications.rows
                }
                
            }
        },

        /**
         * Метод для добавления нового уведомления
         * @param {string} email_address
         * @param {string} password
         * 
         * @return {object} result
         */ 
        addUser: {
            rest: {
                method: "POST",
                path: "/notification"
            },
            params: {
                category_id: "number",
                type_id: "number",
                title: "string",
                description: "string"
            },
            async handler(body){

                return this.sendEmail("bulat2020205@gmail.com", "Hello world");
                
            }
        },

        /**
         * Метод для добавления нового уведомления
         * @param {string} email_address
         * @param {string} password
         * 
         * @return {object} result
         */ 
        sendNotificationEmal: {
            rest: {
                method: "POST",
                path: "/notifyEmail"
            },
            params: {
                receiver: "string",
                message: "string"
            },
            async handler(body){

                const { receiver, message } = body.params;

                let options = {
                    from: 'NRnomore@yandex.ru',
                    to: receiver,
                    subject: 'ural',
                    html: `<p>${message}</p>`,
                };
    
                smtp.sendMail(options)
                    .then(res => {
                        return `Сообщение от ${receiver}: ${message}`;
                    })
                    .catch(err => {
                        return "Ошибка отправки: " + err;
                    })
                
            }
        },

        /**
         * Метод для добавления нового уведомления
         * @param {string} email_address
         * @param {string} password
         * 
         * @return {object} result
         */ 
        sendNotificationSMS: {
            rest: {
                method: "POST",
                path: "/notifySMS"
            },
            params: {
                receiver: "string",
                message: "string"
            },
            async handler(body){

                await megafon.sms({ to: parseInt(body.params.receiver), message: body.params.message });
                
            }
        },

    },

    methods: {
        /**
         * Метод для сохранения нового уведомления
         * @param {string} email_address
         * @param {string} password
         * 
         * @return {object} result
         */ 
        async saveNotification(){
            const { category_id, type_id, title, description } = body.params;

            let notificationId;

            try{
                notificationId = await pool.query("INSERT INTO notification (category_id, type_id, title, description, section_link_id)\
                                                    VALUES ($1, $2, $3, $4, $5) RETURNING id", [category_id, type_id, title, description, 1]);

            }catch(e){
                console.log(e);
                throw new Error(e);
            }

            return {
                id: notificationId.rows[0].id
            }
        },

        async sendEmaill(receiver, body){

            let message = {
                from: 'NRnomore@yandex.ru',
                to: receiver,
                subject: 'ural',
                html: `<p>Hello world</p>`,
            };

            console.log(message)

            await smtp.sendMail(message);
            
        }

    },

    created() {},
    started() {},
    stopped() {}
};