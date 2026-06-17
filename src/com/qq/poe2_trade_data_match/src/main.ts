import { gmDownload, gmMenuCommand } from '@yiero/gmlib';
import {
    handleMatchItemDate,
    ItemInfo,
} from './handleMatchItemDate.ts';
import { logger } from './utils/logger.ts';

/**
 * 主函数
 */
const main = async () => {
    gmMenuCommand.create('获取当前页数据', () => {
        const itemInfoList: ItemInfo[] = Array.from(
            document.querySelectorAll<HTMLElement>(
                '.resultset > .row',
            ),
        )
            .map(handleMatchItemDate)
            .filter(Boolean) as ItemInfo[];
        logger.info(
            `读取到当前页 ${itemInfoList.length} 个物品信息`,
            itemInfoList,
        );

        const header = [
            '交易单ID',
            '物品名称',
            '售价',
            '单位',
            '前缀1',
            '前缀1数值',
            '前缀2',
            '前缀2数值',
            '后缀1',
            '后缀1数值',
            '后缀2',
            '后缀2数值',
            '读取时间',
        ];

        /**
         * CSV 转义：如果字段包含逗号、引号或换行符，用双引号包裹
         */
        const escapeCsvField = (value: string | number): string => {
            const str = String(value);
            return /[",\n]/.test(str)
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        };

        const content = [
            header.join(','),
            ...itemInfoList.map((itemInfo) => {
                const prefixList = itemInfo.modifiers.filter(
                    (m) => m.type === '前缀',
                );
                const suffixList = itemInfo.modifiers.filter(
                    (m) => m.type === '后缀',
                );

                return [
                    itemInfo.id,
                    itemInfo.item,
                    itemInfo.price,
                    itemInfo.priceUint,
                    prefixList[0]?.name ?? '',
                    prefixList[0]?.value ?? '',
                    prefixList[1]?.name ?? '',
                    prefixList[1]?.value ?? '',
                    suffixList[0]?.name ?? '',
                    suffixList[0]?.value ?? '',
                    suffixList[1]?.name ?? '',
                    suffixList[1]?.value ?? '',
                    Date.now(),
                ]
                    .map(escapeCsvField)
                    .join(',');
            }),
        ];
        const firstTitle = itemInfoList[0].item;
        gmDownload.text(
            content.join('\n'),
            `${firstTitle}_${Date.now()}.csv`,
            'text/csv',
        );
    });
};

main().catch((error) => {
    console.error(error);
});
