import { Client, Channel, ClientUserSettings, Emoji, Guild, User, GuildMember, Collection, Snowflake, Message, MessageReaction, Role, UserResolvable, DMChannel, GroupDMChannel } from 'discord.js';
import * as EventEmitter from "events";
import "reflect-metadata";
import { ParsedArgs} from "minimist";
import * as minimist from "minimist";
import * as fs from "fs";
import * as path from "path";
import * as tp from "typed-promisify";
import * as loki from "lokijs";

const mkdirp: any = require("mkdirp");

export class BotModule {
	protected client: Client;
	protected readonly data: any;
	protected readonly env: any;
	protected readonly modules: { [key: string]: BotModule };
	protected db: Loki;
	protected db_messagedata: LokiCollection<MessageDataRecord>;
	protected db_trackers: LokiCollection<TrackerRecord>;

	readonly modulename: string;
	readonly moduledir: string;

	constructor(client: Client, modules: { [key: string]: BotModule }) {
		this.client = client;
		this.modules = modules;

		this.modulename = this.constructor.name;
		this.moduledir = path.join(__dirname, "../module_data/data", this.modulename)
		let jsonFile = path.join(__dirname, "../module_data/json", this.modulename + ".json")
		let envFile = path.join(__dirname, "../module_data/env", this.modulename + ".json")

		if(fs.existsSync(jsonFile)) {
			this.data = JSON.parse(fs.readFileSync(jsonFile).toString())
		} else {
			this.data = {}
		}
		if(fs.existsSync(envFile)) {
			this.env = JSON.parse(fs.readFileSync(envFile).toString())
		} else {
			this.env = {}
		}
	}

	transfer(oldModule?: this) {
		if (oldModule !== undefined && oldModule.db !== undefined) {
			this.db = oldModule.db
		} else {
			let dbFile = path.join(__dirname, "../module_data/db", this.modulename + ".json")
			this.db = new loki(dbFile)
		}
		this.initCollections()
	}

	initCollections() {
		this.db_messagedata = this.db.addCollection<MessageDataRecord>('messageData')
		this.db_trackers = this.db.addCollection<TrackerRecord>('trackers')
	}

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

	fileName(...file: string[]): string {
		return path.join(this.moduledir, ...file)
	}

	fileContent(...file: string[]): Promise<string> {
		return new Promise( (resolve, reject) => {
			fs.readFile(this.fileName(...file), (err, data: Buffer) => {
				if(err) reject(err)
				else resolve(data.toString())
			})
		});
	}

	commands: CommandDefinition[]
	commandsByName: Map<string, CommandDefinition>

	protected parseValue(message: Message, v: any): Promise<any> { return Promise.resolve(v) }

	/** DO NOT OVERRIDE */
	_addCommand(command: CommandDefinition, parameters: Function[]) {
		if(this.commands == undefined) this.commands = []
		if(this.commandsByName == undefined) this.commandsByName = new Map()

		if(parameters[0] !== Message) {
			throw "First parameter of every command method must be a `Message` - the message sent"
		}
		if(parameters[1] !== CommandParameters) {
			throw "Second parameter of every command method must be a `CommandParameters` - the parsed command line arguments"
		}
		this.commands.push(command)
		for(var i in command.names) {
			this.commandsByName.set(command.names[i], command)
		}
	}

	readonly PREFIX_REGEX = /^!(\w+)/
	readonly PREFIX = "!"
	/** DO NOT OVERRIDE */
	_onMessage(message: Message) {
		if(this.commands === undefined) this.commands = []
		if(this.commandsByName === undefined) this.commandsByName = new Map()

		let commandMatch = message.content.match(this.PREFIX_REGEX)
		const commandName = commandMatch === null ? null : commandMatch[1]
		const command = commandName === null ? undefined : this.commandsByName.get(commandName)

		if(command !== undefined) {
			let _split = message.content.substr(commandMatch!![0].length).match(/(?:(?:[^\s"]|\\")+|"(?:\\\\|\\"|[^"])*")+/g)
			let split = this.processStrings(_split == null ? [] : _split)

			if((message.channel instanceof DMChannel || message.channel instanceof GroupDMChannel) && !command.dm) {
				message.channel.send(`I'm sorry, \`${commandName}\` does not seem to work in dms.\n\nIf you would like this feature in particular please contact @thecodewarrior#6629`)
				return;
			}

			let _args = minimist(split, {boolean: Array.of(...command.flags, "h")});
			if(!_args.h) {
				let args = new CommandParameters();

				let promises: Promise<any>[] = []

				for (var k in _args) {
					let v = _args[k]
					if (k === "_" && v instanceof Array) {
						args.positional = Array.of<string>(...v)
						let arr: any[] = []
						args.parsed = arr
						for (var i in v) {
							promises.push(this._parseValue(message, v[i]).then((value) => {
								arr[i] = value
							}))
						}
					} else {
						let _k = k
						promises.push(this._parseValue(message, v).then((value) => {
							args[_k] = value
						}))
					}
				}

				Promise.all(promises).then((value) => {
					(this as any)[command.method](message, args)
				}).catch((reason: any) => {
					console.log("error in command! Message text: `" + message.content + "`")
					console.log(reason)
				})
			} else {
				message.channel.send("```\n" + command.help.join('\n').replace(/%/g, this.PREFIX) + "\n```").then( dat => {
					this.track(dat, "confirm")
				})
				message.delete()
			}
		} else {
			this.onMessage(message)
		}
	}

	protected processStrings(v: string[]): string[] {
		let o: string[] = []
		for(let i in v) {
			let s = v[i]

			if(s.startsWith('"') && s.endsWith('"')) {
				o[i] = s.substr(1, s.length-2).replace(/\\"/g, '"')
			} else {
				o[i] = s
			}
		}
		return o
	}

	/** DO NOT OVERRIDE */
	protected _parseValue(message: Message, v: any): Promise<any>{
		if(typeof v === "boolean") {
			return Promise.resolve(v)
		}
		if(typeof v === "string") {
			let match = v.match(/^<@!?(\d{18})>$/)
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

	msgData<T>(messages: Message | Message[], process: (data: any, message: Message) => Promise<T>): Promise<{ ret: T, message: Message}>[] {
		let arr: Message[] = []
		if(messages instanceof Array) {
			arr = messages
		} else {
			arr = [messages]
		}

		return arr.map( message => {
			return new Promise((res, rej) => {
				let q = {
					guildID: message.guild.id,
					channelID: message.channel.id,
					messageID: message.id,
				}
				let documents = this.db_messagedata.findObjects(q)
				let doc: MessageDataRecord = documents.length !== 0 ? documents[0] : {
					guildID: message.guild.id, 
					channelID: message.channel.id,
					messageID: message.id,
					data: {}
				}
				let pre = JSON.stringify(doc.data)
				process(doc.data, message).then( ret => {
					if (pre !== JSON.stringify(doc.data))  {
						if(documents.length === 0) {
							this.db_messagedata.insert(doc)
						} else {
						 	this.db_messagedata.update(doc)
						}
					}
					res({ ret, message })
				})
			})
		})
	}

	private trackers: Map<string, string>

	track(messages: Message | Message[], name: string) {
		let arr: Message[] = []
		if(messages instanceof Array) {
			arr = messages
		} else {
			arr = [messages]
		}

		arr.forEach( message => {
			let _name = this.trackers.get(name)
			console.log(`tracking '${message.id}' with '${name}'`)
			if (_name === undefined) return

			((this as any)[_name] as MessageTracker).init(message)
			this.db_trackers.insert({
				guildID: message.guild.id,
				channelID: message.channel.id,
				messageID: message.id,

				tracker: name
			})
		})
	}

	/** DO NOT OVERRIDE */
	_addTracker(name: string, key: string) {
		let proto = Object.getPrototypeOf(this)
		if(proto.trackers === this.trackers) {
			this.trackers = new Map<string, string>(proto.trackers)
		}
		if(this.trackers === undefined)
			this.trackers = new Map()
		this.trackers.set(name, key)
	}

	getTrackers(message: Message): Promise<MessageTracker[]> {
		return new Promise((resolve, reject) => {
			let docs = this.db_trackers.findObjects({
				guildID: message.guild.id,
				channelID: message.channel.id,
				messageID: message.id,
			})


			resolve(docs.map((doc) => {
				let _name = this.trackers.get(doc.tracker)
				if (_name === undefined) return;
				return (this as any)[_name]
			}))
		})

	}
	_onMessageDelete(message: Message) {
		this.getTrackers(message).then( (value) => {
			value.forEach( (value) => { value.onMessageDelete(message) } )
		})
		this.onMessageDelete(message)
	}
	_onMessageDeleteBulk(messages: Collection<Snowflake, Message>) {
		messages.forEach( (message: Message, key: string) => {
			this.getTrackers(message).then((value) => {
				value.forEach((value) => { value.onMessageDelete(message) } )
			})
		})
		this.onMessageDeleteBulk(messages)
	}
	_onMessageReactionAdd(messageReaction: MessageReaction, user: User) {
		this.getTrackers(messageReaction.message).then( (value) => {
			value.forEach( (value) => { value.onMessageReactionAdd(messageReaction, user) } )
		})
		this.onMessageReactionAdd(messageReaction, user)
	}
	_onMessageReactionRemove(messageReaction: MessageReaction, user: User) {
		this.getTrackers(messageReaction.message).then( (value) => {
			value.forEach( (value) => { value.onMessageReactionRemove(messageReaction, user) } )
		})
		this.onMessageReactionRemove(messageReaction, user)
	}
	_onMessageReactionRemoveAll(message: Message) {
		this.getTrackers(message).then( (value) => {
			value.forEach( (value) => { value.onMessageReactionRemoveAll(message) } )
		})
		this.onMessageReactionRemoveAll(message)
	}
	_onMessageUpdate(oldMessage: Message, newMessage: Message) {
		this.getTrackers(oldMessage).then((value) => {
			value.forEach((value) => { value.onMessageUpdate(oldMessage, newMessage) })
		})

		let docs = this.db_trackers.findObjects({
			guildID: oldMessage.guild.id,
			channelID: oldMessage.channel.id,
			messageID: oldMessage.id
		})

		docs.forEach(v => {
			v.guildID = newMessage.guild.id;
			v.channelID = newMessage.channel.id;
			v.messageID = newMessage.id;

			this.db_trackers.insert(v)
		})

		this.onMessageUpdate(oldMessage, newMessage)
	}

	@tracker("confirm")
	helpTracker = new MessageTracker(this, t => {
		t.setButton('👍', 
			(db: MessageData, message: Message, user: User) => {
				return message.delete()
			},
			() => { return Promise.resolve(true) }
		)
	})
}

export class MessageTracker {
	constructor(module: BotModule, callback: (v: MessageTracker) => void) {
		this.module = module
		callback(this)
	}

	setButton(emoji: string, click: (db: MessageData, message: Message, user: User) => Promise<any>, enable: (db: MessageData, message: Message) => Promise<boolean> = (m) => { return Promise.resolve(true) }) {
		this.buttons.set(emoji, { enable: enable, click: click })
	}

	private module: BotModule
	private buttons = new Map<string, { enable: (db: MessageData, message: Message) => Promise<boolean>, click: (db: MessageData, message: Message, user: User) => Promise<any> }>()

	init(message: Message) {
		this.addButtonReactions(message)
	}

	addButtonReactions(message: Message) {
		if (!message.channel.messages.exists("id", message.id)) return;
		message.reactions.forEach( v => {
			let button = this.buttons.get(v.emoji.name)
			if(button === undefined) {
				v.remove()
			} else {
				this.module.msgData(message, db => {
					return button!!.enable(db, message).then((enabled) => {
						if (enabled) {
							v.users.forEach((value) => {
								if (value.id == message.client.user.id) return;
								v.remove(value)
							})
						} else {
							v.remove()
						}
					});
				})
			}
		})
		this.buttons.forEach((value, key) => {
			this.module.msgData(message, db => {
				return value.enable(db, message).then((enabled) => {
					if (enabled) {
						let e = message.client.emojis.find("name", key)
						if (e !== null) {
							message.react(e).catch((err) => {
								console.log(err)
							})
						} else {
							message.react(key).catch((err) => {
								console.log(err)
							})
						}
					}
				});
			})
		});
	}

	onMessageDelete(message: Message) {

	}

	onMessageDeleteBulk(messages: Collection<Snowflake, Message>) { 
		messages.forEach(v => this.onMessageDelete(v))
	}

	onMessageReactionAdd(messageReaction: MessageReaction, user: User) {
		const button = this.buttons.get(messageReaction.emoji.name)
		if(button != undefined) {
			this.module.msgData(messageReaction.message, db => {
				return button.enable(db, messageReaction.message).then((enabled) => {
					if (enabled) {
						messageReaction.remove(user)
						this.module.msgData(messageReaction.message, data => {
							return button.click(data, messageReaction.message, user).then(() => {
								this.addButtonReactions(messageReaction.message);
							})
						})
					} else {
						messageReaction.remove()
					}
				});
			});
		} else {
			messageReaction.remove()
		}
	}
	onMessageReactionRemove(messageReaction: MessageReaction, user: User): boolean { return false; }
	onMessageReactionRemoveAll(message: Message): boolean { return false; }
	onMessageUpdate(oldMessage: Message, newMessage: Message): boolean { return false; }

}

export class CommandParameters {
	[key: string] : any
	positional: string[] = []
	parsed: any[] = []

	private i = 0;
	pop(): string {
		if(this.i >= this.positional.length) {
			return ""
		}
		return this.positional[this.i++]
	}
	popParsed(): any {
		if(this.i >= this.parsed.length) {
			return {}
		}
		return this.parsed[this.i++]
	}

	peek(): string {
		if(this.i >= this.positional.length) {
			return ""
		}
		return this.positional[this.i]
	}
	peekParsed(): any {
		if(this.i >= this.parsed.length) {
			return {}
		}
		return this.parsed[this.i]
	}
}

export function command<T extends BotModule>(info: { names: string[], flags?: string[], help: string[], desc: string, dm?: boolean}) {
	return (target: T, key: string, descriptor: PropertyDescriptor) => {
		target._addCommand({
			method: key,
			names: info.names,
			flags: ( info.flags === undefined ? [] : info.flags ),
			help: info.help,
			dm: info.dm === undefined ? false : info.dm,
			desc: info.desc
		}, Reflect.getMetadata("design:paramtypes", target, key));
	}
}

export function tracker<T extends BotModule>(name: string) {
	return (target: T, key: string) => {
		target._addTracker(name, key)
	}
}

class MessageIdentifier {
	guildID: Snowflake;
	channelID: Snowflake;
	messageID: Snowflake;

	constructor(message: Message) {
		this.guildID = message.guild.id;
		this.channelID = message.channel.id;
		this.messageID = message.id;
	}
}
type TrackerRecord = {
	guildID: Snowflake
	channelID: Snowflake
	messageID: Snowflake

	tracker: string
}
type MessageDataRecord = {
	guildID: Snowflake
	channelID: Snowflake
	messageID: Snowflake

	data: MessageData
}
export class MessageData { [key: string]: any }

export type CommandDefinition = {
	method: string,
	names: string[],
	flags: string[],
	help: string[],
	desc: string,
	dm: boolean
}