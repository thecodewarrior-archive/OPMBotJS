import { Client, Channel, ClientUserSettings, Emoji, Guild, User, GuildMember, Collection, Snowflake, Message, MessageReaction, Role, UserResolvable } from 'discord.js';
import * as EventEmitter from "events";
import "reflect-metadata";
import { ParsedArgs} from "minimist";
import * as minimist from "minimist";

export class BotModule {
	protected client: Client;

	constructor(client: Client) {
		this.client = client;
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

	_onMessage(message: Message) {
		let PREFIX = "$"
		if(!(message.content.length > 0 && message.content.substr(0, PREFIX.length) === PREFIX)) {
			this.onMessage(message)
			return
		}
		let text = message.cleanContent.split(/\s+/)[0].substr(PREFIX.length) // first word, sans prefix
		console.log("command: `" + text + "`")
		if(this.commands[text] !== undefined) {
			let args = minimist(message.content.split(/\s+/).slice(1), {boolean: this.commands[text].flags});
			(this as any)[this.commands[text].method](message, args)
		} else {
			this.onMessage(message)
		}
	}
}

export function command(info: { names: string[], flags: string[] }) {
	return (target: BotModule, key: string, descriptor: PropertyDescriptor) => {
		target._addCommand(info.names, { method: key, flags: info.flags }, Reflect.getMetadata("design:paramtypes", target, key));
	}
}