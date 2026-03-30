import { addStyle } from './modules/addStyle/addStyle.ts';


/**
 * 主函数
 */
const main = async () => {
	// 添加样式
	addStyle()
};

main().catch( error => {
	console.error( error );
} );
