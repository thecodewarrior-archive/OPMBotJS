import * as fs from "fs";
import * as path from "path";
import * as discord from "discord.js";
import * as watch from "watch";
import { BaseModule } from "./base_module"

import { BotModule } from './module';
import { Channel, ClientUserSettings, Emoji, Guild, User, GuildMember, Collection, Snowflake, Message, MessageReaction, Role, UserResolvable } from 'discord.js';

let recursiveReaddir: (path: string, ignore: Array<string | ( (file: string, stats: fs.Stats) => boolean )>, fun: (err: any, files: string[]) => void) => void = require('recursive-readdir')

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
		modules[m]._onMessageDelete(message);
	}
});
client.on('messageDeleteBulk', (messages: Collection<Snowflake, Message>) => {
	for(var m in modules) {
		modules[m]._onMessageDeleteBulk(messages);
	}
});
client.on('messageReactionAdd', (messageReaction: MessageReaction, user: User) => {
	if(user.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m]._onMessageReactionAdd(messageReaction, user);
	}
});
client.on('messageReactionRemove', (messageReaction: MessageReaction, user: User) => {
	if(user.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m]._onMessageReactionRemove(messageReaction, user);
	}
});
client.on('messageReactionRemoveAll', (message: Message) => {
	if(message.member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m]._onMessageReactionRemoveAll(message);
	}
});
client.on('messageUpdate', (oldMessage: Message, newMessage: Message) => {
	if(oldMessage.member.id === client.user.id) {
		return;
	}
	for(var m in modules) {
		modules[m]._onMessageUpdate(oldMessage, newMessage);
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

// from `http://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate/14801711#14801711`
/**
 * Removes a module from the cache
 */
function purgeCache(moduleName: string) {
    // Traverse the cache looking for the files
    // loaded by the specified module name
    searchCache(moduleName, (mod) => {
        delete require.cache[mod.id];
    });

    // Remove cached paths to the module.
    // Thanks to @bentael for pointing this out.
    Object.keys((module.constructor as any)._pathCache).forEach(function(cacheKey) {
        if (cacheKey.indexOf(moduleName)>0) {
            delete (module.constructor as any)._pathCache[cacheKey];
        }
    });
};

/**
 * Traverses the cache to search for all the cached
 * files of the specified module name
 */
function searchCache(moduleName: string, callback: (child: any) => void) {
    // Resolve the module identified by the specified name
    var mod: any = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function traverse(mod) {
            // Go over each of the module's children and
            // traverse them
            mod.children.forEach((child: any) => {
                traverse(child);
            });

            // Call the specified callback providing the
            // found cached module
            callback(mod);
        }(mod));
    }
};

modules["base"] = new BaseModule(client, modules)
modules["base"].transfer(undefined)

const markerLine = "//module"

function loadModule(file: string) {
	console.log("Loading module `" + file + "`")
	purgeCache(file)
	let exports: any = require(file);
	for (var k in exports) {
		var botmodule = new exports[k](client);

		let existing = modules[file];
		modules[file] = botmodule;
		botmodule.transfer(existing)
	}
}

function tryFile(file: string) {
	if(!fs.existsSync(file)) {
		delete modules[file]
	} else {
		let firstbit = fs.readFileSync(file, 'utf8').toString().substr(0, markerLine.length)
		if (firstbit === markerLine) {
			loadModule(file)
		}
	}
}

client.on('ready', () => {
	let dir = path.join(__dirname, "../modules")
	recursiveReaddir(dir, [], (err: any, files: string[]) => {
		for(var i in files) {
			tryFile(files[i])
		}
	})
	watch.watchTree(dir, (f: any, curr: fs.Stats, prev: fs.Stats) => {
		if(typeof f === "string") {
			tryFile(f)
		}
	})
});

console.log("Logging In...");
var token = fs.readFileSync(path.join(__dirname, "token.txt"), 'utf8').toString().trim();
console.log("`" + token + "`");
client.login(token);
