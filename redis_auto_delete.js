const RedisService = require("./src/services/redis.service.js");

async function autoDelete(pattern) {
    try {
        const results = await RedisService.keys(`*${pattern}*`);
        if (results.length === 0) {
            console.log(`No keys found matching pattern: *${pattern}*`);
            return;
        }
        console.log(`Found ${results.length} keys:`);
        results.forEach(key => console.log(key));

        const shouldDelete = await askForConfirmation();
        if (shouldDelete) {
            await Promise.all(results.map(result => RedisService.delete(result)));
            console.log(`Deleted ${results.length} keys.`);
        } else {
            console.log("Deletion cancelled.");
        }
    } catch (error) {
        console.error("Error in autoDelete:", error);
    }
}

function askForConfirmation() {
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        readline.question('Do you want to delete these keys? (yes/no): ', (answer) => {
            readline.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log("Please provide a pattern as an argument.");
    process.exit(1);
}

const pattern = args[0];

autoDelete(pattern).then(() => {
    console.log("Auto delete process completed.");
}).catch(error => {
    console.error("Error in main execution:", error);
});