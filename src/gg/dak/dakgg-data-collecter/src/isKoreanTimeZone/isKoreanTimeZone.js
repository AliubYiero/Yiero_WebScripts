/**
 * 判断用户的时区
 */
export const isKoreanTimeZone = () => {
	const options = new Intl.DateTimeFormat().resolvedOptions();
	return options.timeZone === 'Asia/Seoul';
};
