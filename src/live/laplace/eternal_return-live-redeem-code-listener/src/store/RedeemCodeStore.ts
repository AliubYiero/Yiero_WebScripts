import { RedeemCodeGrantEvent } from './RedeemCodeGrantEvent.ts';

/**
 * 持久化兑换码
 */
class PersistRedeemCode {
	private static readonly key = 'redeemCodeList';
	private static readonly today = new Date().toLocaleDateString();
	
	/**
	 * 获取持久化的兑换码
	 */
	static get(): string[] {
		const mapper = GM_getValue( this.key, {} ) as Record<string, string[]>;
		mapper[ this.today ] ||= [];
		return mapper[ this.today ];
	}
	
	/**
	 * 持久化添加兑换码
	 */
	static add() {
		GM_setValue( this.key, {
			[ this.today ]: RedeemCode.data.redeemCodeList,
		} );
	}
}

/**
 * 兑换码存储
 */
const RedeemCode = {
	data: {
		/**
		 * 疑似兑换码的对象
		 */
		redeemCodeObject: {} as Record<string, number>,
		/**
		 * 已经发放的兑换码列表
		 */
		redeemCodeList: PersistRedeemCode.get() as string[],
	},
	action: {
		/**
		 * 判断当前弹幕是否为兑换码
		 */
		isRedeemCode: ( message: string ): boolean => {
			const trimmedMessage = message.trim();
			return /^[a-zA-Z0-9]{5,}$/.test( trimmedMessage )
				&& !/^[0-9]+$/.test( trimmedMessage );
		},
		/**
		 * 添加兑换码
		 */
		addRedeemCode: ( redeemCode: string ): void => {
			// 转换为大写
			redeemCode = redeemCode.toUpperCase();
			
			// 如果兑换码已经存在, 则不添加
			if ( RedeemCode.data.redeemCodeList.includes( redeemCode ) ) return;
			
			// 记录兑换码(疑似)
			RedeemCode.data.redeemCodeObject[ redeemCode ] ||= 0;
			RedeemCode.data.redeemCodeObject[ redeemCode ]++;
			
			// 如果疑似兑换码出现了 3 次, 则认为是兑换码
			if (
				RedeemCode.data.redeemCodeObject[ redeemCode ] === 3
			) {
				// 记录兑换码
				RedeemCode.data.redeemCodeList.push( redeemCode );
				
				// 发送兑换码事件
				RedeemCodeGrantEvent.send(
					redeemCode,
					RedeemCode.data.redeemCodeList.indexOf( redeemCode ),
				);
				
				// 持久化兑换码
				PersistRedeemCode.add();
			}
		},
	},
};

export {
	RedeemCode,
};
