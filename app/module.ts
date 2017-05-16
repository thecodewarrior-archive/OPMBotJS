import { Client, Channel, ClientUserSettings, Emoji, Guild, User, GuildMember, Collection, Snowflake, Message, MessageReaction, Role, UserResolvable } from 'discord.js';
import * as EventEmitter from "events";
import "reflect-metadata";
import { ParsedArgs} from "minimist";
import * as minimist from "minimist";
import * as fs from "fs";
import * as path from "path";

export class BotModule {
	protected client: Client;
	protected readonly data: any;

	readonly modulename: string;

	constructor(client: Client) {
		this.client = client;

		this.modulename = this.constructor.name;
		let jsonFile = path.join(__dirname, "../modules/data", this.modulename + ".json")
		if(fs.existsSync(jsonFile)) {
			this.data = JSON.parse(fs.readFileSync(jsonFile).toString())
		} else {
			this.data = {}
		}
	}

	transfer(oldModule: this) {}

	onChannelCreate(channel: Channel) {}
	onChannelDelete(channel: Channel) {}
	onChannelPinsUpdate(channel: Channel, time: Date) {}
	onChannelUpdate(oldChannel: Channel, newChannel: Channel) {}
	onClientUserSettingsUpdate(clientUserSettings: ClientUserSettings) {}
	onDebug(info: string) {}
	onDisconnect(event: CloseEvent) {}
	onEmojiCreate(emoji: Emoji) {}
	onEmojiDelete(emoji: Emoji) {}
	onEmojiUpdate(oldEmoji: Emoji, newEmoji: Emoji) {}
	onGuildBanAdd(guild: Guild, user: User) {}
	onGuildBanRemove(guild: Guild, user: User) {}
	onGuildCreate(guild: Guild) {}
	onGuildDelete(guild: Guild) {}
	onGuildMemberAdd(member: GuildMember) {}
	onGuildMemberAvailable(member: GuildMember) {}
	onGuildMemberRemove(member: GuildMember) {}
	onGuildMembersChunk(members: Collection<Snowflake, GuildMember>, guild: Guild) {}
	onGuildMemberSpeaking(member: GuildMember, speaking: boolean) {}
	onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember) {}
	onGuildUnavailable(guild: Guild) {}
	onGuildUpdate(oldGuild: Guild, newGuild: Guild) {}
	onMessage(message: Message) {}
	onMessageDelete(message: Message) {}
	onMessageDeleteBulk(messages: Collection<Snowflake, Message>) {}
	onMessageReactionAdd(messageReaction: MessageReaction, user: User) {}
	onMessageReactionRemove(messageReaction: MessageReaction, user: User) {}
	onMessageReactionRemoveAll(message: Message) {}
	onMessageUpdate(oldMessage: Message, newMessage: Message) {}
	onPresenceUpdate(oldMember: GuildMember, newMember: GuildMember) {}
	onReconnecting() {}
	onResume(replayed: number) {}
	onRoleCreate(role: Role) {}
	onRoleDelete(role: Role) {}
	onRoleUpdate(oldRole: Role, newRole: Role) {}
	onTypingStart(channel: Channel, user: User) {}
	onTypingStop(channel: Channel, user: User) {}
	onUserNoteUpdate(user: UserResolvable, oldNote: string, newNote: string) {}
	onUserUpdate(oldUser: User, newUser: User) {}
	onVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember) {}
	onWarn(info: string) {}

	private commands: { [key: string] : { method: string, flags: string[] } }
	
	protected parseValue(message: Message, v: any): Promise<any> { return Promise.resolve(v) }

	/** DO NOT OVERRIDE */
	_addCommand(names: string[], key: { method: string, flags: string[] }, parameters: Function[]) {
		if(this.commands == undefined) this.commands = {}
		if(parameters[0] !== Message) {
			throw "First parameter of every command method must be a `Message` - the message sent"
		}
		if(parameters[1] !== Object) {
			throw "Second parameter of every command method must be an `Object` - the parsed command line arguments"
		}
		for(var i in names) {
			this.commands[names[i]] = key 
		}
	}

	/** DO NOT OVERRIDE */
	_onMessage(message: Message) {
		let _split = message.content.match(/(?:[^\s"]+|"[^"]*")+/g)
		let split = (_split == null ? [] : _split)
		let commandName = split.length == 0 ? "" : split[0]

		if(this.commands[commandName] !== undefined) {
			let _args = minimist(split.slice(1), {boolean: this.commands[commandName].flags});
			let args = new CommandParameters();

			let promises: Promise<any>[] = []

			for(var k in _args) {
				let v = _args[k]
				if(k === "_" && v instanceof Array) {
					let arr: any[] = []
					args._ = arr
					for(var i in v) {
						promises.push(this._parseValue(message, v[i]).then((value) => {
							arr[i] = value
						}))
					}
				} else {
					promises.push(this._parseValue(message, v).then( (value) => {
						args[k] = value
					}))
				}
			}

			Promise.all(promises).then( (value) => {
				(this as any)[this.commands[commandName].method](message, args)
			}).catch((reason: any) => {
				console.log("error in command! Message text: `" + message.content + "`")
				console.log(reason)
			})
		} else {
			this.onMessage(message)
		}
	}

	/** DO NOT OVERRIDE */
	protected _parseValue(message: Message, v: any): Promise<any>{
		if(typeof v === "string") {
			let match = v.match(/^"(.*)"$/)
			if (match !== null) {
				return Promise.resolve(match[0])
			}
			match = v.match(/^<@!?(\d{18})>$/)
			if (match !== null) {
				return message.guild.fetchMember(match[1])
			}
			match = v.match(/^<#(\d{18})>$/)
			if (match !== null) {
				return Promise.resolve(message.guild.channels.get(match[1]))
			}
			match = v.match(/^<:(\w{2,}):(\d{18})>$/)
			if (match !== null) {
				return Promise.resolve(this.client.emojis.get(match[2]))
			}
		}
		return this.parseValue(message, v)
	}
}

export class CommandParameters {
	[key: string] : any
	_: any[] = []
}

export function command(info: { names: string[], flags?: string[] }) {
	return (target: BotModule, key: string, descriptor: PropertyDescriptor) => {
		target._addCommand(info.names, {
			method: key,
			flags: ( info.flags === undefined ? [] : info.flags )
		}, Reflect.getMetadata("design:paramtypes", target, key));
	}
}