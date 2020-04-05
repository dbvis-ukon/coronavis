import { AggregationLevel } from './aggregation-level.enum';
import { BedType } from './bed-type.enum';

export interface BedBackgroundOptions {

    enabled: boolean;

    aggregationLevel: AggregationLevel;

    bedType: BedType;

}