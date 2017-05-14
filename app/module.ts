import * as discord from "discord.js";
import * as EventEmitter from "events";

export class BotModule extends EventEmitter {
	const client: discord.Client;

	constructor(client: discord.Client) {
		this.client = client;
	}

	

}
