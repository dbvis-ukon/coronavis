import {BedGlyphOptions} from './bed-glyph-options';
import {BedBackgroundOptions} from './bed-background-options';
import {CovidNumberCaseOptions} from './covid-number-case-options';
import {AggregationLevel} from "./aggregation-level.enum";

export interface MapOptions {

  bedGlyphOptions: BedGlyphOptions;

  bedBackgroundOptions: BedBackgroundOptions;

  covidNumberCaseOptions: CovidNumberCaseOptions;

  showOsmHospitals: boolean;

  showOsmHeliports: boolean;

}
