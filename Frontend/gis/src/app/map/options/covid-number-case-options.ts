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

    deaths = 'deaths',

    patients = 'patients',

    patientsVentilated = 'patientsVentilated',

    bedOccupancyPercent = 'bedOccupancyPercent'

  }

export enum CovidNumberCaseNormalization {

  absolut = 'absolute',

  'per100k' = 'per100k'

}

export enum CovidNumberCaseDataSource {
  rki = 'rki',
  risklayer = 'risklayer',
  divi = 'divi',
  survstat = 'survstat'
}

export interface CovidNumberCaseOptions {

    enabled?: boolean;

    date: string;

    dataSource: CovidNumberCaseDataSource;

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

    /**
     * The 4. Bevölkerungsschutzgesetz states that
     * all counties that have an 7-day-incidence over x for 3 days
     * and not under x for at least 5 workdays, special regulations will take place.
     * This option sets the threshold to x = 100 or x = 165 respectively.
     * More info: https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/guv-19-lp/4-bevschg-faq.html#c21121
     */
    eBrakeOver?: null | 100 | 165;


    _binHovered?: [number, number];

    _binSelection?: [number, number][];

  }
