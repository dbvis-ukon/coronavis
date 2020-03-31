
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