import { Message, Channel, StringResolvable, MessageOptions, Collection, Snowflake, ColorResolvable, FileOptions, GuildMember, User, Guild, Role } from 'discord.js';
import { BotModule } from './bot';
import { MessageData } from '../../../app/module';

export class DataKey<T> {
    constructor(public readonly name: string, private readonly creator?: (args: any[]) => T) { }
    create(...args: any[]): T { 
        if(this.creator === undefined) {
            throw Error("Creator undefined for DataKey with name `" + name + "`")
        }
        return this.creator(args) 
    }
}
export class PermissionNode { constructor(public readonly name: string) { } }

type DataRecord = { key: DataKey<any>, identifier: any, value: any } 
export abstract class Context<W> {
    constructor(readonly typeKey: DataKey<any>, readonly value: W, readonly module: BotModule) {}

    getData<T>(key: DataKey<T>): T {
        let coll = this.module.data(this.typeKey)
        let ident = this.identifier()
        let val = coll.findOne( { identifier: ident, key: key })
        if(val === null) {
            val = { identifier: ident, key: key, value: key.create() }
            coll.insert(val)
        }
        return val.value
    }

    setData<T>(key: DataKey<T>, data: T): this {
        let coll = this.module.data(this.typeKey)
        let ident = this.identifier()
        coll.removeWhere({key: key, identifier: ident})
        coll.insert({ key: key, identifier: ident, value: data })
        return this
    }

    updateData(key: DataKey<any>): void {
        let coll = this.module.data(this.typeKey)
        coll.update(this.getData(key))
    }

    mutateData<T>(key: DataKey<T>, f: (d: T) => void): this {
        let dat = this.getData(key)
        f(dat)
        this.updateData(key)
        return this
    }

    withData<T>(key: DataKey<T>, f: (d: T) => void): this {
        let dat = this.getData(key)
        return this
    }

    identifier(): any {
        return this.typeKey.create(this)
    }
}

type ButtonData = { handler: string, emoji: string}
type EventHandlerData = { handler: string, event: string}
export class MessageContext extends Context<Message> {
    static buttonKey: DataKey<ButtonData[]> = new DataKey<ButtonData[]>("button")
    static eventKey: DataKey<EventHandlerData[]> = new DataKey<EventHandlerData[]>("button")
    static typeKey: DataKey<any> = new DataKey<any>("message", args => {
        let message = args[0] as Message
        return 
    })

    constructor(value: Message, module: BotModule) { super(MessageContext.typeKey, value, module) }

    channel(): ChannelContext { return this.module.context(this.value.channel) }
    sender(): MemberContext { return this.module.context(this.value.member) }
    reply(content: StringResolvable, options?: MessageOptions): Promise<MessageContext>
    reply(options: MessageOptions): Promise<MessageContext>
    reply(content?: StringResolvable, options?: MessageOptions): Promise<MessageContext> {
        return this.value.channel.send(content, options).then( v => {
            if(v instanceof Array) v = v[0] // dirty hack
            return this.module.context(v as Message)
        })
    }

    addButton(handler: string, emoji?: string): this {
        const meta = this.module.getMetadata().get(BotModule.buttonMetadataKey).find("name", handler)
        if(meta === null) {
            console.log(`No such button handler ${handler}`)
        } else {
            this.mutateData(MessageContext.buttonKey, d => {
                d.push({ 
                    handler: handler, 
                    emoji: emoji || meta.defaultEmoji 
                })
            })
        }
        return this
    }
    removeButton(handler: string, emoji?: string): this {
        const meta = this.module.getMetadata().get(BotModule.buttonMetadataKey).find("name", handler)
        if(meta === null) {
            console.log(`No such button handler ${handler}`)
        } else {
            this.mutateData(MessageContext.buttonKey, d => {
                let i = d.indexOf({ 
                    handler: handler, 
                    emoji: emoji || meta.defaultEmoji 
                })

                if(i > -1) {
                    d.splice(i, 1)
                }
            })
        }
        return this
    }
    addEventHandler(handler: string, event?: string): this {
        const meta = this.module.getMetadata().get(BotModule.eventMetadataKey).find("name", handler)
        if(meta === null) {
            console.log(`No such button handler ${handler}`)
        } else {
            this.mutateData(MessageContext.eventKey, d => {
                d.push({ 
                    handler: handler, 
                    event: event || meta.defaultEvent
                })
            })
        }
        return this
    }
    removeEventHandler(handler: string, event?: string): this {
        const meta = this.module.getMetadata().get(BotModule.eventMetadataKey).find("name", handler)
        if(meta === null) {
            console.log(`No such button handler ${handler}`)
        } else {
            this.mutateData(MessageContext.eventKey, d => {
                let i = d.indexOf({ 
                    handler: handler, 
                    event: event || meta.defaultEvent
                })

                if(i > -1) {
                    d.splice(i, 1)
                }
            })
        }
        return this
    }
    delete(): this {
        this.value.delete()
        return this
    }
    isDeleted(): boolean {
        return this.value.channel.messages.find("id", this.value.id) !== null
    }
}

export abstract class OwnMessageContext extends MessageContext {
    abstract edit(): WIPMessageContext
}

export abstract class WIPMessageContext extends MessageContext {
    abstract onReply(member: GuildMember, handler: string): this

    abstract embed(): WIPEmbedMessageContext

    abstract send(): void
}

export abstract class WIPEmbedMessageContext extends WIPMessageContext {
    abstract addBlankField(inline?: boolean): this;
    abstract addField(name: StringResolvable, value: StringResolvable, inline?: boolean): this;
    abstract attachFile(file: FileOptions | string): this;
    abstract setAuthor(name: StringResolvable, icon?: string, url?: string): this;
    abstract setColor(color: ColorResolvable): this;
    abstract setDescription(description: StringResolvable): this;
    abstract setFooter(text: StringResolvable, icon?: string): this;
    abstract setImage(url: string): this;
    abstract setThumbnail(url: string): this;
    abstract setTimestamp(timestamp?: Date): this;
    abstract setTitle(title: StringResolvable): this;
    abstract setURL(url: string): this;
}

export abstract class ChannelContext extends Context<Channel> {
    abstract compose(): WIPMessageContext
    abstract messages(find: (c: Collection<Snowflake, Message>) => Message): MessageContext
    abstract messages(find: (c: Collection<Snowflake, Message>) => Message | null): MessageContext | null
}

export abstract class UserContext extends Context<User> {
    abstract member(guild: Guild): MemberContext | null
    abstract dm(): ChannelContext
}

export abstract class MemberContext extends Context<GuildMember> {
    abstract user(): UserContext
    abstract guild(): GuildContext
    abstract roles(): RoleContext[]
    abstract hasPermission(perm: PermissionNode): boolean
    abstract setPermission(perm: PermissionNode, value: boolean | null): void
    abstract getPermissionSource(perm: PermissionNode): this | RoleContext
}

export abstract class GuildContext extends Context<Guild> {
    abstract roles(): Collection<Snowflake, RoleContext>
    abstract members(): Collection<Snowflake, MemberContext>
}

export abstract class RoleContext extends Context<Role> {
    abstract hasPermission(perm: PermissionNode): boolean
    abstract setPermission(perm: PermissionNode, value: boolean): void
}
