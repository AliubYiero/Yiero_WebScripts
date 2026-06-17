export class Logger {
    constructor(private prefix: string) {}

    log(...msg: any[]) {
        console.log(this.prefix, ...msg);
    }

    info(...msg: any[]) {
        console.info(this.prefix, ...msg);
    }

    warn(...msg: any[]) {
        console.warn(this.prefix, ...msg);
    }

    error(...msg: any[]) {
        console.error(this.prefix, ...msg);
    }
}

export const logger = new Logger('[POE2 TRADE DATA MATCH]');
