import { Promise } from "promise";

declare module "firstline" {
    default export function firstline(name: string): Promise<string>
}