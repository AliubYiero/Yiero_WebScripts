type ILogLevel = 'log' | 'info' | 'warn' | 'error';

export class Logger {
    private static header = '[bilibili timeline]';

    static log(...msg: any[]) {
        this.output('log', ...msg);
    }

    static info(...msg: any[]) {
        this.output('info', ...msg);
    }

    static warn(...msg: any[]) {
        this.output('warn', ...msg);
    }

    static error(...msg: any[]) {
        this.output('error', ...msg);
    }

    private static output(level: ILogLevel, ...msg: any[]) {
        console.group(this.header);
        console[level](...msg);
        console.groupEnd();
    }
}
