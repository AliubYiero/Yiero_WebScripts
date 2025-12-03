import { sleep } from 'radash';

export class DelayedQueue<T> {
	private queue: T[] = [];
	private isProcessing: boolean = false;
	
	constructor(
		private processor: ( item: T ) => Promise<number | void>,
		private delay: number = 500,
	) {
	}
	
	push( ...item: T[] ): void {
		this.queue.push( ...item );
		this.process();
	}
	
	/**
	 * 立即清空队列中所有**尚未开始处理**的任务。
	 * 注意：当前正在处理的任务会继续完成，不会被中断。
	 */
	reset(): void {
		this.queue = []; // 清空数组
	}
	
	private async process(): Promise<void> {
		if ( this.isProcessing || this.queue.length === 0 ) {
			return;
		}
		
		this.isProcessing = true;
		
		while ( this.queue.length > 0 ) {
			const item = this.queue.shift()!;
			console.log('this.queue', this.queue);
			let nextDelay = this.delay;
			try {
				const result = await this.processor( item );
				( typeof result === 'number' ) && ( nextDelay = result );
			}
			catch ( err ) {
				console.error( 'Queue task error:', err );
			}
			await sleep( nextDelay );
		}
		
		this.isProcessing = false;
	}
}
