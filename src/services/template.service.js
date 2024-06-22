'use strict'

const Template = require("../models/template.model")
const {htmlEmailToken} = require("../utils/template.html")

const newTemplate = async ({
    tem_id,
    name,
    html
}) => {
    const newTem = await Template.create({
        tem_id: tem_id,
        name: name,
        html: htmlEmailToken()
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