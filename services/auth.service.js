const bcrypt = require("bcrypt");
const verificationModule = require("../verification/verify.js");
const ApiErrors = require("./response.service.js");
const {Context} = require("moleculer");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const method = require("../verification/method.js");
dotenv.config({ path: '/home/molterez/moleculer-demo/process.env' })

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});


module.exports = {
    name: "users",
    settings: {},
    actions: {
        sendMail: "mail.sendmail"
    },
    validator: true,
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
            email_address: "string",
            code: "string"
        },
        async handler(body, res){
            let userId;
            const { email_address, code } = body;

            try {
                userId = await pool.query('SELECT user_id FROM users WHERE email_address = $1', [email_address]);

            } catch (e) {
                console.log(e)
            }

            // Приставки к ключам
            let userVerifyCodeKey = "Yurta:user:";

            userVerifyCodeKey = userVerifyCodeKey + userId.rows[0].user_id;

            if(userVerifyCode){
                if(code == userVerifyCode){
                    login.includes('@') ? await pool.query("UPDATE users SET is_email_address_verified = true WHERE email_address = $1", [email_address]) : await pool.query("UPDATE users SET is_phone_verified = true WHERE phone_number = $1", [email_address])
                    const response = {
                        message: "Правильный код",
                        token: null
                    }
                    res.status(200).json(response);
                }else{
                    res.status(500).json("wrong code")
                }
            }
        }
    },
        /**
         * Метод для входа по логину
         * @param {string} email_address
         * @param {string} password
         * 
         * @return {object} result
         */ 
        login: {
            rest:{
              path: "/login",
              method: "POST"  
            },
            params: {
				email_address: "string",
                password: "string",
            },
            async handler(ctx) {
                try{
                    // connectDb();
                    let hashedPass = await pool.query('SELECT password FROM users u WHERE u.email_address = $1 OR u.password = $2', [ctx.params.email_address, ctx.params.password]);
                    if(bcrypt.compare(password, hashedPass)){
                        let jwttoken = ctx.call();
                    }else{

                    }
                }catch(e){
                    throw(e);
                }
                const result = {
                    message: "Успешно",
                    token: null
                }
                return result;
            }
        },

        /**
         * Метод для выхода из аккаунта
         * @param {object} req - данные запроса, тело и строка
         * @param {object} res - ответ
         * @returns {object}
         */
        logout: {
            rest: {
                method: "GET",
                path: "/logout"
            },
            params: {

            },
            async handler(req, res, ctx){
                console.log(req.query);
                const { Authorization } = req.query
                const tokenData = await ctx.call("token.getData", Authorization);
                await pool.query('UPDATE users SET token = \"\" WHERE user_id = $2', [tokenData,userId]);
                await ctx.call("users.get");
                res.status(200).json(tokenData);
            }
        },

        /**
         * Метод для регистрации нового аккаунта
         * 
         * @param {object} body
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
                name: { type: "string", min: 2 }, 
                patronymic: "string", 
                email_address: "string", 
                is_email_address_verified: {type: "boolean", optional: true},
                phone_number: { type: "string", min: 10, max: 10, optional: true}, 
                is_phone_number_verified: {type: "boolean", optional: true},
                password: "string",
			},
            async handler(body, res) {
                console.log(body.params);
                const {surname, name, patronymic, email_address,is_email_address_verified, phone_number, is_phone_number_verified, password} = body.params;
                let isactive = true;
                let userId;
                const salt = await bcrypt.genSalt(10);
                password = await bcrypt.hash(password, salt);

                try{
                    userId = await pool.query('SELECT * FROM users u WHERE u.phone_number = $1 OR u.email_address = $2', [phone_number, email_address]);
                    if(userId.rowCount > 0){
                        throw new Error("Такой юзер уже есть")
                    }
                    userId = await pool.query('INSERT INTO users (surname, name, patronymic, email_address, is_email_address_verified, phone_number, is_phone_number_verified, password, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)  RETURNING user_id', [surname, name, patronymic, email_address, is_email_address_verified, phone_number, is_phone_number_verified, password, isactive]);
                }catch(e){
                    console.log(e)
                    const error = {
                        message: "Возникла ошибка регистрации, подробнее: " + e,
                        token: null
                    }
                    throw(error);
                }

                const result = {
                    message: "Успешно добавлен пользователь",
                    token: null
                }
                return result;
            }
        },

        /**
         * Верификация
         * @param {object} body - данные запроса, тело и строка
         */
        verify: {
            rest:{
                method: "POST",
                path: "/verify"
            },
            params: {
				email: "string",
            },
            async handler(body, res){
                for(let data in body){ 
                    if(!data){
                        delete body.data
                    }
                }
                // Проверяем, все ли поля заполнены
                if (!(body?.phone?.length ? 1 : 0) ^ (body?.email?.length ? 1 : 0)) {
                    throw new Error('Для данной операции требуется ОДНО из полей (email, phone)');
                }

                let response;
                try {
                    response = await verificationModule.verifyCredentials(body);
                } catch (e) {
                    console.log(e);
                };
                console.log(response)

                res.status(200).json(response)

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
                path: "/disable",
                method: "POST"
            },
            params: {
                email_address: "string"
            },
            async handler(body){
                let {email_address} = body.params
                try {
                    userId = await pool.query('SELECT * FROM users WHERE u.email_address = $1', [email_address]);
                    if(userId.rowCount > 0){
                        data = Date.now();
                    await pool.query('UPDATE users SET is_active = false WHERE email_address = $1', [email_address]);
                    await pool.query('UPDATE users SET deactivated_at = $1 WHERE email_address=$2', [data, email_address])
                    }else{
                    throw new Error("Такого пользователя нету")
                }
                }catch(e){ 
                    console.log(e)
                    const error = {
                        message: "Возникла ошибка, подробнее: " + e,
                        token: null
                    }
                    throw(error);
                }

                const result = {
                    message: "Успешно деактивирован пользователь",
                    token: null
                }
                return result;    
            }
        },
        /**
         * Активация аккаунта
         */
        enable: {
            rest:{
                path: "/enable",
                method: "POST"
            },
            params: {
                email_address: "string"
            },
            async handler(ctx){
                let email_address = ctx.params.email_address;
                try {
                    let code = Math.floor(100000 + Math.random() * 900000).toString();
                    userSendedCode = await ctx.call("mail.sendmail", {email_address, code});
                    userId = await pool.query('SELECT email_address FROM users WHERE email_address = $1', [email_address]);
                    console.log(userId);
                    if(userId.rowCount > 0){
                        await pool.query('UPDATE users SET is_active = true WHERE email_address = $1', [email_address]);
                    }else{
                        throw new Error("Такого пользователя нету")
                    }
                }catch(e){
                    console.log(e)
                    const error = {
                        message: "Возникла ошибка, подробнее: " + e,
                        token: null
                    }
                    throw(error);
                }

                const result = {
                    message: "Успешно активирован пользователь",
                    token: null
                }
                return result;    
            }
        },
        /**
         * Получаем пользователей 
         * @returns 
         */
        getUsers: {
            rest: {
                method: "GET",
                path: "/get"
            },
            async handler() {
                try {

                    const result = await pool.query('SELECT * FROM users');

                    // await pool.end();

                    return { success: true, users: result };
                } catch (error) {
                    throw ("Произошла ошибка - ", error);
                }
            },
        },

    /**
     * Метод для восстановления пароля
     * @param {object} req - данные запроса, тело и строка
     * @param {object} res - ответ
     */
    passwordRecovery: {
        rest:{
            path: "/recovery"
        },
        params: {
            email_address: "string",
            phone_number: "string",
            password: "string"
        },
        async handler(body, res, ctx){

            const {surname, name, patronymic, email_address, phone_number, password} = body;
            try{
                const ctx = Context.meta;
                // await connectDb();
                await pool.query("BEGIN");

                // Можно обойтись без лишнего SELECT если в БД поставить правило уникальности почты и/или номера телефона
                const isUserVerified = await pool.query('SELECT * FROM users u WHERE u.phone_number = $1 OR u.email_address = $2', [phone_number, email_address]);
                if(isUserVerified.rowCount > 0){
                    throw new Error("Такой юзер уже есть")
                }

                // /* Генерация и привязка токена */
                // const bearer = await createAndBindToken(userid);
                // Тут вставка нового юзера и привзяка ему токена, в Юрте там один токен без срока годности, хранят в Редисе
                const newUserInsert = await pool.query('INSERT INTO users (surname, name, patronymic, email_address, phone_number, password) VALUES ($1, $2, $3, $4, $5, $6)  RETURNING user_id', [surname, name, patronymic, email_address, phone_number, password]);
                await ctx.call("token.save", newUserInsert.rows[0].user_id, await ctx.call("token.generate", {userId: newUserInsert.rows[0].user_id}));


                await pool.query("COMMIT");

            }catch(e){
                console.log(e)

                await pool.query("ROLLBACK");

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
    },

    created() {},
    started() {},
    stopped() {}
};