import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';

export interface Region {
    aggLevel: AggregationLevel;
    id: string;
    name: string;
    description: string;
}
