import { MessageContext, DataKey } from './contexts';
import { createMetadataMethodDecorator, BotModule } from './bot';
import { Message, DMChannel, GroupDMChannel, Client, GuildMember, Channel, GuildChannel, Emoji, RichEmbed } from 'discord.js';
import * as minimist from 'minimist';
import HAX from '../../main/dirtyHax';


export type CommandContext = {
    message: MessageContext
    args: CommandArgs
}

export class CommandArgs {
    constructor(public readonly positional: string[], public readonly named: Map<string, string>, public readonly flags: string[], private context: MessageContext) {}
    /**
     * gets a positional or named parameter
     * @param i the index or name
     * @return the value or undefined if there is no such parameter
     */
    arg(i: string | number): string | undefined
    /**
     * gets a positional or named parameter, parsed by the passed parser
     * @param i the index or name
     * @param p the parser
     * @return the parsed value or undefined if there is no such parameter
     */
    arg<T>(i: string | number, p: Parser<T>): Promise<T> | undefined

    arg<T>(i: string | number, p?: Parser<T>): Promise<T> | string | undefined {
        let str: string | undefined = undefined
        if(typeof i === "string") {
            str = this.named.get(i)
        }
        if(typeof i === "number") {
            if(i >= 0 && i < this.positional.length) {
                str = this.positional[i]
            }
        }
        if(str === undefined) return undefined

        if(p !== undefined) {
            return p.parse(str, this.context)
        } else {
            return str
        }
    }

    private i = 0

    next(): string | undefined
    next<T>(p?: Parser<T>): Promise<T> | undefined

    next<T>(p?: Parser<T>): Promise<T> | string | undefined {
        let val = this.peek(p)
        this.advance()
        return val
    }

    peek(): string | undefined
    peek<T>(p?: Parser<T>): Promise<T> | undefined

    peek<T>(p?: Parser<T>): Promise<T> | string | undefined {
        if(p === undefined) 
            return this.arg(this.i)
        else
            return this.arg(this.i, p)
    }

    flag(i: string): boolean {
        return this.arg(i) !== undefined
    }

    advance(n: number = 1) {
        this.i += n
    }
    seek(n: number) {
        this.i = n
    }
    get cursor() { return this.i }
}

export interface Parser<T> {
    parse(value: string, message: MessageContext): Promise<T>
}

export type CommandDefinition = {
    names: string[],
    unlocalizedName: string
}

export const DATAKEY_COMMAND = new DataKey<CommandDefinition>("command")

export function command(data: CommandDefinition): MethodDecorator {
    return createMetadataMethodDecorator(DATAKEY_COMMAND, data)
}


const PREFIX_REGEX = /^!(\w+)/
const PREFIX = "!"

export function handleCommand(mod: BotModule, message: Message): boolean {
    let commandMatch = message.content.match(PREFIX_REGEX)
    const commandName = commandMatch === null ? null : commandMatch[1]
    let command_: CommandDefinition | null = null
    let method_: string | null = null
    if(commandName !== null) {
        mod.getMetadata().get(DATAKEY_COMMAND).forEach((v, k) => {
            if (command_ !== null) return
            if (v.names.indexOf(commandName) !== -1) {
                command_ = v
                method_ = k
            } 
        });
    }
    if (command_ !== null) {
        const command: CommandDefinition = command_
        const method: string = method_!!

        let _split = message.content.substr(commandMatch!![0].length).match(/(?:(?:[^\s"]|\\")+|"(?:\\\\|\\"|[^"])*")+/g)
        let split = processStrings(_split == null ? [] : _split)

        let _args = minimist(split, { boolean: ["h"] });
        if (!_args.h) {
            delete _args.h

            let positional: string[] = []
            let named = new Map<string, string>()
            let flags: string[] = []


            for (let k in _args) {
                let v = _args[k]
                if (k === "_" && v instanceof Array) {
                    positional = Array.of<string>(...v)
                } else {
                    if(typeof _args[k] === "boolean") {
                        flags.push(k)
                    } else {
                        named.set(k, _args[k])
                    }
                }
            }

            let args = new CommandArgs(positional, named, flags, mod.context(message))

            new Promise( (res, rej) => {
                (mod as any)[method]({ message: mod.context(message), args: args })
            }).catch((reason: any) => {
                console.log("error in command! Message text: `" + message.content + "`")
                console.log(reason)
            })
        } else {
            let help = mod.langRaw("command." + command.unlocalizedName + ".help")
            let embed = new RichEmbed()

            if(help.title !== undefined) embed.setAuthor(help.title)
            if(help.name !== undefined) embed.addField("NAME:", "ᅠ \t" + help.name)
            if(help.synopsis !== undefined) embed.addField("SYNOPSIS:", "ᅠ \t" + help.synopsis)
            if(help.description !== undefined) embed.addField("DESCRIPTION:", "ᅠ \t" + help.description)
            if(help.options!== undefined) {
                embed.addField("OPTIONS:", "ᅠ ", true)
                for(let k in help.options) {
                    embed.addField("ᅠ \t" + k, "ᅠ \t\t" + help.options[k])
                }
            }

            message.channel.send({ embed }).then(dat => {
                // module.track(dat, "confirm")
            })
            message.delete()
        }
        return true
	}

    return false
}

function processStrings(v: string[]): string[] {
    let o: string[] = []
    for (let i in v) {
        let s = v[i]

        if (s.startsWith('"') && s.endsWith('"')) {
            o[i] = s.substr(1, s.length - 2).replace(/\\"/g, '"')
        } else {
            o[i] = s
        }
    }
    return o
}

const PARSE_MEMBER = class implements Parser<GuildMember> {
    parse(value: string, message: MessageContext): Promise<GuildMember> {
        let match = value.match(/^<@!?(\d{18})>$/)
        if (match !== null) {
            return message.value.guild.fetchMember(match[1])
        }
        return Promise.reject("Argument not in member format!")
    }
}
const PARSE_CHANNEL = class implements Parser<GuildChannel> {
    parse(value: string, message: MessageContext): Promise<GuildChannel> {
        let match = value.match(/^<#(\d{18})>$/)
        if (match !== null) {
            return Promise.resolve(message.value.guild.channels.get(match[1]))
        }
        return Promise.reject("Argument not in member format!")
    }
}
const PARSE_EMOJI = class implements Parser<Emoji> {
    parse(value: string, message: MessageContext): Promise<Emoji> {
        let match = value.match(/^<:(\w{2,}):(\d{18})>$/)
        if (match !== null) {
            return Promise.resolve((HAX.client as Client).emojis.get(match[2]))
        }
        return Promise.reject("Argument not in member format!")
    }
}