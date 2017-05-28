import { watchTree, unwatchTree } from "watch"
import * as fs from 'fs'
import * as util from 'util'
import * as path from 'path';
import { BotModule } from './bot';

let files = new class {
    private map = new Map<string, any>()
    private watchers = new Map<string, fs.FSWatcher>()

    add(name: string) {
        if(this.watchers.has(name)) return
        this.watchers.set(name, fs.watch(name, (event) => {
            if (event === 'change') {
                this.read(name)
            }
        }))
        this.read(name)
    }

    read(name: string) {
        fs.readFile(name, (err, data) => {
            if (err) {
                this.remove(name)
            } else {
                console.log("Loading lang file `" + name + "`")
                this.map.set(name, JSON.parse(data.toString()))
            }
        })
    }

    remove(name: string) {
        let w = this.watchers.get(name)
        if(w !== undefined) w.close()
        this.watchers.delete(name)
        this.map.delete(name)
    }

    get(name: string): any {
        let dat = this.map.get(name)
        if(dat === undefined) {
            this.read(name)
            dat = this.map.get(name)
        }
        return dat || {}
    }
}

export class I18n {
    private translation: any

    constructor(private readonly filename: string) {
        files.add(filename)
    }

    __(name: string[], ...args: any[]): string | undefined {
        let raw = this.getRaw(name)
        if(raw instanceof Array) {
            raw = raw.join('\n')
        }
        if(typeof raw === 'string') {
            return util.format(raw, args)
        }
        return undefined
    }

    getRaw(name: string[]): any | undefined {
        return this.get(name, files.get(this.filename))
    }

    private get(name: string[], data: any): any | undefined {
        let v = data[name.join('.')]
        if(v !== undefined) return v
        let ret: string | undefined = undefined
        for(let i = name.length-1; i > 0; i--) {
            let d = data[name.slice(0, i).join('.')]
            if (typeof d === 'object') {
                ret = this.get(name.slice(i), d)
            }
            if(ret !== undefined) return ret
        }

        return undefined
    }
}

export const ROOT_i18n = new I18n(path.join(__dirname, '../../../data/root/lang.json'))