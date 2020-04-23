
export interface QuantitativeBedStatusSummary{
  free: number;

  full: number;

  prognosis: number;

  in24h: number;
}

export interface QuantitativeCovid19Summary {
  aktuell: number;
  beatmet: number;
  kumulativ: number;
  verstorben: number;
}
