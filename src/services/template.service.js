'use strict'

const Template = require("../models/template.model")
const {htmlEmailToken} = require("../utils/template/templateEmail.html")
const {htmlResetPassword} = require("../utils/template/templateResetPassword")

const newTemplate = async (tem_id, name, type) => {

    let html = ''

    if (type === 'new-user') {
        html = htmlEmailToken()
    } else if (type === 'reset-password') {
        html = htmlResetPassword()
    }

    const newTem = await Template.create({
        tem_id: tem_id,
        name: name,
        html: html
    })

    return newTem
}

const getTemplate = async ({
    name
}) => {

    const template = await Template.findOne({
        name: name
    })

    return template
}

module.exports = {
    newTemplate,
    getTemplate
};