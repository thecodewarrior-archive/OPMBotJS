import * as fs from "fs";
/*
declare module "node-watch" {
    class WatchOptions {
        persistent: boolean;
        recursive: boolean;
        encoding: string;
        filter: RegExp | ((name: string) => boolean)
    }

    function watch(file_or_dir: string, callback: (event: string, name: string) => void): fs.FSWatcher;
    function watch(file_or_dir: string, options: WatchOptions): fs.FSWatcher;
    function watch(file_or_dir: string, options: WatchOptions, callback: (event: string, name: string) => void): fs.FSWatcher;
}
*/