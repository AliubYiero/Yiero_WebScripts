/**
 * 获取本日日期
 */
export const getToday = () => {
	const padStart = ( s: string | number ) => String( s ).padStart( 2, '0' );
	const date = new Date();
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${ year }-${ padStart( month ) }-${ padStart( day ) }`;
};
