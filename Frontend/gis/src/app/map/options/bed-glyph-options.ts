import { AggregationLevel } from './aggregation-level.enum';

export interface BedGlyphOptions {

    /**
     * show glyphs in general
     */
    enabled: boolean;

    /**
     * what type of glyph
     */
    aggregationLevel: AggregationLevel;

    /**
     * enable rectangle in glyph
     */
    showIcuLow: boolean;

    /**
     * enable rectanlge in glyph
     */
    showIcuHigh: boolean;

    /**
     * enable rectangle in glyph
     */
    showEcmo: boolean;

}