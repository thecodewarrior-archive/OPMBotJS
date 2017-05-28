//not_module
import { BotModule, command, CommandParameters } from '../app/module';
import { Message } from 'discord.js';
import { ParsedArgs } from 'minimist';

export class PingPong extends BotModule {
	onMessage(message: Message) {
    }

    @command({ names: ["$doPing", "$dp"], flags: ["a", "b", "flag"], desc: "foobar", help: ["foo", "bar second line"] })
    doPing(message: Message, args: CommandParameters) {
        message.channel.sendCode("json", JSON.stringify(args))
    }
}
