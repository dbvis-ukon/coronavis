import { Item } from 'src/app/services/chart.service';

export interface Dashboard {
    id: string;
    title: string;
    upvotes: number;
    visits: number;

    items: Item[];
}
