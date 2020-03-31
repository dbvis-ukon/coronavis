import { FeatureCollection, Polygon } from 'geojson';

export interface QuantitativeAggregatedRkiCases extends FeatureCollection<Polygon, QuantitativeAggregatedRkiCasesProperties> { }

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