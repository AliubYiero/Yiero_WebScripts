import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { RecordSession } from '../store/RecordSession.ts';
import { elementWaiter } from '@yiero/gmlib';

@customElement( 'history-modal' )
export class HistoryModal extends LitElement {
	@property( { type: Boolean } ) open = false;
	@property( { type: Number } ) roomId = 0;
	@state() private expandedSession = 0; // Using liveStartTime as ID
	@property() historyData: RecordSession[] = [];
	
	connectedCallback() {
		super.connectedCallback();
		window.addEventListener( 'keydown', this.handleKeyDown );
		this.expandedSession = this.historyData.length > 0 ? this.historyData[ 0 ].liveStartTime : 0;
	}
	
	disconnectedCallback() {
		window.removeEventListener( 'keydown', this.handleKeyDown );
		super.disconnectedCallback();
	}
	
	handleKeyDown = ( e: KeyboardEvent ) => {
		if ( e.key === 'Escape' && this.open ) this.closeModal();
	};
	
	closeModal() {
		this.dispatchEvent( new CustomEvent( 'close', { bubbles: true } ) );
	}
	
	saveHistory() {
		this.dispatchEvent( new CustomEvent( 'history-updated', {
			detail: this.historyData,
			bubbles: true,
		} ) );
	}
	
	toggleSession( sessionTime: number ) {
		this.expandedSession = this.expandedSession === sessionTime ? 0 : sessionTime;
	}
	
	downloadSession( sessionTime: number ) {
		const session = this.historyData.find( s => s.liveStartTime === sessionTime );
		if ( !session ) return;
		
		this.dispatchEvent( new CustomEvent( 'download-session', {
			detail: session,
			bubbles: true,
		} ) );
	}
	
	deleteSession( sessionTime: number ) {
		if ( !confirm( '确定要删除此场次记录？' ) ) return;
		
		this.historyData = this.historyData.filter( s => s.liveStartTime !== sessionTime );
		this.saveHistory();
		if ( this.expandedSession === sessionTime ) {
			this.expandedSession = 0;
		}
	}
	
	clearAll() {
		if ( !confirm( '确定要清空所有历史记录？此操作不可恢复！' ) ) return;
		
		this.historyData = [];
		this.expandedSession = 0;
		this.saveHistory();
	}
	
	formatDate( timestamp: number ): string {
		return new Date( timestamp ).toLocaleDateString( 'zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		} );
	}
	
	formatTime( timeStr: string | number ): string {
		if ( typeof timeStr === 'number' ) {
			const date = new Date( timeStr );
			return date.toLocaleString();
		}
		// Ensure consistent time formatting (hh:mm:ss)
		return timeStr.length === 5 ? `${ timeStr }:00` : timeStr;
	}
	
	renderEmptyState() {
		return html`
			<div class="empty-state">
				<p class="empty-text">暂无任何标记记录，开始你的第一次标记吧！</p>
			</div>
		`;
	}
	
	renderSessionRow( session: RecordSession ) {
		const isExpanded = this.expandedSession === session.liveStartTime;
		const markerRows = session.records.map( ( marker, index ) => html`
			<tr class="marker-row">
				<td>${ index + 1 }</td>
				<td>${ this.formatTime( marker.localTime ) }</td>
				<td>${ this.formatTime( marker.liveTime ) }</td>
				<td class="content-cell">${ marker.content }</td>
			</tr>
		` );
		
		return html`
			<tr class="session-row ${ isExpanded ? 'expanded' : '' }">
				<td>${ this.formatDate( session.liveStartTime ) }</td>
				<td class="title-cell">${ session.liveTitle }</td>
				<td>${ session.records.length }</td>
				<td class="actions">
					<button
						class="detail-btn"
						@click=${ () => this.toggleSession( session.liveStartTime ) }
						aria-expanded=${ isExpanded }
					>
						详情 ${ isExpanded ? '▴' : '▾' }
					</button>
					<button class="download-btn"
					        @click=${ () => this.downloadSession( session.liveStartTime ) }>
						${ this.renderDownloadIcon() }
					</button>
					<button class="delete-btn"
					        @click=${ () => this.deleteSession( session.liveStartTime ) }>
						${ this.renderDeleteIcon() }
					</button>
				</td>
			</tr>
			<tr class="sub-table-row ${ isExpanded ? 'visible' : '' }">
				<td colspan="4">
					<div class="sub-table-container">
						<table class="sub-table">
							<thead>
							<tr>
								<th>#</th>
								<th>本地时间</th>
								<th>直播时间</th>
								<th>标记内容</th>
							</tr>
							</thead>
							<tbody>
							${ markerRows }
							</tbody>
						</table>
					</div>
				</td>
			</tr>
		`;
	}
	
	renderDownloadIcon() {
		return html`
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
			     viewBox="0 0 24 24" fill="none" stroke="currentColor"
			     stroke-width="2">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
				<polyline points="7 10 12 15 17 10"></polyline>
				<line x1="12" y1="15" x2="12" y2="3"></line>
			</svg>
		`;
	}
	
	renderDeleteIcon() {
		return html`
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
			     viewBox="0 0 24 24" fill="none" stroke="currentColor"
			     stroke-width="2">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="15" y1="9" x2="9" y2="15"></line>
				<line x1="9" y1="9" x2="15" y2="15"></line>
			</svg>
		`;
	}
	
	renderCloseIcon() {
		return html`
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
			     viewBox="0 0 24 24" fill="none" stroke="currentColor"
			     stroke-width="2">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		`;
	}
	
	render() {
		return html`
			${ this.open ? html`
				<div class="overlay" @click=${ this.closeModal }></div>
				<div class="modal">
					<div class="modal-content glass-card">
						<div class="modal-header">
							<h2 class="modal-title">直播标记历史记录</h2>
							<button class="close-btn"
							        @click=${ this.closeModal }
							        aria-label="关闭">
								${ this.renderCloseIcon() }
							</button>
						</div>
						
						${ this.historyData.length === 0
							? this.renderEmptyState()
							: html`
								<div class="table-container">
									<table class="main-table">
										<thead>
										<tr>
											<th>直播日期</th>
											<th>直播标题</th>
											<th>标记数量</th>
											<th>操作</th>
										</tr>
										</thead>
										<tbody>
										${ this.historyData.map( session => this.renderSessionRow( session ) ) }
										</tbody>
									</table>
								</div>
							`
						}
						
						<div class="modal-footer">
							<button
								class="clear-btn"
								?disabled=${ this.historyData.length === 0 }
								@click=${ this.clearAll }
							>
								清除所有记录
							</button>
						</div>
					</div>
				</div>
			` : nothing }
		`;
	}
	
	static styles = css`
		:host {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 1000;
			pointer-events: none;
		}
		
		.overlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.5);
			backdrop-filter: blur(4px);
			animation: fade-in 0.3s ease-out;
			pointer-events: auto;
		}
		
		.modal {
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 70vw;
			min-width: 650px;
			height: 50vh;
			min-height: 400px;
			display: flex;
			justify-content: center;
			align-items: center;
			pointer-events: none;
		}
		
		.modal-content {
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: column;
			border-radius: 20px;
			overflow: hidden;
			pointer-events: auto;
		}
		
		.glass-card {
			background: rgba(255, 255, 255, 0.85);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			border: 1px solid rgba(255, 255, 255, 0.4);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
		}
		
		.modal-header {
			padding: 1.25rem 1.5rem;
			display: flex;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1px solid rgba(0, 0, 0, 0.06);
			flex-shrink: 0;
		}
		
		.modal-title {
			font-size: 1.5rem;
			font-weight: 700;
			color: #1e293b;
			margin: 0;
		}
		
		.close-btn {
			width: 36px;
			height: 36px;
			border-radius: 50%;
			background: rgba(0, 0, 0, 0.03);
			border: none;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
			color: #64748b;
		}
		
		.close-btn:hover {
			background: rgba(0, 0, 0, 0.08);
			color: #475569;
			transform: rotate(90deg);
		}
		
		.table-container {
			flex: 1;
			overflow: auto;
			padding: 0 1.5rem;
			margin-top: 0.5rem;
			scrollbar-width: thin;
		}
		
		/* 精确控制一级表格列宽 */
		
		.main-table {
			width: 100%;
			border-collapse: collapse;
			table-layout: fixed;
			font-size: 0.95rem;
		}
		
		.main-table thead > tr {
			border-bottom: 2px solid #e2e8f0;
		}
		
		.main-table th:nth-child(1),
		.main-table td:nth-child(1) {
			width: 150px;
		}
		
		.main-table th:nth-child(2),
		.main-table td:nth-child(2) {
			width: auto;
			min-width: 240px;
			white-space: normal;
			word-wrap: break-word;
			padding-right: 1.5rem; /* 为操作列留出空间 */
		}
		
		.main-table th:nth-child(3),
		.main-table td:nth-child(3) {
			width: 100px;
		}
		
		.main-table th:nth-child(4),
		.main-table td:nth-child(4) {
			width: 150px;
		}
		
		.main-table th {
			text-align: left;
			padding: 0.75rem 0.5rem;
			font-weight: 600;
			color: #475569;
		}
		
		.main-table td {
			padding: 0.85rem 0.5rem;
			color: #334155;
		}
		
		.title-cell {
			font-weight: 500;
			line-height: 1.4;
		}
		
		.session-row {
			border-bottom: 1px solid #f1f5f9;
		}
		
		.session-row:nth-child(4n+1) {
			background-color: rgba(99, 102, 241, 0.03);
		}
		
		.session-row.expanded {
			background-color: rgba(99, 102, 241, 0.08);
		}
		
		.sub-table-row {
			display: none;
		}
		
		.sub-table-row.visible {
			display: table-row;
		}
		
		.sub-table-container {
			max-height: 0;
			overflow: hidden;
			transition: max-height 0.4s ease-in-out;
			padding: 0 1rem 1rem;
		}
		
		.sub-table-row.visible .sub-table-container {
			max-height: 500px;
		}
		
		/* 精确控制二级表格列宽 */
		
		.sub-table {
			width: 100%;
			background: rgba(248, 250, 252, 0.7);
			border: 1px solid rgba(148, 163, 184, 0.2);
			table-layout: fixed;
			border-radius: 6px;
			overflow: hidden;
		}
		
		.sub-table th:nth-child(1),
		.sub-table td:nth-child(1) {
			width: 50px;
		}
		
		.sub-table th:nth-child(2),
		.sub-table td:nth-child(2) {
			width: 100px;
		}
		
		.sub-table th:nth-child(3),
		.sub-table td:nth-child(3) {
			width: 100px;
		}
		
		.sub-table th:nth-child(4),
		.sub-table td:nth-child(4) {
			width: auto;
			white-space: normal;
			word-wrap: break-word;
		}
		
		.sub-table th {
			background: rgba(99, 102, 241, 0.08);
			padding: 0.6rem 0.5rem;
			font-size: 0.85rem;
			color: #334155;
			text-align: left;
		}
		
		.sub-table td {
			padding: 0.65rem 0.5rem;
			font-size: 0.875rem;
			color: #475569;
			border-bottom: 1px solid rgba(148, 163, 184, 0.1);
		}
		
		.content-cell {
			line-height: 1.4;
		}
		
		.marker-row:last-child td {
			border-bottom: none;
		}
		
		.marker-row:nth-child(odd) {
			background-color: rgba(241, 245, 249, 0.6);
		}
		
		.actions {
			display: flex;
			gap: 8px;
			align-items: center;
		}
		
		.detail-btn, .download-btn, .delete-btn {
			height: 28px;
			border-radius: 8px;
			border: none;
			background: rgba(0, 0, 0, 0.02);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
			color: #64748b;
			font-size: 0.85rem;
		}
		
		.detail-btn:hover {
			background: rgba(99, 102, 241, 0.12);
			color: #6366f1;
		}
		
		.download-btn:hover {
			background: rgba(16, 185, 129, 0.12);
			color: #10b981;
		}
		
		.delete-btn:hover {
			background: rgba(239, 68, 68, 0.12);
			color: #ef4444;
		}
		
		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			padding: 2rem;
			text-align: center;
		}
		
		.empty-illustration {
			width: 160px;
			height: 160px;
			border-radius: 20px;
			object-fit: cover;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
			margin-bottom: 1.5rem;
			border: 1px solid rgba(0, 0, 0, 0.05);
		}
		
		.empty-text {
			font-size: 1.25rem;
			font-weight: 500;
			color: #64748b;
			max-width: 80%;
			line-height: 1.5;
		}
		
		.modal-footer {
			padding: 0.75rem 1.5rem;
			border-top: 1px solid rgba(0, 0, 0, 0.06);
			display: flex;
			justify-content: flex-end;
			flex-shrink: 0;
		}
		
		.clear-btn {
			background: rgba(239, 68, 68, 0.1);
			color: #ef4444;
			border: none;
			padding: 0.5rem 1.25rem;
			border-radius: 12px;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		
		.clear-btn:hover:not(:disabled) {
			background: rgba(239, 68, 68, 0.15);
			transform: translateY(-1px);
		}
		
		.clear-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		
		@keyframes fade-in {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}
		
		.main-table, .detail-btn {
			font-size: 14px;
		}
	`;
}

declare global {
	interface HTMLElementTagNameMap {
		'history-modal': HistoryModal;
	}
	
	interface HTMLElementEventMap {
		'close': CustomEvent;
		'history-updated': CustomEvent<RecordSession[]>;
		'download-session': CustomEvent<RecordSession>;
	}
}


/**
 * 初始化 HistoryModal 组件
 */
export const initHistoryModal = async (
	roomId: number,
	records: RecordSession[] = [],
) => {
	const historyModal = document.createElement( 'history-modal' );
	historyModal.roomId = roomId;
	historyModal.historyData = records;
	const container = await elementWaiter( 'body' );
	container.append( historyModal );
	return historyModal;
};
