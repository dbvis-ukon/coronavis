import { QuantitativeCovid19Summary, QuantitativeBedStatusSummary } from 'src/app/services/types/bed-status-summary';
import { AbstractTimedStatus } from '../in/qualitative-hospitals-development';

export interface haxx {}

export interface QuantitativeTimedStatus extends AbstractTimedStatus, haxx {

    covid19: QuantitativeCovid19Summary;

    ecmo_faelle_jahr: number;

    icu_low_care: QuantitativeBedStatusSummary;

    icu_high_care: QuantitativeBedStatusSummary;

    ecmo_state: QuantitativeBedStatusSummary;

    quantitative: true;
}