import * as fs from "fs";
import * as path from "path";
import * as discord from "discord.js";

import { BotModule } from './module';
import { Channel, ClientUserSettings, Emoji, Guild, User, GuildMember, Collection, Snowflake, Message, MessageReaction, Role, UserResolvable } from 'discord.js';

let recursiveReaddir: (path: string, ignore: Array<string | ( (file: string, stats: fs.Stats) => boolean )>, fun: (err: any, files: string[]) => void) => void = require('recursive-readdir')
require('ts-node').register({ project: path.join(__dirname, ".."), cache: false, fast: true})

console.log("Starting...");
var client = new discord.Client();

var modules: { [index: string]: BotModule; } = {};

//#region events
client.on('channelCreate', (channel: Channel) => {
	for(var m in modules) {
		modules[m].onChannelCreate(channel);
	}
});
client.on('channelDelete', (channel: Channel) => {
	for(var m in modules) {
		modules[m].onChannelDelete(channel);
	}
});
client.on('channelPinsUpdate', (channel: Channel, time: Date) => {
	for(var m in modules) {
		modules[m].onChannelPinsUpdate(channel, time);
	}
});
client.on('channelUpdate', (oldChannel: Channel, newChannel: Channel) => {
	for(var m in modules) {
		modules[m].onChannelUpdate(oldChannel, newChannel);
	}
});
client.on('clientUserSettingsUpdate', (clientUserSettings: ClientUserSettings) => {
	for(var m in modules) {
		modules[m].onClientUserSettingsUpdate(clientUserSettings);
	}
});
client.on('debug', (info: string) => {
	for(var m in modules) {
		modules[m].onDebug(info);
	}
});
client.on('disconnect', (event: CloseEvent) => {
	for(var m in modules) {
		modules[m].onDisconnect(event);
	}
});
client.on('emojiCreate', (emoji: Emoji) => {
	for(var m in modules) {
		modules[m].onEmojiCreate(emoji);
	}
});
client.on('emojiDelete', (emoji: Emoji) => {
	for(var m in modules) {
		modules[m].onEmojiDelete(emoji);
	}
});
client.on('emojiUpdate', (oldEmoji: Emoji, newEmoji: Emoji) => {
	for(var m in modules) {
		modules[m].onEmojiUpdate(oldEmoji, newEmoji);
	}
});
client.on('guildBanAdd', (guild: Guild, user: User) => {
	for(var m in modules) {
		modules[m].onGuildBanAdd(guild, user);
	}
});
client.on('guildBanRemove', (guild: Guild, user: User) => {
	for(var m in modules) {
		modules[m].onGuildBanRemove(guild, user);
	}
});
client.on('guildCreate', (guild: Guild) => {
	for(var m in modules) {
		modules[m].onGuildCreate(guild);
	}
});
client.on('guildDelete', (guild: Guild) => {
	for(var m in modules) {
		modules[m].onGuildDelete(guild);
	}
});
client.on('guildMemberAdd', (member: GuildMember) => {
	if(member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onGuildMemberAdd(member);
	}
});
client.on('guildMemberAvailable', (member: GuildMember) => {
	if(member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onGuildMemberAvailable(member);
	}
});
client.on('guildMemberRemove', (member: GuildMember) => {
	if(member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onGuildMemberRemove(member);
	}
});
client.on('guildMembersChunk', (members: Collection<Snowflake, GuildMember>, guild: Guild) => {
	for(var m in modules) {
		modules[m].onGuildMembersChunk(members, guild);
	}
});
client.on('guildMemberSpeaking', (member: GuildMember, speaking: boolean) => {
	if(member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onGuildMemberSpeaking(member, speaking);
	}
});
client.on('guildMemberUpdate', (oldMember: GuildMember, newMember: GuildMember) => {
	for(var m in modules) {
		modules[m].onGuildMemberUpdate(oldMember, newMember);
	}
});
client.on('guildUnavailable', (guild: Guild) => {
	for(var m in modules) {
		modules[m].onGuildUnavailable(guild);
	}
});
client.on('guildUpdate', (oldGuild: Guild, newGuild: Guild) => {
	for(var m in modules) {
		modules[m].onGuildUpdate(oldGuild, newGuild);
	}
});
client.on('message', (message: Message) => {
	if(message.member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m]._onMessage(message);
	}
});
client.on('messageDelete', (message: Message) => {
	if(message.member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onMessageDelete(message);
	}
});
client.on('messageDeleteBulk', (messages: Collection<Snowflake, Message>) => {
	for(var m in modules) {
		modules[m].onMessageDeleteBulk(messages);
	}
});
client.on('messageReactionAdd', (messageReaction: MessageReaction, user: User) => {
	if(user.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onMessageReactionAdd(messageReaction, user);
	}
});
client.on('messageReactionRemove', (messageReaction: MessageReaction, user: User) => {
	if(user.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onMessageReactionRemove(messageReaction, user);
	}
});
client.on('messageReactionRemoveAll', (message: Message) => {
	if(message.member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onMessageReactionRemoveAll(message);
	}
});
client.on('messageUpdate', (oldMessage: Message, newMessage: Message) => {
	if(oldMessage.member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onMessageUpdate(oldMessage, newMessage);
	}
});
client.on('presenceUpdate', (oldMember: GuildMember, newMember: GuildMember) => {
	if(oldMember.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onPresenceUpdate(oldMember, newMember);
	}
});
client.on('reconnecting', () => {
	for(var m in modules) {
		modules[m].onReconnecting();
	}
});
client.on('resume', (replayed: number) => {
	for(var m in modules) {
		modules[m].onResume(replayed);
	}
});
client.on('roleCreate', (role: Role) => {
	for(var m in modules) {
		modules[m].onRoleCreate(role);
	}
});
client.on('roleDelete', (role: Role) => {
	for(var m in modules) {
		modules[m].onRoleDelete(role);
	}
});
client.on('roleUpdate', (oldRole: Role, newRole: Role) => {
	for(var m in modules) {
		modules[m].onRoleUpdate(oldRole, newRole);
	}
});
client.on('typingStart', (channel: Channel, user: User) => {
	if(user.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onTypingStart(channel, user);
	}
});
client.on('typingStop', (channel: Channel, user: User) => {
	if(user.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onTypingStop(channel, user);
	}
});
client.on('userNoteUpdate', (user: UserResolvable, oldNote: string, newNote: string) => {
	for(var m in modules) {
		modules[m].onUserNoteUpdate(user, oldNote, newNote);
	}
});
client.on('userUpdate', (oldUser: User, newUser: User) => {
	if(oldUser.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onUserUpdate(oldUser, newUser);
	}
});
client.on('voiceStateUpdate', (oldMember: GuildMember, newMember: GuildMember) => {
	if(oldMember.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m].onVoiceStateUpdate(oldMember, newMember);
	}
});
client.on('warn', (info: string) => {
	for(var m in modules) {
		modules[m].onWarn(info);
	}
});
//#endregion

function loadModule(file: string) {
	console.log("Loading module `" + file + "`")
	let exports: any = require(file);
	for (var k in exports) {
		var botmodule = new exports[k](client);

		let existing = modules[file];
		modules[file] = botmodule;
		if (existing !== undefined) {
			botmodule.transfer(existing)
		}
	}
}

client.on('ready', () => {
	let check = "//module"
	recursiveReaddir(path.join(__dirname, "../modules"), [], (err: any, files: string[]) => {
		for(var i in files) {
			let file = files[i]
			let firstbit = fs.readFileSync(file, 'utf8').toString().substr(0, check.length) 
			if(firstbit === check) {
				loadModule(file)
			}
		}
	})
});

console.log("Logging In...");
var token = fs.readFileSync(path.join(__dirname, "token.txt"), 'utf8').toString().trim();
console.log("`" + token + "`");
client.login(token);
