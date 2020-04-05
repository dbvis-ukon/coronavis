import {BedGlyphOptions} from './bed-glyph-options';
import {BedBackgroundOptions} from './bed-background-options';
import {CovidNumberCaseOptions} from './covid-number-case-options';

export interface MapOptions {

  /**
   * Extend the infobox
   */
  extendInfobox: boolean;

  /**
   * Completely hide the infobox inclusive the toggle button
   */
  hideInfobox: boolean;

  /**
   * Show help dialog on start
   */
  showHelpOnStart: boolean;

  bedGlyphOptions: BedGlyphOptions;

  bedBackgroundOptions: BedBackgroundOptions;

  covidNumberCaseOptions: CovidNumberCaseOptions;

  showOsmHospitals: boolean;

  showOsmHeliports: boolean;

}
