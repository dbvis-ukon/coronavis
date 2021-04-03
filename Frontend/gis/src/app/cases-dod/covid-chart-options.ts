import { CovidNumberCaseOptions } from '../map/options/covid-number-case-options';

export enum TimeGranularity {
    yearmonthdate = 'yearmonthdate',

    yearweek = 'yearweek'
}

export enum ScaleType {
    linear = 'linear',
    sqrt = 'sqrt',
    symlog = 'symlog'
}

export enum AgeGroupBinning {
    all = 'all',
    fiveyears = 'fiveyears',
    rki = 'rki'
}

export interface TemporalExtentOptions {
    type: 'local' | 'global' | 'manual';
    manualExtent: [string, string];
    manualLastDays: number | null;
}

export interface ValueExtentOptions {
    type: 'local' | 'global' | 'manual';
    manualExtent: [number, number];
}


export interface CovidChartOptions extends CovidNumberCaseOptions {
    timeAgg: TimeGranularity;

    scaleType: ScaleType;

    ageGroupBinning: AgeGroupBinning;

    temporalExtent: TemporalExtentOptions;

    valueExtent: ValueExtentOptions;
}
