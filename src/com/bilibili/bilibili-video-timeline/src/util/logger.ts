export class Logger {
    constructor(private prefix: string) {}

    log(msg: string) {
        console.log(`${this.prefix} ${msg}`);
    }

    info(msg: string) {
        console.info(`${this.prefix} ${msg}`);
    }

    warn(msg: string) {
        console.log(`${this.prefix} ${msg}`);
    }

    error(msg: string) {
        console.error(`${this.prefix} ${msg}`);
    }
}

export const logger = new Logger('[bilibili timeline]');
