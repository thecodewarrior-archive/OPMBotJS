//module
import { BotModule, command, MessageData, MessageTracker, tracker, CommandParameters } from '../app/module';
import { Message, Client, Emoji, User, RichEmbed } from 'discord.js';
import { ParsedArgs } from 'minimist';

export class NavySeals extends BotModule {
    @command({ names: ["seals"], flags: ["k"], help: [
        "NAME",
        "    seals - Print navy seals",
        "SYNOPSIS",
        "    seals [name] [-l]",
        "OPTIONS",
        "    -l",
        "        List the available seals",
        "        special case, this prints the available comman"
        ],
        desc: "What the fuck did you just fucking say about me?"
    })
    sendSeals(message: Message, args: CommandParameters) {
        if(args.l) {
            message.delete()
            message.channel.send(Object.keys(this.data.seals).join(", ")).then(m => {
                this.track(m, 'confirm')
            })
            return;
        }

        let type = "og";
        let firstArg: any | undefined = args.parsed[0]
        if(firstArg !== undefined) {
            if(firstArg instanceof Emoji) {
                type = ":" + firstArg.name + ":"
            } else if(typeof firstArg === "string") {
                type = firstArg
            }
        }

        message.delete()
        message.channel.send({
            embed: new RichEmbed()
                .setAuthor(message.author.username, message.author.displayAvatarURL)
                .setDescription(this.data.seals[type])
                .setFooter('React to delete')
        }).then(m => {
            this.track(m, 'fuckoff')
        })
    }
	
    @tracker("fuckoff")
	fuckOffTracker = new MessageTracker(this, t => {
		t.setButton('🖕', 
			(db: MessageData, message: Message, user: User) => {
				return message.delete()
			},
			() => { return Promise.resolve(true) }
		)
	})
}