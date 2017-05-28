//module
import { BotModule, command, CommandParameters } from '../app/module';
import { Message, RichEmbed, Snowflake } from 'discord.js';
import { ParsedArgs } from 'minimist';
import { perms } from './PermissionManager';


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

@perms([
    {name: "create", desc: "Create replies"},
    {name: "delete", desc: "Delete replies"},
    {name: "list", desc: "List replies"},
])
export class SimpleReply extends BotModule {
    db_replies: LokiCollection<ReplyRecord>

    initCollections() {
        super.initCollections()

        this.db_replies = this.db.addCollection<ReplyRecord>('replies')
    }

	onMessage(message: Message) {
        let docs = this.db_replies.findObjects({ guildID: message.guild.id })
        const value = docs.find((v: any) => {
            return message.content.startsWith(v.command)
        })
        if (value !== undefined) {
            message.channel.send(this.formatReply(message, value.content))
        }
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
        const subCommand = args.pop()
        if(subCommand === "list") {
            let docs = this.db_replies.findObjects({ guildID: message.guild.id })

            const m = docs.map((v: any) => "`" + v.command + "`").join("\n")
            message.channel.send({
                embed: new RichEmbed()
                    .setTitle("All simple replies")
                    .setDescription(m)
            })
        }
        if(subCommand === "rm") {
            const trigger = args.pop()
            let docs = this.db_replies.findObjects({ guildID: message.guild.id, command: trigger })
            docs.forEach(v => this.db_replies.remove(v))
            if (docs.length === 0) {
                message.channel.send({
                    embed: new RichEmbed()
                        .setTitle("No simple replies found")
                        .setDescription("Tried trigger phrase `" + trigger + "`\n" + "Maybe try surrounding the trigger phrase in quotes")
                })
            } else {
                message.channel.send({
                    embed: new RichEmbed()
                        .setTitle(`Deleted simple reply`)
                        .setDescription("Found and deleted all replies for for trigger phrase `" + trigger + "`")
                })
            }
        }
        if(subCommand === "create") {
            const command = args.pop()
            message.channel.fetchMessages({limit: 2}).then(collection => {
                const content = collection.last().content

                message.channel.send({
                    embed: new RichEmbed()
                        .setTitle("Added simple reply")
                        .addField("Trigger", "`" + command + "`")
                        .setDescription(content)
                })

                this.db_replies.insert({ guildID: message.guild.id, command: command, content: content })
            })
        }
    }
}

type ReplyRecord = {
    guildID: Snowflake,
    command: string, 
    content: string
}
