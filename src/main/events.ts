import { Client, Channel, ClientUserSettings, Emoji, Guild, User, GuildMember, Collection, Snowflake, Message, GuildChannel, MessageReaction, Role, UserResolvable } from 'discord.js';
import { BotModule } from '../base/api/bot';
import { handleCommand } from '../base/api/commands';

export default function hookEvents(client: Client, modules: { [key: string]: BotModule }, enabled: (module: BotModule, guild: Guild) => boolean) {
    //#region events
    client.on('channelCreate', (channel: Channel) => {
        for (var m in modules) {
            if(!(channel instanceof GuildChannel) || enabled(modules[m], channel.guild)) {
                modules[m].onChannelCreate(channel);
            }
        }
    });
    client.on('channelDelete', (channel: Channel) => {
        for (var m in modules) {
            if(!(channel instanceof GuildChannel) || enabled(modules[m], channel.guild)) {
                modules[m].onChannelDelete(channel);
            }
        }
    });
    client.on('channelPinsUpdate', (channel: Channel, time: Date) => {
        for (var m in modules) {
            if(!(channel instanceof GuildChannel) || enabled(modules[m], channel.guild)) {
                modules[m].onChannelPinsUpdate(channel, time);
            }
        }
    });
    client.on('channelUpdate', (oldChannel: Channel, newChannel: Channel) => {
        for (var m in modules) {
            if(!(oldChannel instanceof GuildChannel) || enabled(modules[m], oldChannel.guild)) {
                modules[m].onChannelUpdate(oldChannel, newChannel);
            }
        }
    });
    client.on('clientUserSettingsUpdate', (clientUserSettings: ClientUserSettings) => {
        for (var m in modules) {
            modules[m].onClientUserSettingsUpdate(clientUserSettings);
        }
    });
    client.on('debug', (info: string) => {
        for (var m in modules) {
            modules[m].onDebug(info);
        }
    });
    client.on('disconnect', (event: CloseEvent) => {
        for (var m in modules) {
            modules[m].onDisconnect(event);
        }
    });
    client.on('emojiCreate', (emoji: Emoji) => {
        for (var m in modules) {
            if(enabled(modules[m], emoji.guild)) {
                modules[m].onEmojiCreate(emoji);
            }
        }
    });
    client.on('emojiDelete', (emoji: Emoji) => {
        for (var m in modules) {
            if(enabled(modules[m], emoji.guild)) {
                modules[m].onEmojiDelete(emoji);
            }
        }
    });
    client.on('emojiUpdate', (oldEmoji: Emoji, newEmoji: Emoji) => {
        for (var m in modules) {
            if(enabled(modules[m], oldEmoji.guild)) {
                modules[m].onEmojiUpdate(oldEmoji, newEmoji);
            }
        }
    });
    client.on('guildBanAdd', (guild: Guild, user: User) => {
        for (var m in modules) {
            if(enabled(modules[m], guild)) {
                modules[m].onGuildBanAdd(guild, user);
            }
        }
    });
    client.on('guildBanRemove', (guild: Guild, user: User) => {
        for (var m in modules) {
            if(enabled(modules[m], guild)) {
                modules[m].onGuildBanRemove(guild, user);
            }
        }
    });
    client.on('guildCreate', (guild: Guild) => {
        for (var m in modules) {
            if(enabled(modules[m], guild)) {
                modules[m].onGuildCreate(guild);
            }
        }
    });
    client.on('guildDelete', (guild: Guild) => {
        for (var m in modules) {
            if(enabled(modules[m], guild)) {
                modules[m].onGuildDelete(guild);
            }
        }
    });
    client.on('guildMemberAdd', (member: GuildMember) => {
        if (member.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            if(enabled(modules[m], member.guild)) {
                modules[m].onGuildMemberAdd(member);
            }
        }
    });
    client.on('guildMemberAvailable', (member: GuildMember) => {
        if (member.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            if(enabled(modules[m], member.guild)) {
                modules[m].onGuildMemberAvailable(member);
            }
        }
    });
    client.on('guildMemberRemove', (member: GuildMember) => {
        if (member.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            if(enabled(modules[m], member.guild)) {
                modules[m].onGuildMemberRemove(member);
            }
        }
    });
    client.on('guildMembersChunk', (members: Collection<Snowflake, GuildMember>, guild: Guild) => {
        for (var m in modules) {
            if(enabled(modules[m], guild)) {
                modules[m].onGuildMembersChunk(members, guild);
            }
        }
    });
    client.on('guildMemberSpeaking', (member: GuildMember, speaking: boolean) => {
        if (member.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            if (enabled(modules[m], member.guild)) {
                modules[m].onGuildMemberSpeaking(member, speaking);
            }
        }
    });
    client.on('guildMemberUpdate', (oldMember: GuildMember, newMember: GuildMember) => {
        for (var m in modules) {
            if (enabled(modules[m], oldMember.guild)) {
                modules[m].onGuildMemberUpdate(oldMember, newMember);
            }
        }
    });
    client.on('guildUnavailable', (guild: Guild) => {
        for (var m in modules) {
            if (enabled(modules[m], guild)) {
                modules[m].onGuildUnavailable(guild);
            }
        }
    });
    client.on('guildUpdate', (oldGuild: Guild, newGuild: Guild) => {
        for (var m in modules) {
            if (enabled(modules[m], oldGuild)) {
                modules[m].onGuildUpdate(oldGuild, newGuild);
            }
        }
    });
    client.on('message', (message: Message) => { // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        if (message.member.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            let ch = message.channel
            if (!(ch instanceof GuildChannel) || enabled(modules[m], ch.guild)) {
                let mod = modules[m]
                if(!handleCommand(mod, message)) {
                    mod.onMessage(message);
                }
            }
        }
    });
    client.on('messageDelete', (message: Message) => {
        if (message.member.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            if (enabled(modules[m], message.guild)) {
                modules[m].onMessageDelete(message);
            }
        }
    });
    client.on('messageDeleteBulk', (messages: Collection<Snowflake, Message>) => {
        for (var m in modules) {
            messages.forEach( (v, k) => {
                if (enabled(modules[m], v.guild)) {
                    modules[m].onMessageDelete(v);
                }
            })
        }
    });
    client.on('messageReactionAdd', (messageReaction: MessageReaction, user: User) => {
        if (user.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            modules[m].onMessageReactionAdd(messageReaction, user);
        }
    });
    client.on('messageReactionRemove', (messageReaction: MessageReaction, user: User) => {
        if (user.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            let ch = messageReaction.message.channel
            if (!(ch instanceof GuildChannel) || enabled(modules[m], ch.guild)) {
                modules[m].onMessageReactionRemove(messageReaction, user);
            }
        }
    });
    client.on('messageReactionRemoveAll', (message: Message) => {
        if (message.member.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            let ch = message.channel
            if (!(ch instanceof GuildChannel) || enabled(modules[m], ch.guild)) {
                modules[m].onMessageReactionRemoveAll(message);
            }
        }
    });
    client.on('messageUpdate', (oldMessage: Message, newMessage: Message) => {
        if (oldMessage.member.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            let ch = oldMessage.channel
            if (!(ch instanceof GuildChannel) || enabled(modules[m], ch.guild)) {
                modules[m].onMessageUpdate(oldMessage, newMessage);
            }
        }
    });
    client.on('presenceUpdate', (oldMember: GuildMember, newMember: GuildMember) => {
        if (oldMember.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            if (enabled(modules[m], oldMember.guild)) {
                modules[m].onPresenceUpdate(oldMember, newMember);
            }
        }
    });
    client.on('reconnecting', () => {
        for (var m in modules) {
            modules[m].onReconnecting();
        }
    });
    client.on('resume', (replayed: number) => {
        for (var m in modules) {
            modules[m].onResume(replayed);
        }
    });
    client.on('roleCreate', (role: Role) => {
        for (var m in modules) {
            if (enabled(modules[m], role.guild)) {
                modules[m].onRoleCreate(role);
            }
        }
    });
    client.on('roleDelete', (role: Role) => {
        for (var m in modules) {
            if (enabled(modules[m], role.guild)) {
                modules[m].onRoleDelete(role);
            }
        }
    });
    client.on('roleUpdate', (oldRole: Role, newRole: Role) => {
        for (var m in modules) {
            if (enabled(modules[m], oldRole.guild)) {
                modules[m].onRoleUpdate(oldRole, newRole);
            }
        }
    });
    client.on('typingStart', (channel: Channel, user: User) => {
        if (user.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            modules[m].onTypingStart(channel, user);
        }
    });
    client.on('typingStop', (channel: Channel, user: User) => {
        if (user.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            if (!(channel instanceof GuildChannel) || enabled(modules[m], channel.guild)) {
                modules[m].onTypingStop(channel, user);
            }
        }
    });
    client.on('userNoteUpdate', (user: UserResolvable, oldNote: string, newNote: string) => {
        for (var m in modules) {
            modules[m].onUserNoteUpdate(user, oldNote, newNote);
        }
    });
    client.on('userUpdate', (oldUser: User, newUser: User) => {
        if (oldUser.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            modules[m].onUserUpdate(oldUser, newUser);
        }
    });
    client.on('voiceStateUpdate', (oldMember: GuildMember, newMember: GuildMember) => {
        if (oldMember.id === client.user.id) {
            return;
        }
        for (var m in modules) {
            if (enabled(modules[m], oldMember.guild)) {
                modules[m].onVoiceStateUpdate(oldMember, newMember);
            }
        }
    });
//#endregion
}