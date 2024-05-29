const app = require("./src/app")
require('dotenv').config();

const port = process.env.PORT || 5050;

const server = app.listen (port, () =>{
    console.log(`Start with ${port }`)
})