const dotenv = require("dotenv");
const { pool } = require("../mixins/db.mixin");
const { createAndBindToken, getTokenData, generateToken } = require("./token.service");
const bcrypt = require("bcrypt");
const { response } = require("express");
const redis = require('../redis/index.js')
const { sendMail } = require('./mail.service.js')
const verificationModule = require("../verification");
const emailSend = require("../verification/adapters/methods");
const ApiErrors = require("./response.service.js");
dotenv.config();

module.exports = {
    name: "users",
    settings: {
        rest: true
    },

    actions: {
    /**
     * Отправка кода из СМС/Почты
     * @param {object}  - данные запроса, тело и строка
     */
    sendmail: {
        rest: {
            path: "/sendmail"
        },
        params: {
            email: "string",
            phone_number: "string"
        },
        async handler(body, res){

            let userId;
            const { login, code } = body;

            try {
                userId = await pool.query('SELECT user_id FROM users WHERE email_address = $1', [login]);
            } catch (e) {
                console.log(e)
            }

            // Приставки к ключам
            let redisPasswordRecoverKey = "yurta:recover_password:";
            let userVerifyCodeKey = "Yurta:user:";

            userVerifyCodeKey = userVerifyCodeKey + userId.rows[0].user_id;
            const userVerifyCode = await redis.get(userVerifyCodeKey);

            redisPasswordRecoverKey = redisPasswordRecoverKey + userId.rows[0].user_id;
            const redisPasswordRecoverCode = await redis.get(redisPasswordRecoverKey);


            if(userVerifyCode){
                if(code == userVerifyCode){
                    login.includes('@') ? await pool.query("UPDATE users SET is_email_address_verified = true WHERE email_address = $1", [login]) : await pool.query("UPDATE users SET is_phone_verified = true WHERE phone_number = $1", [login])
                    const response = {
                        message: "Правильный код",
                        token: null
                    }
                    res.status(200).json(response);
                }else{
                    res.status(500).json("wrong code")
                }
            }
            if(redisPasswordRecoverCode){
                if(code == redisPasswordRecoverCode){
                    const response = {
                        message: "Правильный код",
                        token: null
                    };
                    res.status(200).json(response);
                }else{
                    res.status(500).json("wrong code")
                }
            }
        }
    },
        /**
         * Метод для входа по логину
         * @param {object} res
         * @param {string} email
         * @param {string} password
         * 
         * @return {object} result
         */ 
        login: {
            rest: {
				method: "POST",
				path: "/login"
			},
            params: {
				email: "string",
                password: "string"
			},
            async handler(email, password, res) {
                let isUserVerified;

                try{
                    // connectDb();
                    isUserVerified = pool.query('SELECT * FROM users u \
                        WHERE u.email_address = $1 AND u.password = $2', [email, password])

                }catch(e){
                    console.log(e)

                    throw ApiErrors.userNotFound;
                }

                const bearer = createAndBindToken(isUserVerified.rows[0].user_id);
                const result = {
                    message: `Вы успешно вошли под именем: ${isUserVerified.rows[0].surname}`,
                    token: bearer
                }

                res.json(result)
            }
        },

        /**
         * Метод для регистрации нового аккаунта
         * 
         * @param {string} surname
         * @param {string} name
         * @param {string} patronymic
         * @param {string} email_address
         * @param {boolean} is_email_address_verified
         * @param {string} phone_number
         * @param {boolean} is_phone_number_verified
         * @param {string} password
         * 
         * @param {object} res
         */
        register: {
            rest: {
				method: "POST",
				path: "/register"
			},
            params: {
                surname: "string", 
                name: "string", 
                patronymic: "string", 
                email_address: "string", 
                is_email_address_verified: "boolean",
                phone_number: "string", 
                is_phone_number_verified: "boolean",
                password: "string",
                
			},
            async handler(surname, name, patronymic, email_address, phone_number, password, res) {
                password = await bcrypt.hash(password, 10);
                let userId;
                let isactive = true;

                try{
                    pool.query("BEGIN");
                    userId = pool.query('SELECT * FROM users u WHERE u.phone_number = $1 OR u.email_address = $2', [phone_number, email_address]);
                    if(userId.rowCount > 0){
                        throw new Error("Такой юзер уже есть")
                    }
                    userId =  pool.query('INSERT INTO users (surname, name, patronymic, email_address, is_email_address_verified, phone_number, is_phone_number_verified, password, isactive) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)  RETURNING user_id', [surname, name, patronymic, email_address, is_email_address_verified, phone_number, is_phone_number_verified, password, isactive]);
                    pool.query("COMMIT");

                }catch(e){
                    console.log(e)
                    pool.query("ROLLBACK");
                    const error = {
                        message: "Возникла ошибка регистрации, подробнее: " + e,
                        token: null
                    }
                    res.status(500).json(error)
                }

                const result = {
                    message: "Успешно добавлен пользователь",
                    token: null
                }
                res.status(200).json(result)
            }
        },

        /**
         * Деактивация аккаунта
         * 
         * @param {string} email_address
         * 
         * 
         */
        disable: {
            rest:{
                path: "/disable"
            },
            params: {
                email_address: "string"
            },
            async handler(email_address){
                pool.query("BEGIN")
                await pool.query('SELECT user_id FROM users WHERE email_address = $1', [email_address], 'SET is_activated = false');
            }
        },
        /**
         * Активация аккаунта
         * 
         * @param {string} email_address
         * 
         * 
         */
        enable: {
            rest:{
                path: "/enable"
            },
            params: {
                email_address: "string"
            },
            async handler(email_address){
                pool.query("BEGIN")
                await pool.query('SELECT user_id FROM users WHERE email_address = $1', [email_address], 'SET is_activated = true');
            }
        },
    },

    started() {},

    stopped() {}
};