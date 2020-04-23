import { AggregationLevel } from './aggregation-level.enum';
import { BedType } from './bed-type.enum';

export interface BedBackgroundOptions {

    enabled: boolean;

    aggregationLevel: AggregationLevel;

    bedType: BedType;


    /**
     * A string formatted in YYYY-MM-DD
     */
    date: string | 'now';

}