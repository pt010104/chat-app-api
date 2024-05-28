const app = require("./src/app")
require('dotenv').config();

const server = app.listen (process.env.DEV_PORT, () =>{
    console.log(`Start with ${process.env.DEV_PORT}`)
})
