import { FeatureCollection, Polygon } from 'geojson';
import { QuantitativeAggregatedRkiCaseNumberProperties } from 'src/app/repositories/types/in/quantitative-aggregated-rki-cases';

export interface QuantitativeAggregatedRkiCasesOverTime extends FeatureCollection<Polygon, QuantitativeAggregatedRkiCasesOverTimeProperties> { }

export interface QuantitativeAggregatedRkiCasesOverTimeProperties {
  last: QuantitativeAggregatedRkiCaseNumberProperties;
  yesterday: QuantitativeAggregatedRkiCaseNumberProperties;
  threeDaysAgo: QuantitativeAggregatedRkiCaseNumberProperties;

  name: string;
  until: Date;
  bevoelkerung: number;
}