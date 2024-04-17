const jwt = require("jsonwebtoken");
const { Context, broker } = require("moleculer");
const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config({ path: '/home/molterez/moleculer-demo/process.env' })

const ctx = new Context(broker);

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

module.exports = { 
    name: "token",
    settings: {
        
    },
    actions: {
    /**
     * Сохрананение refresh-токена у юзера с id = userId
     * @param {object} body
     * 
     */
    saveToken: {
        rest: {
            method: "POST",
			path: "/save"
        },
        params: {
            email_address : "string",
            token : "string"
        },
        async handler (body) {
            let {email_address, token} = body.params
            try{
                await pool.query("UPDATE users SET token = $2 WHERE email_address = $1", [email_address, token]);
            }catch(e){
                const error = {
                    message: "Возникла ошибка, подробнее: " + e,
                    token: null
                }
                throw(error);
            }
            return response = {
                message: "Токен успешно сохранен",
                token: token
            }
        }
    },

    /**
    * Генерация пар токенов: accessToken и refreshToken
    * @param {object} body - данные запроса, тело и строка
    * @param {Context} ctx
    */
    createandbind: {
        rest:{
            method: "GET",
            path: "/createbind"
        },
        params: {
            email_address: 'string'
        },
        async handler (ctx) {

            let accessToken, refreshToken = 2
            try{
                const email_address = ctx.params.email_address;

                // const accessToken = jwt.sign({ userId: user_id }, { expiresIn: process.env.TOKENS_SECRET })
                accessToken = jwt.sign({ userId: ctx.params.email_address }, process.env.ACCESS_TOKENS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES });
                refreshToken = jwt.sign({ userId: ctx.params.email_address }, process.env.REFRESH_TOKEN_EXPIRES, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES });
            
                // Тут привязываемrefresh-токен к юзеру user_id
                await ctx.call("token.saveToken", {email_address, accessToken});
            }catch(e){
                const error = {
                    message: "Возникла ошибка, подробнее: " + e,
                    token: null
                }
                throw(error);
            }

            return {
                accessToken: accessToken,
                refreshToken: refreshToken
            };
        }
    },

    
    /**
    * Достает информацию из токена bearer
    * @param {object} bearer - токен
    */
    getTokenData: { 
        rest:{
            method: "GET",
            path: "/getData"
        },
        async handler (bearer) {

            const tokenData = jwt.verify(bearer, process.env.ACCESS_TOKENS_SECRET);

            return tokenData;
        }
    },
        
    /**
    * Генерация пар токенов: accessToken и refreshToken
    * @param {object} body - данные запроса, тело и строка
    * 
    * @return {string} token
    */
    generateToken: {
        rest:{
            method: "GET",
            path: "/generate"
        },
        async handler (payload) {
            const token = jwt.sign(payload, process.env.TOKENS_SECRET, {expiresIn: '1d'});

            return token;
        }
    }
},
created() {},
started() {},
stopped() {}
};