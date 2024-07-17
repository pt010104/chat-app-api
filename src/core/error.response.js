'use strict'

const {StatusCodes, ReasonPhrases} = require('../utils/httpStatusCode')

class ErrorResponse extends Error {

    constructor(message, status) {
        super(message)
        this.status = status
    }
    send(res,headers ={}) {
        return res.status(this.status).json(this)
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor(message = ReasonPhrases.CONFLICT, statusCodes = StatusCodes.CONFLICT) {
        super(message, statusCodes)
    }
}

class BadRequestError extends ErrorResponse {

    constructor (message = ReasonPhrases.BAD_REQUEST, statusCodes = StatusCodes.BAD_REQUEST) {
        super(message, statusCodes)
    }
}

class AuthFailureError extends ErrorResponse {

    constructor (message = ReasonPhrases.UNAUTHORIZED, statusCodes = StatusCodes.UNAUTHORIZED) {
        super(message,statusCodes)
    }
}

class NotFoundError extends ErrorResponse {

    constructor (message = ReasonPhrases.NOT_FOUND, statusCodes = StatusCodes.NOT_FOUND) {
        super(message,statusCodes)
    }
}

class ForbiddenError extends ErrorResponse {

    constructor (message = ReasonPhrases.FORBIDDEN, statusCodes = StatusCodes.FORBIDDEN) {
        super(message, statusCodes)
    }
}
module.exports = {
    ConflictRequestError,
    BadRequestError,
    AuthFailureError,
    NotFoundError,
    ForbiddenError
}