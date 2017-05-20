//module
import { BotModule, command } from '../app/module';
import { Message, Client, Emoji } from 'discord.js';
import { ParsedArgs } from 'minimist';

export class NavySeals extends BotModule {
    @command({ names: ["!seals"], help: ["Print the navy seals <remind me to add proper docs>"]})
    sendSeals(message: Message, args: ParsedArgs) {
        let type = "og";
        let firstArg: any | undefined = args._[0]
        if(firstArg !== undefined) {
            if(firstArg instanceof Emoji) {
                type = ":" + firstArg.name + ":"
            } else if(typeof firstArg === "string") {
                type = firstArg
            }
        }

        message.channel.send(this.data.seals[type])
    }
}