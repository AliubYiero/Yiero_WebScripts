import { ScrollSpeedStorage } from '../Storage/ScrollSpeed.ts';
import { PageReachedBottomEvent } from '../../module';

/**
 * 滚动控制类
 * */
export class Scroll {
	/**
	 * 当前滚动状态
	 * */
	static isScroll: boolean = false;
	
	/**
	 * 开启滚动
	 * */
	static open() {
		// 如果当前已经是滚动状态, 则不进行操作
		if ( this.isScroll ) {
			return;
		}
		// 设置滚动状态为开启状态
		this.isScroll = true;
		
		// 进行滚动
		this.scroll();
		
		// @todo 提示开启滚动
		console.log( '开启滚动, 当前的滚动速度是: ', ScrollSpeedStorage.get() );
	}
	
	/**
	 * 关闭滚动
	 * */
	static close() {
		// 设置滚动状态为关闭状态
		this.isScroll = false;
		
		// @todo 提示关闭滚动
		console.log( '关闭滚动' );
	}
	
	/**
	 * 切换滚动
	 * */
	static toggle() {
		// 如果当前已经是滚动状态, 则关闭滚动
		// 否则开启滚动
		this.isScroll
			? this.close()
			: this.open();
	}
	
	private static stepPerFrame() {
		// 获取滚动距离
		const scrollDistance = ScrollSpeedStorage.get();
		
		/*
		* 进行滚动
		* */
		// 当前帧计数不为0, 则表示当前不属于滚动帧
		// 添加帧
		FrameCounter.add();
		// 注意. scrollBy 只能移动整数位(向下取整), 所以小数位需要额外计算
		// 这里采用的只有滚动帧才进行滚动的方法, 滚动帧由上面的方法计算得来
		if ( FrameCounter.isScrollFrame ) {
			// 进行滚动
			window.scrollBy( {
				top: scrollDistance,
				left: 0,
				behavior: 'smooth',
			} );
			
			// 监听滚动到底部事件
			PageReachedBottomEvent.listen();
			
			// 输出移动信息
			// console.log( `滚动距离(px/${ scrollFrameStep }帧): `, scrollDistance );
		}
		
		// 如果滚动还处于开启状态, 则继续帧循环
		this.isScroll && requestAnimationFrame( this.stepPerFrame.bind( this ) );
	}
	
	/**
	 * 滚动
	 * */
	private static scroll() {
		/*
		* 进行帧计数, 每10帧执行一次滚动操作
		* */
		requestAnimationFrame( this.stepPerFrame.bind( this ) );
	}
}


class FrameCounter {
	// 当前帧技术
	private static frame: number = -1;
	
	// 滚动帧步长
	private static scrollFrameStep = 5;
	
	/**
	 * 判断当前是否为滚动帧
	 * */
	static get isScrollFrame() {
		return !this.frame;
	}
	
	/**
	 * 添加帧计数
	 * */
	static add() {
		this.frame++;
		this.frame = this.frame % this.scrollFrameStep;
	}
}
