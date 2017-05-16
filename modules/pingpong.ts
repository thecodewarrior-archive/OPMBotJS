//notmodule
import { BotModule, command } from '../app/module';
import { Message } from 'discord.js';
import { ParsedArgs } from 'minimist';

export class PingPong extends BotModule {
	onMessage(message: Message) {
        if(message.content === "ping") {
            message.channel.send("pong")
        }
        if(message.content === "pong") {
            message.channel.send("ping")
        }
    }

    @command({ names: ["doPing", "dp"], flags: ["a", "b", "flag"] })
    doPing(message: Message, args: ParsedArgs) {
        message.channel.sendCode("json", JSON.stringify(args))
    }
}