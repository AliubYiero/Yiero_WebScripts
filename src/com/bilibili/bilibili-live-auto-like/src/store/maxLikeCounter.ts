import { GmStorage } from '@yiero/gmlib';

interface MaxLikeCounter {
    date: string;
    total: number;
    room: Record<string, number>;
}

export const maxLikeCounterStore = new GmStorage<MaxLikeCounter>(
    'maxLikeCounter',
    {
        date: '',
        total: 0,
        room: {},
    },
);
