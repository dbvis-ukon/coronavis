import { FeatureCollection, Polygon } from 'geojson';

export interface QuantitativeAggregatedRkiCases extends FeatureCollection<Polygon, QuantitativeAggregatedRkiCasesProperties> {
    
}

export interface QuantitativeAggregatedRkiCasesProperties {
    bevoelkerung: number;
    cases: number;
    deaths: number; 
    ids: string;
    name: string;
    until: Date;
}