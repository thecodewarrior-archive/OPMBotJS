//module
import { BotModule, command } from '../app/module';
import { Message, RichEmbed, Snowflake } from 'discord.js';
import { ParsedArgs } from 'minimist';

export class SimpleReply extends BotModule {
	onMessage(message: Message) {
        this.db.find<ReplyRecord>({ type: "reply", guildID: message.guild.id }, (err, docs) => {
            const value = docs.find(v => {
                return message.content.startsWith(v.command)
            })
            if(value !== undefined) {
                message.channel.send(value.content)
            }
        })
    }

	onMessageUpdate(oldMessage: Message, newMessage: Message) {
        const prefix = "!simpleReply "
        if(newMessage.content.startsWith(prefix)) {
            const command = newMessage.content.substr(prefix.length)
            const content = oldMessage.content

            newMessage.channel.send({
                embed: new RichEmbed()
                    .setTitle("Added simple reply")
                    .addField("Trigger", "`" + command + "`")
                    .setDescription(content)
            })

            this.db.insert({ type: "reply", guildID: newMessage.guild.id, command: command, content: content })
        }
    }
}

type ReplyRecord = {
    type: "reply",
    guildID: Snowflake,
    command: string, 
    content: string
}
