//module
import { BotModule, command, CommandParameters } from '../app/module';
import { Message, RichEmbed, Snowflake } from 'discord.js';
import { ParsedArgs } from 'minimist';


function replaceAll(str: string, mapObj: { [key: string]: string }){
    var re = new RegExp("(\\\\*)(" + Object.keys(mapObj).join("|") + ")","g");

    return str.replace(re, (matched) => {
        let backslashes = matched.match(/\\*/)
        if(backslashes !== null && backslashes[0].length % 2 == 1) {
            return matched
        }
        return (backslashes !== null && backslashes[0].length > 0 ? backslashes[0].substr(1) : "") + mapObj[matched.substr(backslashes === null ? 0 : backslashes[0].length)];
    });
}

export class SimpleReply extends BotModule {
	onMessage(message: Message) {
        this.db.find<ReplyRecord>({ type: "reply", guildID: message.guild.id }, (err, docs) => {
            const value = docs.find((v: any) => {
                return message.content.startsWith(v.command)
            })
            if(value !== undefined) {
                message.channel.send(this.formatReply(message, value.content))
            }
        })
    }

    formatReply(message: Message, text: string): string {
        return replaceAll(text, {
            "<SENDER>": "@" + message.author.tag,
        })
    }

    @command({
        names: ["simpleReply"],
        flags: ["l", "r"],
        help: [
            "NAME",
            "    simpleReply - configure the SimpleReply utility",
            "SYNOPSIS",
            "    %simpleReply list",
            "    %simpleReply create \"<trigger phrase>\"",
            "    %simpleReply rm \"<trigger phrase>\"",
            "DESCRIPTION",
            "    list",
            "        Prints out a list of all the simple replies for this server",
            "    create",
            "        Creates a simple reply with the passed trigger phrase, with the content of the previous message",
            "    rm",
            "        Removes all replies with the passed trigger phrase",
        ],
        desc: "configure the SimpleReply utility"
    })
    cmd(message: Message, args: CommandParameters) {
        const subCommand = args.consume()
        if(subCommand === "list") {
            this.db.find<ReplyRecord>({ type: "reply", guildID: message.guild.id }, (err, docs) => {
                const m = docs.map((v:any) => "`" + v.command + "`").join("\n")
                message.channel.send({
                    embed: new RichEmbed()
                        .setTitle("All simple replies")
                        .setDescription(m)
                })
            })
        }
        if(subCommand === "rm") {
            const trigger = args.consume()
            this.db.remove({ type: "reply", guildID: message.guild.id, command: trigger}, (err, n) => {
                if(n === 0) {
                    message.channel.send({
                        embed: new RichEmbed()
                            .setTitle("No simple replies found")
                            .setDescription("Tried trigger phrase `" + trigger + "`\n" + "Maybe try surrounding the trigger phrase in quotes")
                    })
                } else {
                    message.channel.send({
                        embed: new RichEmbed()
                            .setTitle(`Deleted ${n} simple replies`)
                            .setDescription(n + " matches found and deleted for trigger phrase `" + trigger + "`")
                    })
                }
            })
        }
        if(subCommand === "create") {
            const command = args.consume()
            message.channel.fetchMessages({limit: 2}).then(collection => {
                const content = collection.last().content

                message.channel.send({
                    embed: new RichEmbed()
                        .setTitle("Added simple reply")
                        .addField("Trigger", "`" + command + "`")
                        .setDescription(content)
                })

                this.db.insert({ type: "reply", guildID: message.guild.id, command: command, content: content })
            })
        }
    }
}

type ReplyRecord = {
    type: "reply",
    guildID: Snowflake,
    command: string, 
    content: string
}
