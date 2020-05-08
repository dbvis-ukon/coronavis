import { AggregationLevel } from "./aggregation-level.enum";

export enum CovidNumberCaseChange {
    absolute = 'abs',

    relative = 'rel'
  }

  export enum CovidNumberCaseTimeWindow {

    twentyFourhours = '24h',

    seventyTwoHours = '72h',

    sevenDays = '7d',

    all = 'all',
  }

  export enum CovidNumberCaseType {

    cases = 'cases',

    deaths = 'deaths'

  }

  export enum CovidNumberCaseNormalization {

    absolut = 'absolute',

    'per100k' = 'per100k'

  }

  export interface CovidNumberCaseOptions {

    enabled?: boolean;

    date: string;

    /**
     * The number of days used for the regression
     */
    daysForTrend: number;

    change: CovidNumberCaseChange;

    timeWindow: CovidNumberCaseTimeWindow;

    type: CovidNumberCaseType;

    normalization: CovidNumberCaseNormalization

    aggregationLevel?: AggregationLevel

  }
