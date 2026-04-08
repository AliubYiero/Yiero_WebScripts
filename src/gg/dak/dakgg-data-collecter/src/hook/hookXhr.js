/**
 * 劫持 xhr 返回
 */
export const hookXhr = ( hookUrl, callback ) => {
	const xhrOpen = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function () {
		// 这里保存了this到xhr变量，为了提高代码的可读性
		const xhr = this;
		if ( arguments[1].startsWith( hookUrl ) ) {
			// 获取response的操作符，
			// 如果想要劫持responseText就需要改为responseText
			// getOwnPropertyDescriptor获取的是一个对象上属性的相关的描述符
			// 可以拿到get，set，enumerable，configurable等。
			const getter = Object.getOwnPropertyDescriptor(
				XMLHttpRequest.prototype,
				'responseText',
			).get;
			// 这里对xhr的response属性做了一个defineProperty
			// 当触发xhr.response的时候会访问对应的get
			// 而get调用我们之前获取的getter函数，需要注意修改this指向
			// 获取原返回内容，进行一定的修改，返回新的修改内容
			Object.defineProperty( xhr, 'responseText', {
				get: () => {
					let result = getter.call( xhr );
					callback( result, arguments[1] );
					return result;
				},
			} );
		}
		return xhrOpen.apply( xhr, arguments );
	};
};
