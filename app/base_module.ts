import { BotModule, command, CommandParameters, tracker, MessageTracker, CommandDefinition } from './module';
import { Client, Message, RichEmbed } from 'discord.js';
import { simpleTrackerPage } from './simple_trackers';


export class BaseModule extends BotModule {
    @command({
        names: ["help"],
        flags: [],
        help: [
            "NAME",
            "    help - view a list of available commands or view the man page for a command",
            "SYNOPSIS",
            "    %help",
            "    %help <command>",
        ],
        desc: "Show available commands"
    })
    doHelp(message: Message, args: CommandParameters) {
        if(args.positional.length !== 0) {
            this.doMan(message, args)
            return;
        }

        let commandList: CommandDefinition[] = []

        for(let k in this.modules) {
            if(k === "base") continue;
            let mod = this.modules[k]

            for(let a in mod.commands) {
                commandList = commandList.concat(mod.commands)
            }
        }

        let pages: CommandDefinition[][] = []
        let current: CommandDefinition[] = []
        commandList.forEach(element => {
            current.push(element)
            if(current.length === 5) {
                pages.push(current)
                current = []
            }
        });
        if(current.length !== 0) pages.push(current)

        message.channel.send(this.listPage(pages, 0)).then( messages => {
            let promises = this.msgData(messages, (d, message) => {
                d.pages = pages

                return Promise.resolve()
            })

            promises.forEach( f => f.then(v => {
                this.track(v.message, "pages")
                this.track(v.message, "confirm")
            }))
        })
    }

    listPage(pages: CommandDefinition[][], index: number): any {
        let page = pages[index]
        let embed = new RichEmbed()
        embed.setTitle("Command list")
        page.forEach( v => {
            embed.addField(this.PREFIX + v.names[0], v.desc)
        })
        return { embed }
    }

    @tracker("pages")
    pages = new MessageTracker(this, it => {
        simpleTrackerPage(it, (db) => db.pages.length, (db, message, user, index) => {
            return message.edit(this.listPage(db.pages, index))
        })
    })
    
    
    @command({
        names: ["man"],
        flags: [],
        help: [
            "NAME",
            "    man - view the man page for a command",
            "SYNOPSIS",
            "    %man <command>",
        ],
        desc: "Show man pages"
    })
    doMan(message: Message, args: CommandParameters) {
        for(let k in this.modules) {
            let command = this.modules[k].commandsByName.get(args.peek())
            if(command !== undefined) {

				message.channel.send("```\n" + command.help.join('\n').replace(/%/g, this.PREFIX) + "\n```").then( dat => {
					this.track(dat, "confirm")
				})
				message.delete()

                break                
            }
        }
    }
}