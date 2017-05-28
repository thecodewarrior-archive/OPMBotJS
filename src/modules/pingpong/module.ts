import { BotModule } from '../../base/api/bot';
import { command, CommandArgs, CommandContext } from '../../base/api/commands';
import { MessageContext } from '../../base/api/contexts';

export default class PingPong extends BotModule {
    @command({
        names: ["ping", "pong"],
        unlocalizedName: "pingpong"
    })
    method(context: CommandContext) {
        context.message.reply("pong")
    }
}