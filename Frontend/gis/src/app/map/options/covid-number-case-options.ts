import { AggregationLevel } from './aggregation-level.enum';

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

    dataSource: 'rki' | 'risklayer';

    /**
     * The number of days used for the regression
     */
    daysForTrend: number;

    change: CovidNumberCaseChange;

    timeWindow: CovidNumberCaseTimeWindow;

    type: CovidNumberCaseType;

    normalization: CovidNumberCaseNormalization;

    aggregationLevel?: AggregationLevel;

    showLabels: boolean;

    showTrendGlyphs: boolean;

    /**
     * In the risk layer data there is data which has last_updated = null meaning
     * that has not been updated today. This flag allows the user to only see the
     * available counties. By default the numbers of yesterday are being shown.
     */
    showOnlyAvailableCounties: boolean;


    _binHovered?: [number, number];

    _binSelection?: [number, number][];

  }
