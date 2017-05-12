import * as fs from "fs";
import * as path from "path";
import * as discord from "discord.js";

console.log("Starting...");
var client = new discord.Client();

var token = fs.readFileSync(path.join(__dirname, "token.txt")).toString();


client.on("ready", () => {
	console.log("ready");
})

client.on('message', (message) => {
	// If the message is "ping"
	console.log("message: `" + message.content + "`");
	if (message.content === 'ping') {
		// Send "pong" to the same channel
		message.channel.send('pong');
	}
});

console.log("Logging In...");
client.login("MzEyNjM0MzgyODUyNTU0NzUy.C_d7BQ.UFxjSyErznNBDYa3pJ-NXAv8dBI");
