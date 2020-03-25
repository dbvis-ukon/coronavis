import { BedType } from './bed-type.enum';
import { AggregationLevel } from './aggregation-level.enum';

export interface BedBackgroundOptions {

    enabled: boolean;

    aggregationLevel: AggregationLevel;

    bedType: BedType;

}