import * as fs from "fs";
import * as path from "path";
import * as discord from "discord.js";
import * as tsc from "typescript-compiler";

console.log("Starting...");
var client = new discord.Client();

var modules: { [index: string]: BotModule; } = {};

function ready() {
	modules
}

client.emit = function(event: string | symbol, ...args: any) {
	if(emitArgs[0] === "ready") {
		ready();
	}

	for (var key in modules) {
		var value = modules[key];
		value.emit(event, ...args);
	}
};

console.log("Logging In...");
var token = fs.readFileSync(path.join(__dirname, "token.txt"), 'utf8').toString().trim();
console.log("`" + token + "`");
client.login(token);
