"use strict"

const verificationMethodsAdapters = require('./verify');
 
module.exports = {
    ACCOUNT_AUTH: {
        MAIL: (params) => verificationMethodsAdapters.YANDEX_MAIL.mailVerification({ ...params })
    },
    PASSWORD_RECOVERY: {
        MAIL: (params) => verificationMethodsAdapters.YANDEX_MAIL.recover({ ...params })
    }
}