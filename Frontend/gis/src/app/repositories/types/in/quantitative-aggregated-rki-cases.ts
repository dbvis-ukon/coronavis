import { FeatureCollection, Polygon } from 'geojson';

export interface QuantitativeAggregatedRkiCases extends FeatureCollection<Polygon, QuantitativeAggregatedRkiCasesProperties> { }

export interface QuantitativeAggregatedRkiCasesOverTime extends FeatureCollection<Polygon, QuantitativeAggregatedRkiCasesOverTimeProperties> { }

export interface QuantitativeAggregatedRkiCasesOverTimeProperties {
  last: QuantitativeAggregatedRkiCaseNumberProperties;
  yesterday: QuantitativeAggregatedRkiCaseNumberProperties;
  threeDaysAgo: QuantitativeAggregatedRkiCaseNumberProperties;

  name: string;
  until: Date;
  bevoelkerung: number;
}

export interface QuantitativeAggregatedRkiCaseNumberProperties {
  cases: number;
  deaths: number;
}

export interface QuantitativeAggregatedRkiCasesProperties extends QuantitativeAggregatedRkiCaseNumberProperties {
    bevoelkerung: number;
    ids: string;
    name: string;
    until: Date;
}
