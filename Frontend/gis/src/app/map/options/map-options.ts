import { BedBackgroundOptions } from './bed-background-options';
import { BedGlyphOptions } from './bed-glyph-options';
import { CovidNumberCaseOptions } from './covid-number-case-options';

export interface MapOptions {

  bedGlyphOptions: BedGlyphOptions;

  bedBackgroundOptions: BedBackgroundOptions;

  covidNumberCaseOptions: CovidNumberCaseOptions;

  showOsmHospitals: boolean;

  showOsmHeliports: boolean;

}
