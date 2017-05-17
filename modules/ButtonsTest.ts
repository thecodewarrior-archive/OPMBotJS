//module
import { BotModule, command, tracker, MessageTracker } from '../app/module';
import { Message, Client } from 'discord.js';
import { ParsedArgs } from 'minimist';

export class ButtonsTest extends BotModule {
    constructor(client: Client) {
        super(client)
    }

    @command({ names: ["!buttontest"] })
    laws(message: Message, args: ParsedArgs) {
        let page = parseInt(args._[0]) | 0
        message.channel.send("X: 0 Y: 0").then( (sent) => {
            this.msgData(sent as Message, data => {
                data['X'] = 0
                data['Y'] = 0
            }).then( () => {
                this.track(sent as Message, "coords")
            })
        })
    }

    @tracker("coords")
    tracker: MessageTracker = new MessageTracker((it) => {
        it.setButton("➡", (message, user) => {
            return this.msgData(message, data => {
                data['X']++
                message.edit("X: " + data['X'] + " Y: " + data['Y'])
            })
        }, (message) => {
            return this.msgData(message, data => {
                return data['X'] < 10
            })
        })
        it.setButton("⬅", (message, user) => {
            return this.msgData(message, data => {
                data['X']--
                message.edit("X: " + data['X'] + " Y: " + data['Y'])
            })
        }, (message) => {
            return this.msgData(message, data => {
                return data['X'] > -10
            })
        })
        it.setButton("⬆", (message, user) => {
            return this.msgData(message, data => {
                data['Y']++
                message.edit("X: " + data['X'] + " Y: " + data['Y'])
            })
        }, (message) => {
            return this.msgData(message, data => {
                return data['Y'] < 10
            })
        })
        it.setButton("⬇", (message, user) => {
            return this.msgData(message, data => {
                data['Y']--
                message.edit("X: " + data['X'] + " Y: " + data['Y'])
            })
        }, (message) => {
            return this.msgData(message, data => {
                return data['Y'] > -10
            })
        })
    })
}
