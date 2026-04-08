/**
 * 样式 Display 属性
 * */
export type DisplayMode = /* precomposed values */
	'block'
	| 'inline'
	| 'inline-block'
	| 'flex'
	| 'inline-flex'
	| 'grid'
	| 'inline-grid'
	| 'flow-root'
	
	/* box generation */
	| 'none'
	| 'contents'
	
	/* two-value syntax */
	| 'block flow'
	| 'inline flow'
	| 'inline flow-root'
	| 'block flex'
	| 'inline flex'
	| 'block grid'
	| 'inline grid'
	| 'block flow-root'
	
	/* other values */
	| 'table'
	| 'table-row' /* all table elements have an equivalent CSS display value */
	| 'list-item'
	
	/* Global values */
	| 'inherit'
	| 'initial'
	| 'revert'
	| 'revert-layer'
	| 'unset'
