class Logger {
    private prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    log(...args: any[]) {
        console.log(this.prefix, ...args);
    }

    info(...args: any[]) {
        console.info(this.prefix, ...args);
    }
}

export const logger = new Logger('[Bilibili Upload Section Sort]');
