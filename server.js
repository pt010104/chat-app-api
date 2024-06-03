const app = require("./src/app")
const PORT = 5050

const server = app.listen (PORT, () =>{
    console.log(`Start with ${PORT}`)
})

process.on('SIGINT', ()=>{
    server.close( () => console.log("Exist server express") )
})
