//module
import { BotModule, command, CommandParameters, tracker, MessageTracker } from '../app/module';
import { Message, Snowflake, User, GuildMember, Role, RichEmbed } from 'discord.js';
import { ParsedArgs } from 'minimist';
import { simpleTrackerPage } from '../app/simple_trackers';

export function perms(nodes: PermNode[]) {
    return (target: any) => {
		let name = target.constructor.name;
        nodes.forEach( v => v.name = name + "." + v.name)
        target._permissionnodes = nodes
    }
}

export type PermNode = {
    name: string
    desc: string 
}

export type Permissable = User | GuildMember | Role

export function has(perm: string, v: Permissable) {

}

export class PermissionManager extends BotModule {

    db_roles: LokiCollection<RolePerm>
    db_members: LokiCollection<MemberPerm>

    initCollections() {
        super.initCollections()
        this.db_roles = this.db.addCollection<RolePerm>("roles")
        this.db_members = this.db.addCollection<MemberPerm>("members")
    }

    nodeList(): PermNode[] {
        let nodes: PermNode[] = []
        for(let k in this.modules) {
            let mod: any = this.modules[k];

            if(mod._permissionnodes !== undefined) {
                nodes = nodes.concat(mod._permissionnodes)
            }
        }
        return nodes
    }

    @command({ 
        names: ["permissions", "p"], 
        desc: "Manage permissions",
        help: [
            "NAME",
            "    permissions - manage member and role permissions",
            "SYNOPSIS",
            "    %permissions {list|add|remove|clear} [node...] [user|role...]",
            "DESCRIPTION",
            "    list",
            "        list all permission nodes",
            "    list <node>",
            "        list all roles and members with the passed permission node",
            "    list <user|role>",
            "        list all permission nodes for the passed user",
            "    add <node>... <user|role>...",
            "        add passed permission nodes to the passed users and roles",
            "    remove <node>... <user|role>...",
            "        remove passed permission nodes from the passed users and roles",
            "    remove <node>",
            "        remove all user or role permissions for passed node",
            "    remove <user|role>",
            "        remove all permissions from passed user or role",
            "    clear <node>... <user>...",
            "        clears all the passed permission overrides from the passed users",
            "    clear <node>...",
            "        clear all permission overrides for passed permission node",
            "    clear <user>...",
            "        clear all permission overrides for passed users"
        ],
        flags: [],
    })
    doPerms(message: Message, args: CommandParameters) {
        let subCommand = args.pop()

        /**/ if(subCommand === "list") this.doList(message, args)
        else if(subCommand === "add") this.doAdd(message, args)
        else if(subCommand === "remove") this.doRemove(message, args)
        else if(subCommand === "clear") this.doClear(message, args)
    }

    doList(message: Message, args: CommandParameters) {
        let pages: PermNode[][] = []
        let current: PermNode[] = []
        this.nodeList().forEach(element => {
            current.push(element)
            if(current.length === 10) {
                pages.push(current)
                current = []
            }
        });
        if(current.length !== 0) pages.push(current)

        message.channel.send(this.listPage(pages, 0)).then( messages => {
            let promises = this.msgData(messages, (d, message) => {
                d.pages = pages

                return Promise.resolve()
            })

            promises.forEach( f => f.then(v => {
                this.track(v.message, "pages")
                this.track(v.message, "confirm")
            }))
        })
    }
    
    listPage(pages: PermNode[][], index: number): any {
        let page = pages[index]
        let embed = new RichEmbed()
        embed.setTitle("Command list")
        if(page === undefined) {
            embed.addField("None", "None")
        } else {
            page.forEach(v => {
                embed.addField(v.name, v.desc)
            })
        }
        return { embed }
    }

    @tracker("pages")
    pages = new MessageTracker(this, it => {
        simpleTrackerPage(it, (db) => db.pages.length, (db, message, user, index) => {
            return message.edit(this.listPage(db.pages, index))
        })
    })
    

    doAdd(message: Message, args: CommandParameters) {

    }

    doRemove(message: Message, args: CommandParameters) {

    }

    doClear(message: Message, args: CommandParameters) {

    }
}

type RolePerm = {
    guildID: Snowflake,
    roleID: Snowflake,

    node: string
}

type MemberPerm = {
    guildID: Snowflake,
    memberID: Snowflake,

    allow: boolean
    node: string
}