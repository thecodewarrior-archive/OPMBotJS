global.Promise = require("bluebird")

import * as fs from "fs";
import * as path from "path";
import * as discord from "discord.js";
import * as watch from "watch";

import { Channel, ClientUserSettings, Emoji, Guild, User, GuildMember, Collection, Snowflake, Message, MessageReaction, Role, UserResolvable } from 'discord.js';
import * as loki from 'lokijs';
import { BotModule } from '../base/api/bot';
import hookEvents from './events';
import HAX from './dirtyHax';

let recursiveReaddir: (path: string, ignore: Array<string | ( (file: string, stats: fs.Stats) => boolean )>, fun: (err: any, files: string[]) => void) => void = require('recursive-readdir')

console.log("Starting...");
let client = new discord.Client();
HAX.client = client

let db = new loki(path.join(__dirname, "../data/main/database.json"))
let modules: { [index: string]: BotModule; } = {};

hookEvents(client, modules, (m, g) => {
    return true
})

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


const markerLine = "//module"

function loadModule(file: string) {
	console.log("Loading module `" + file + "`")
	purgeCache(file)
	let existing = modules[file];
	delete modules[file]
	try {
		let exports: any = require(file);
		for (var k in exports) {
			let ctor = exports[k]
			let proto = Object.getPrototypeOf(ctor)
			let instance_of = proto === BotModule || proto instanceof BotModule
			if (!instance_of) continue;
			var botmodule = new ctor(client, modules);

			modules[file] = botmodule;
			botmodule.transfer(existing)
		}
	} catch(err) {
		console.log("Error loading module " + file + ", existing module unloaded.")
		console.log(err)
	}
}

let module_dir = path.join(__dirname, "../modules")
let module_regex = new RegExp(path.join(module_dir, "\\w+", "module.ts"))

function tryFile(file: string) {
	if(!fs.existsSync(file)) {
		delete modules[file]
	} else {
		if(file.match(module_regex)) {
			loadModule(file)
		}
	}
}

client.on('ready', () => {
	recursiveReaddir(module_dir, [], (err: any, files: string[]) => {
		for(var i in files) {
			tryFile(files[i])
		}
	})
	watch.watchTree(module_dir, (f: any, curr: fs.Stats, prev: fs.Stats) => {
		if(typeof f === "string") {
			tryFile(f)
		}
	})
});

console.log("Logging In...");
var token = fs.readFileSync(path.join(__dirname, "token.txt"), 'utf8').toString().trim();
console.log("`" + token + "`");
client.login(token);
