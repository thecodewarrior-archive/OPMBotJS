//module
import { BotModule, command, tracker, MessageTracker, CommandParameters } from '../app/module';
import { Message, Client, RichEmbed } from 'discord.js';
import { ParsedArgs } from 'minimist';

export class LawsOfAviation extends BotModule {
    lawPages: string[] = []

    constructor(client: Client) {
        super(client)
        this.fileContent("laws.txt").then( (text) => {
            let sections = text.split("\n\n")
            let current = ""
            let lines = 0
            let pages: string[] = []
            for(var i in sections) {
                let s = sections[i]
                if(current.length - current.replace(/\n/g, '').length > 20) {
                    this.lawPages.push(current)
                    current = s
                } else {
                    current += "\n\n" + s
                }
            }
            this.lawPages.push(current)
        }).catch((err) => {
            console.log(err)
        })
    }

    @command({ names: ["lawsofaviation", "laws"], help: [
        "NAME",
        "    lawsofaviation - Print the laws of aviation... the entire laws of aviation",
        "SYNOPSIS",
        "    %lawsofaviation [--page=N]",
        "    %laws [--page=N]",
        "OPTIONS",
        "    --page=N",
        "         start at page N. N is zero-indexed, and defaults to zero"],
        desc: "Print the laws of aviation... the entire laws of aviation"
    })
    laws(message: Message, args: CommandParameters) {

        let page = parseInt(args.page) | 0
        message.channel.send(this.page(page)).then( (sent) => {
            this.track(sent, "pages")
            this.msgData(sent, data => {
                data['page'] = page
                return Promise.resolve()
            })
        })
    }

    page(index: number): RichEmbed {
        return new RichEmbed()
            .setDescription(this.lawPages[index])
            .setFooter(`page ${index + 1}/${this.lawPages.length}`)
    }

    @tracker("pages")
    tracker: MessageTracker = new MessageTracker(this, (it) => {
        it.setButton("➡", (db, message, user) => {
            db['page']++
            message.edit(this.page(db['page']))
            return Promise.resolve()
        })
    })
}
