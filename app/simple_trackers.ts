import { User, Message } from 'discord.js';
import { MessageTracker } from './module';
export function simpleTrackerPage(
    it: MessageTracker, 
    length: (db: any) => number,
    switchPage: (db: any, message: Message, user: User, index: number) => Promise<any>,
    forwardEmoji: string = "➡",
    backEmoji: string = "⬅"
    ) {
    it.setButton(forwardEmoji, (db, message, user) => {
        if(db.index === undefined) db.index = 0;
        db.index++
        return switchPage(db, message, user, db.index)
    }, (db) => {
        return Promise.resolve(db.index < length(db) - 1)
    })
    it.setButton(backEmoji, (db, message, user) => {
        if(db.index === undefined) db.index = length(db)-1;
        db.index--
        return switchPage(db, message, user, db.index)
    }, (db) => {
        return Promise.resolve(db.index > 0)
    })
}