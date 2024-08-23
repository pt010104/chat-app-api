'use strict'

const {StatusCodes,ReasonPhrases} = require ("../utils/httpStatusCode.js")

class SuccessResponse{
    constructor({message, statusCode = StatusCodes.OK, reasonPhrases = ReasonPhrases.OK, metadata={} }){
        this.message = message || reasonPhrases
        this.status = statusCode
        this.metadata = metadata
    }

    send(res,headers ={}) {
        return res.status(this.status).json(this)
    }

}

class OK extends SuccessResponse{
    constructor({message, metadata = {}}){
        super({message, metadata})
    }
}

class CREATED extends SuccessResponse{
constructor({message,statucsCode = StatusCodes.CREATED, reasonPhrases = ReasonPhrases.CREATED, metadata = {}}){
        super({message, statucsCode, reasonPhrases, metadata})
    }
}

module.exports =  {
    OK,
    CREATED,
    SuccessResponse
}