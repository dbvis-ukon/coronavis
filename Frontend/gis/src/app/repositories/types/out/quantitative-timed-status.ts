import { QuantitativeBedStatusSummary, QuantitativeCovid19Summary } from 'src/app/services/types/bed-status-summary';
import { AbstractTimedStatus } from '../in/qualitative-hospitals-development';

export interface QuantitativeTimedStatus extends AbstractTimedStatus {

    covid19: QuantitativeCovid19Summary;

    ecmo_faelle_jahr: number;

    icu_low_care: QuantitativeBedStatusSummary;

    icu_high_care: QuantitativeBedStatusSummary;

    ecmo_state: QuantitativeBedStatusSummary;

    quantitative: true;
}