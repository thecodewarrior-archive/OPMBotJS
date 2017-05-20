//module
import { BotModule, command, tracker, MessageTracker, CommandParameters } from '../app/module';
import { Message, Client } from 'discord.js';
import { ParsedArgs } from 'minimist';

export class LawsOfAviation extends BotModule {
    lawPages: string[] = []

    constructor(client: Client) {
        super(client)
        this.fileContent("laws.txt").then( (text) => {
            let sections = text.split("\n\n")
            let current = ""
            for(var i in sections) {
                let s = sections[i]
                if(current.length + 2 + s.length > 2000) {
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
        "    lawsofaviation - Print the laws of aviation... and more",
        "SYNOPSIS",
        "    %lawsofaviation [--page=N]",
        "    %laws [--page=N]",
        "OPTIONS",
        "    --page=N",
        "         start at page N. N is zero-indexed, and defaults to zero"]})
    laws(message: Message, args: CommandParameters) {
        let page = parseInt(args.page) | 0
        message.channel.send(this.lawPages[page]).then( (sent) => {
            this.track(sent as Message, "pages")
            this.msgData(sent as Message, data => {
                data['page'] = page
                return Promise.resolve()
            })
        })
    }

    @tracker("pages")
    tracker: MessageTracker = new MessageTracker(this, (it) => {
        it.setButton("➡", (db, message, user) => {
            db['page']++
            message.edit(this.lawPages[db['page']])
            return Promise.resolve()
        })
    })
}
