import { Client } from 'discord.js';

interface HaxInterface {
    client: Client
}

const HAX = (global as any) as HaxInterface

export default HAX