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


export interface CovidChartOptions extends CovidNumberCaseOptions {
    timeAgg: TimeGranularity;

    scaleType: ScaleType;

    ageGroupBinning: AgeGroupBinning;
}
