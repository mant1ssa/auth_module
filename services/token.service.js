const dotenv = require("dotenv");
const { pool } = require("../mixins/db.mixin");
const jwt = require("jsonwebtoken");

dotenv.config();


/**
 * Сохрананение refresh-токена у юзера с id = userId
 * @param {number} userId - id юзера
 * @param {string} token - refresh-токен
 */
const saveToken = async (userId, token) => {
    try{
        await pool.query("UPDATE users SET token = $1 WHERE user_id = $2", [token, userId]);
    }catch(e){
        console.log(e);

        throw new Error("Couldn't save token cause ", e);
    }
}

/**
 * Генерация пар токенов: accessToken и refreshToken
 * @param {object} body - данные запроса, тело и строка
 */
const createAndBindToken = async (payload) => {

    let accessToken, refreshToken
    try{
        const user_id = payload;

        // const accessToken = jwt.sign({ userId: user_id }, { expiresIn: process.env.TOKENS_SECRET })
        accessToken = jwt.sign({ userId: user_id }, process.env.ACCESS_TOKENS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES });
        refreshToken = jwt.sign({ userId: user_id }, process.env.REFRESH_TOKEN_EXPIRES, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES });
    
        // Тут привязываемrefresh-токен к юзеру user_id
        await saveToken(user_id, refreshToken);
    }catch(e){
        console.log(e);

        throw new Error("Error at binding tokens, ", e);
    }

    return {
        accessToken: accessToken,
        refreshToken: refreshToken
    };
}


/**
 * Достает информацию из токена bearer
 * @param {object} bearer - токен
 */
const getTokenData = (bearer) => {

    const tokenData = jwt.verify(bearer, process.env.ACCESS_TOKENS_SECRET);

    return tokenData;
}


/**
 * Генерация пар токенов: accessToken и refreshToken
 * @param {object} body - данные запроса, тело и строка
 */
const generateToken = (payload) => {
    const token = jwt.sign(payload, process.env.TOKENS_SECRET, {expiresIn: '1d'});

    return token;
}


module.exports = { 
    
    name: "token",

    actions: {
		/**
		 * Generate a new token.
		 */
		generate: {
			params: {
				type: {
					type: "enum",
					values: C.TOKEN_TYPES
				},
				expiry: { type: "number", integer: true, optional: true },
				owner: { type: "string" }
			},
			async handler(ctx) {
				const { token, secureToken } = this.generateToken(TOKEN_LENGTH);
				const res = await this.createEntity(ctx, {
					...ctx.params,
					token: secureToken
				});

				return { ...res, token };
			}
		},

		/**
		 * Check a token exist & not expired.
		 */
		check: {
			params: {
				type: {
					type: "enum",
					values: C.TOKEN_TYPES
				},
				token: { type: "string" },
				owner: { type: "string", optional: true },
				isUsed: { type: "boolean", default: false }
			},
			async handler(ctx) {
				let entity = await this.findEntity(ctx, {
					query: {
						type: ctx.params.type,
						token: this.secureToken(ctx.params.token)
					}
				});
				if (entity) {
					if (!ctx.params.owner || entity.owner == ctx.params.owner) {
						if (entity.expiry && entity.expiry < Date.now()) return false;

						if (ctx.params.isUsed) {
							entity = await this.updateEntity(
								ctx,
								{ id: entity.id, lastUsedAt: Date.now() },
								{ permissive: true }
							);
						}
						return entity;
					}
				}
				return null;
			}
		},

		/**
		 * Remove an invalidated token
		 */
		remove: {
			params: {
				type: {
					type: "enum",
					values: C.TOKEN_TYPES
				},
				token: { type: "string" }
			},
			async handler(ctx) {
				const entity = await this.findEntity(ctx, {
					query: {
						type: ctx.params.type,
						token: this.secureToken(ctx.params.token)
					}
				});
				if (entity) {
					await this.removeEntity(ctx, entity);
				}
				return null;
			}
		},

		/**
		 * Clear expired tokens.
		 */
		clearExpired: {
			visibility: "protected",
			async handler(ctx) {
				const adapter = await this.getAdapter(ctx);
				const count = await adapter.removeMany({ expiry: { $lt: Date.now() } });
				this.logger.info(`Removed ${count} expired token(s).`);
			}
		}
	},
    createAndBindToken, getTokenData, generateToken };