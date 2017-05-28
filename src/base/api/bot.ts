import { Channel, ClientUserSettings, Emoji, User, Guild, GuildMember, Message, Collection, MessageReaction, Snowflake, Role, UserResolvable } from 'discord.js';
import { GuildContext, RoleContext, MemberContext, UserContext, ChannelContext, MessageContext, DataKey } from './contexts';
import * as path from 'path';
import { I18n } from './i18n';
import * as loki from 'lokijs';

const caller: (depth?: number) => string = require('caller')

export abstract class DiscordEvents {
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

type ButtonMetadata = { name: string, defaultEmoji: string, handler: string }
type EventMetadata = { name: string, defaultEvent: string, handler: string }
export abstract class BotModule extends DiscordEvents {
    static buttonMetadataKey = new DataKey<ButtonMetadata>("button")
    static eventMetadataKey = new DataKey<EventMetadata>("button")

    public readonly dir: string
    public readonly i18n: I18n
    public readonly database: Loki
    public readonly name: string

    constructor() {
        super()
        let callerFile = caller()
        this.name = path.basename(path.dirname(callerFile))
        this.dir = path.join(__dirname, "../../../data/modules/" + this.name)
        this.i18n = new I18n(path.join(path.join(this.dir, "lang.json")))
        this.database = new loki(path.join(this.dir, "database.json"))
    }

    transfer(other: BotModule) {}

    __(name: string, ...args: any[]): string {
        return this.i18n.__(name.split('.'), ...args) || name;
    }
    langRaw(name: string): any | undefined {
        return this.i18n.getRaw(name.split('.'))
    }

    context(message: Message): MessageContext 
    context(channel: Channel): ChannelContext 
    context(user: User): UserContext 
    context(member: GuildMember): MemberContext 
    context(role: Role): RoleContext 
    context(guild: Guild): GuildContext 

    context(it: Message | Channel | User | GuildMember | Role | Guild): MessageContext | ChannelContext | UserContext | MemberContext | RoleContext | GuildContext {
        if(it instanceof Message) return new MessageContext(it, this)
        // if(it instanceof Channel) return new ChannelContext(it, this)
        // if(it instanceof User) return new UserContext(it, this)
        // if(it instanceof GuildMember) return new MemberContext(it, this)
        // if(it instanceof Role) return new RoleContext(it, this)
        // if(it instanceof Guild) return new GuildContext(it, this)
        throw `WTF! ${it} isn't a valid context`
    }

    private datas = new Map<DataKey<any>, LokiCollection<any>>()
    private contexts = new Map<DataKey<any>, LokiCollection<any>>()

    data<T>(namespace: DataKey<T>): LokiCollection<T> {
        let coll = this.datas.get(namespace)
        if(coll === undefined) {
            coll = this.database.addCollection("namespace_" + namespace.name)
            this.datas.set(namespace, coll)
        }
        return coll
    }

    private metadata_: Metadata
    getMetadata(): Metadata {
		let proto = Object.getPrototypeOf(this)
		if(this.metadata_ === undefined) {
			this.metadata_ = new Metadata()
        } else if(proto.metadata_ === this.metadata_) {
			this.metadata_ = proto.metadata_.clone()
		}
        return this.metadata_
    }
}

export class Metadata {
    private map = new Map<DataKey<any>, Collection<string, any>>()

    get<T>(type: DataKey<T>): Collection<string, T> {
        let g = this.map.get(type)
        if(g !== undefined) return g;
        g = new Collection<string, T>()
        this.map.set(type, g)
        return g
    }

    clone(): Metadata {
        let n = new Metadata()
        this.map.forEach( (v, k) => {
            n.map.set(k, v.clone())
        })
        return n
    }
    
}

export function createMetadataMethodDecorator<T extends BotModule, D>(dataKey: DataKey<D>, data: D): MethodDecorator {
    return (target: T, key: string, descriptor: PropertyDescriptor) => {
		target.getMetadata().get(dataKey).set(key, data)
	}
}
