export class Logger {
    constructor(private preifx: string) {}

    log(...msg: any[]) {
        console.log(this.preifx, ...msg);
    }

    info(...msg: any[]) {
        console.info(this.preifx, ...msg);
    }

    warn(...msg: any[]) {
        console.warn(this.preifx, ...msg);
    }

    error(...msg: any[]) {
        console.error(this.preifx, ...msg);
    }
}

export const logger = new Logger('[PoE2 Market Quick Jump]');
