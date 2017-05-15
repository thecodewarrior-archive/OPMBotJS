import { Client, Channel, ClientUserSettings, Emoji, Guild, User, GuildMember, Collection, Snowflake, Message, MessageReaction, Role, UserResolvable } from 'discord.js';
import * as EventEmitter from "events";

export class BotModule {
	private client: Client;

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

}
