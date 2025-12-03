/**
 * 代码配置
 */
export const codeConfig: {
	data: string;
	XOR_CODE: bigint;
	MASK_CODE: bigint;
	MAX_AID: bigint;
	BASE: bigint
} = {
	XOR_CODE: 23442827791579n,
	MASK_CODE: 2251799813685247n,
	MAX_AID: 1n << 51n,
	BASE: 58n,
	data: 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf',
};


/**
 * 将 bv 号转换为 av 号
 *
 * @param {`BV1${ string }`} bvid - 要转换的 bv 号
 * @return {number} 相应的 av 号
 */
export function bvToAv( bvid: `BV1${ string }` ): number {
	const { MASK_CODE, XOR_CODE, data, BASE } = codeConfig;
	const bvidArr = Array.from<string>( bvid );
	[ bvidArr[ 3 ], bvidArr[ 9 ] ] = [ bvidArr[ 9 ], bvidArr[ 3 ] ];
	[ bvidArr[ 4 ], bvidArr[ 7 ] ] = [ bvidArr[ 7 ], bvidArr[ 4 ] ];
	bvidArr.splice( 0, 3 );
	const tmp = bvidArr.reduce( ( pre, bvidChar ) => pre * BASE + BigInt( data.indexOf( bvidChar ) ), 0n );
	return Number( ( tmp & MASK_CODE ) ^ XOR_CODE );
}
