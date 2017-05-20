import { Client, Channel, ClientUserSettings, Emoji, Guild, User, GuildMember, Collection, Snowflake, Message, MessageReaction, Role, UserResolvable, DMChannel, GroupDMChannel } from 'discord.js';
import * as EventEmitter from "events";
import "reflect-metadata";
import { ParsedArgs} from "minimist";
import * as minimist from "minimist";
import * as fs from "fs";
import * as path from "path";
import * as tp from "typed-promisify";
import Datastore = require("nedb");
const mkdirp: any = require("mkdirp");

export class BotModule {
	protected client: Client;
	protected readonly data: any;
	protected readonly env: any;
	protected readonly db: Datastore;

	readonly modulename: string;
	readonly moduledir: string;

	constructor(client: Client) {
		this.client = client;

		this.modulename = this.constructor.name;
		this.moduledir = path.join(__dirname, "../module_data/data", this.modulename)
		let jsonFile = path.join(__dirname, "../module_data/json", this.modulename + ".json")
		let envFile = path.join(__dirname, "../module_data/env", this.modulename + ".json")
		let dbFile = path.join(__dirname, "../module_data/db", this.modulename)

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

		this.db = new Datastore({filename: dbFile, autoload: true})
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


	private commands: { [key: string] : { method: string, flags: string[], help: string[], dm: boolean } }
	
	protected parseValue(message: Message, v: any): Promise<any> { return Promise.resolve(v) }

	/** DO NOT OVERRIDE */
	_addCommand(names: string[], key: { method: string, flags: string[], help: string[], dm: boolean }, parameters: Function[]) {
		if(this.commands == undefined) this.commands = {}
		if(parameters[0] !== Message) {
			throw "First parameter of every command method must be a `Message` - the message sent"
		}
		if(parameters[1] !== CommandParameters) {
			throw "Second parameter of every command method must be a `CommandParameters` - the parsed command line arguments"
		}
		key.flags.push("h")
		for(var i in names) {
			this.commands[names[i]] = key
		}
	}

	readonly PREFIX_REGEX = /^!(\w+)/
	readonly PREFIX = "!"
	/** DO NOT OVERRIDE */
	_onMessage(message: Message) {
		if(this.commands === undefined) this.commands = {}
		let commandMatch = message.content.match(this.PREFIX_REGEX)
		const commandName = commandMatch === null ? null : commandMatch[1]

		if(commandName !== null && this.commands[commandName] !== undefined) {
			let _split = message.content.substr(commandMatch!![0].length).match(/(?:[^\s"]+|"(?:[^"]|\\")*")+/g)
			let split = (_split == null ? [] : _split)

			if((message.channel instanceof DMChannel || message.channel instanceof GroupDMChannel) && !this.commands[commandName].dm) {
				message.channel.send(`I'm sorry, \`${commandName}\` does not seem to work in dms.\n\nIf you would like this feature in particular please contact @thecodewarrior#6629`)
				return;
			}
			let _args = minimist(split, {boolean: this.commands[commandName].flags});
			if(!_args.h) {
				let args = new CommandParameters();

				let promises: Promise<any>[] = []

				for (var k in _args) {
					let v = _args[k]
					if (k === "_" && v instanceof Array) {
						args.positional = Array.of<string>(...this.processStrings(v))
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
					(this as any)[this.commands[commandName].method](message, args)
				}).catch((reason: any) => {
					console.log("error in command! Message text: `" + message.content + "`")
					console.log(reason)
				})
			} else {
				message.channel.send("```\n" + this.commands[commandName].help.join('\n').replace(/%/g, this.PREFIX) + "\n```").then( dat => {
					let msg = dat as Message
					this.track(msg, "confirm")
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
				o[i] = s.substr(1, s.length-2)
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
			if (v.startsWith('"') && v.endsWith('"')) {
				return Promise.resolve(v.substr(1, v.length-2))
			}
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

	trackers: Map<string, string>
	activeTrackers = new Map<{ guild: Snowflake, channel: Snowflake, message: Snowflake }, string>()

	msgData<T>(message: Message, process: (data: any) => Promise<T>): Promise<T> {
		return new Promise( (res, rej) => {
			let q = {
				type: "messageData",
				guildID: message.guild.id,
				channelID: message.channel.id,
				messageID: message.id,
			}
			this.db.findOne<MessageDataRecord>(q, (err, doc) => {
				if (doc === null)
					doc = {
						type: "messageData",
						guildID: message.guild.id,
						channelID: message.channel.id,
						messageID: message.id,
						data: {}
					}
				let pre = JSON.stringify(doc.data)
				process(doc.data).then( (ret) => {
					if (pre !== JSON.stringify(doc.data)) {
						this.db.update(q, doc, { upsert: true }, () => {
							res(ret)
						})
					} else {
						res(ret)
					}
				})
			})
		})
	}

	track(message: Message, name: string) {
		let _name = this.trackers.get(name)
		console.log(`tracking '${message.id}' with '${name}'`)
		if(_name === undefined) return

		((this as any)[_name] as MessageTracker).init(message)
		this.db.insert({
			type: "tracker",
			guildID: message.guild.id,
			channelID: message.channel.id,
			messageID: message.id,

			tracker: name
		})
	}

	/** DO NOT OVERRIDE */
	_addTracker(name: string, key: string) {
		if(this.trackers === undefined)
			this.trackers = new Map()
		this.trackers.set(name, key)
	}

	getTrackers(message: Message): Promise<MessageTracker[]> {
		return new Promise((resolve, reject) => {
			this.db.find<TrackerRecord>({
				type: "tracker",
				guildID: message.guild.id,
				channelID: message.channel.id,
				messageID: message.id,
			}, (err, docs) => {
				resolve(docs.map((doc) => {
					let _name = this.trackers.get(doc.tracker)
					if (_name === undefined) return;
					return (this as any)[_name]
				}))
			})
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

		this.db.find<TrackerRecord>({
			type: "tracker",
			guildID: oldMessage.guild.id,
			channelID: oldMessage.channel.id,
			messageID: oldMessage.id
		}, (err, docs) => {
			docs.forEach(v => {
		v.guildID = newMessage.guild.id;
		v.channelID = newMessage.channel.id;
		v.messageID = newMessage.id;

				this.db.insert(v)
			})
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
	consume(): string {
		if(this.i >= this.positional.length) {
			return ""
		}
		return this.positional[this.i++]
	}
	consumeParsed(): any {
		if(this.i >= this.parsed.length) {
			return {}
		}
		return this.parsed[this.i++]
	}
}

export function command(info: { names: string[], flags?: string[], help: string[], dm?: boolean}) {
	return (target: BotModule, key: string, descriptor: PropertyDescriptor) => {
		target._addCommand(info.names, {
			method: key,
			flags: ( info.flags === undefined ? [] : info.flags ),
			help: info.help,
			dm: info.dm === undefined ? false : info.dm
		}, Reflect.getMetadata("design:paramtypes", target, key));
	}
}

export function tracker(name: string) {
	return (target: BotModule, key: string) => {
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
	type: "tracker"
	guildID: Snowflake
	channelID: Snowflake
	messageID: Snowflake

	tracker: string
}
type MessageDataRecord = {
	type: "messageData"
	guildID: Snowflake
	channelID: Snowflake
	messageID: Snowflake

	data: MessageData
}
export class MessageData { [key: string]: any }