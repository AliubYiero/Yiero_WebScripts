import { hookXhr } from '@yiero/gmlib';
import { renderDiscountOnMarketPage } from './marketPage/renderDiscountOnMarketPage.ts';
import { sleep } from 'radash';
import { renderDiscountOnGoodListPage } from './goodListPage/renderDiscountOnGoodListPage.ts';

export interface QuerySaleTemplateResponse {
    Code: number;
    Msg: string;
    Data: QuerySaleTemplateItem[];
    TotalCount: number;
    HasNext: boolean;
}

export interface QuerySaleTemplateItem {
    id: number;
    gameId: number;
    gameName: string;
    gameIcon: string;
    commodityName: string;
    commodityHashName: string;
    iconUrl: string;
    iconUrlLarge: string;
    onSaleCount: number;
    onLeaseCount: number;
    leaseUnitPrice: string;
    longLeaseUnitPrice: string;
    leaseDeposit: string;
    price: string;
    steamPrice: string;
    steamUsdPrice: string;
    typeName: string;
    exterior?: string;
    exteriorColor: string;
    rarity: string;
    rarityColor: string;
    quality?: string;
    qualityColor?: string;
    sortId: number;
    haveLease: number;
    stickersIsSort: boolean;
    subsidyPurchase: number;
    rent: string;
    listType: number;
}

export interface QueryTemplateDetailResponse {
    Code: number;
    Msg: string;
    Data: QueryTemplateDetailData;
    TotalCount: number;
    HasNext: boolean;
}

export interface QueryTemplateDetailData {
    templateInfo: TemplateInfo;
    filters: Filter[];
    specialStyleList: unknown | null;
    sellSortConfigList: SortConfig[];
    leaseSortConfigList: SortConfig[];
    purchaseConfigDTO: PurchaseConfigDTO;
    fadeRangeList: unknown | null;
    abradeRangeList: AbradeRange[];
}

export interface TemplateInfo {
    id: number;
    gameId: number;
    commodityName: string;
    commodityHashName: string;
    iconUrl: string;
    iconUrlLarge: string;
    steamPrice: string;
    steamUSDPrice: string;
    haveSold: number | null;
    haveLease: number | null;
    typeName: string;
    typeHashName: string;
    rarityName: string;
    rarityColor: string;
    qualityName: string;
    qualityColor: string;
    exteriorName: string;
    exteriorColor: string;
    isDoppler: number;
    isFade: number;
    isHardened: number;
    isSpecial: number;
    weaponHashName: string;
    sellNumber: number;
    leaseNumber: number;
    noLongLeaseNumber: number;
    purchaseNumber: number;
    supportAbrade: number;
    jumpSteamLinkUrl: string;
}

export interface Filter {
    Name: string;
    FilterKey: string;
    ControlType: number;
    FilterType: number;
    IsShow: boolean;
    SubName: string;
    MaxVal: string;
    MinVal: string;
    Items: FilterItem[] | null;
}

export interface FilterItem {
    leaseTransferPrice: string | null;
    presaleMinPrice: string | null;
    Name: string;
    SimpleName: string | null;
    ValType: boolean;
    MaxVal: string;
    MinVal: string;
    FixedVal: string;
    QueryString: string;
    IsSelected: boolean;
    NodeItems: FilterItem[] | null;
    PurchaseMaxPrice: string | null;
    SellPrice: string | null;
    LeasePrice: string | null;
    CategoryFlag: boolean;
}

export interface SortConfig {
    sortTypeKey: string;
    sortDesc: string;
    showName: string;
}

export interface PurchaseConfigDTO {
    purchaseSpecialProperties: unknown[];
    purchaseAbradeSections: unknown[];
}

export interface AbradeRange {
    ShowName: string;
    Name: string;
    MaxVal: string;
    MinVal: string;
}

const handleResponseRoute = {
    querySaleTemplate: (response: QuerySaleTemplateResponse) => {
        if (location.pathname !== '/market') {
            console.log(
                '[steam-price-calculate] 非饰品市场页面, 不处理数据...',
            );
            return;
        }

        if (response.Code !== 0) {
            console.warn(
                '[steam-price-calculate] 数据加载失败, 请重试...',
            );
            return;
        }

        sleep(50).then(() => {
            renderDiscountOnMarketPage(response.Data);
        });
    },
    queryTemplateDetail: (response: QueryTemplateDetailResponse) => {
        if (location.pathname !== '/market/goods-list') {
            console.log(
                '[steam-price-calculate] 非饰品详情页面, 不处理数据...',
            );
            return;
        }
        if (response.Code !== 0) {
            console.warn(
                '[steam-price-calculate] 数据加载失败, 请重试...',
            );
            return;
        }

        sleep(50).then(() => {
            renderDiscountOnGoodListPage(response.Data);
        });
    },
};

export const mockResponse = () => {
    hookXhr(
        (url) => {
            return (
                url.includes(
                    'pc-api.youpin898.com/api/homepage/pc/goods/market/querySaleTemplate',
                ) ||
                url.includes(
                    'pc-api.youpin898.com/api/homepage/pc/goods/market/queryTemplateDetail',
                )
            );
        },
        // gmlib 0.4 起 hookXhr 把回调参数收窄为
        // `string | Record<string, unknown> | Document`；
        // 这里已按 URL 分流，断言成对应响应类型。
        (response, requestUrl) => {
            if (requestUrl.includes('querySaleTemplate')) {
                handleResponseRoute['querySaleTemplate'](
                    response as unknown as QuerySaleTemplateResponse,
                );
            }
            if (requestUrl.includes('queryTemplateDetail')) {
                handleResponseRoute['queryTemplateDetail'](
                    response as unknown as QueryTemplateDetailResponse,
                );
            }
        },
    );
};
