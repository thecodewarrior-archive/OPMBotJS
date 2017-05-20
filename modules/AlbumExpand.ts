//module
import { BotModule, command, tracker, MessageTracker } from '../app/module';
import { Message, Channel, GroupDMChannel, DMChannel, TextChannel, MessageOptions, RichEmbedOptions, RichEmbed } from 'discord.js';
import { ParsedArgs } from 'minimist';
import * as https from 'https';
import * as url from 'url'
const PATTERN = /https?:\/\/imgur.com\/(?:\w+\/)+([A-Za-z0-9]{5})/


export class AlbumExpand extends BotModule {
    @command({
        names: ["$expandAlbum", "$ea"], flags: [], help: [
            "NAME",
            "    expandAlbum - Expand an album",
            "",
            "SYNOPSIS",
            "    $expandAlbum [link]",
        ]
    })
    doCommand(message: Message, args: ParsedArgs) {
        let channelP = Promise.resolve(message.channel)
        message.delete()
        channelP.then(channel => {
            if (args._.length > 0) {
                let link: string | null = null
                args._.forEach(v => {
                    if (link !== null) return
                    let match = v.match(PATTERN)
                    if (match !== null) {
                        link = match[1]
                    }
                })
                if (link !== null) {
                    this.send(channel, link)
                }
            } else {
                channel.startTyping()
                message.channel.fetchMessages({ limit: 20 }).then(c => {
                    let link: string | null = null
                    c.forEach(v => {
                        if (link !== null) return
                        let match = v.content.match(PATTERN)
                        if (match !== null) {
                            link = match[1]
                        }
                    })
                    if (link !== null) {
                        this.send(channel, link)
                    }
                    channel.stopTyping()
                })
            }
        })
    }

    send(channel: TextChannel | DMChannel | GroupDMChannel, link: string) {
        this.getContent(`https://api.imgur.com/3/album/${link}`).then(album_ => {
            let album = JSON.parse(album_).data;
            let images: Array<ImageData> = []
            album.images.forEach((elem: any) => {
                images.push({ link: elem.link, desc: elem.description })
            });
            channel.send(this.message(album.title, 0, images)).then(m => {
                this.msgData(m as Message, d => {
                    d.albumData = images;
                    d.title = album.title
                    d.index = 0;
                    return Promise.resolve()
                }).then(v => {
                    this.track(m as Message, "imgur_page")
                })
            })
        }).catch (e => console.log(e))
    }

    message(title: string, index: number, images: ImageData[]): MessageOptions {
        let embed = new RichEmbed()
            .setTitle(title)
            .setDescription(images[index].desc)
            .setImage(images[index].link)
            .setFooter(`${index+1}/${images.length}`)
        return {embed}
    }

    _clientID = this.env["imgur-clientid"];
    getContent(uri: string): Promise<string> {
        // return new pending promise
        return new Promise((resolve, reject) => {
            // select http or https module, depending on reqested url
            let req: any = url.parse(uri)
            req.headers = {
                'Authorization': 'Client-ID ' + this._clientID
            }
            const request = https.get(req, (response) => {
                // handle http errors
                let statusCode = response.statusCode
                if (statusCode === undefined || statusCode < 200 || statusCode > 299) {
                    reject(new Error('Failed to load page: ' + response.statusCode + " => " + response.statusMessage));
                }
                // temporary data holder
                const body: Array<string | Buffer> = [];
                // on every content chunk, push it to the data array
                response.on('data', (chunk) => body.push(chunk));
                // we are done, resolve promise with those joined chunks
                response.on('end', () => resolve(body.join('')));
            });
            // handle connection errors of the request
            request.on('error', (err) => reject(err))
        })
    };

    @tracker("imgur_page")
    tracker: MessageTracker = new MessageTracker(this, (it) => {
        it.setButton("➡", (db, message, user) => {
            db.index++
            message.edit(this.message(db.title, db.index, db.albumData))
            return Promise.resolve()
        }, (db) => {
            return Promise.resolve(db.index < db.albumData.length-1)
        })
        it.setButton("⬅", (db, message, user) => {
            db.index--
            message.edit(this.message(db.title, db.index, db.albumData))
            return Promise.resolve()
        }, (db) => {
            return Promise.resolve(db.index > 0)
        })
    })
}

type ImageData = { link: string, desc: string }