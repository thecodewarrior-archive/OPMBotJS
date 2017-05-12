import * as fs from "fs";
import * as path from "path";
import * as discord from "discord.js";

console.log("Starting...");
var client = new discord.Client();

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
var token = fs.readFileSync(path.join(__dirname, "token.txt")).toString();
client.login(token);
