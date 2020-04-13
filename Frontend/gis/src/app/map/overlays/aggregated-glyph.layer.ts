import { MatDialog } from '@angular/material/dialog';
import { Selection } from 'd3-selection';
import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import { LocalStorageService } from 'ngx-webstorage';
import { Observable } from "rxjs";
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from '../../services/tooltip.service';
import { AggregationLevel } from "../options/aggregation-level.enum";
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { AbstractGlyphLayer } from './abstract-glyph.layer';
import { GlyphLayer } from "./GlyphLayer";

export class AggregatedGlyphLayer extends AbstractGlyphLayer < MultiPolygon, AggregatedHospitalOut < QualitativeTimedStatus >> implements GlyphLayer {

  constructor(
    name: string,
    granularity: AggregationLevel,
    data: FeatureCollection < MultiPolygon, AggregatedHospitalOut < QualitativeTimedStatus >> ,
    tooltipService: TooltipService,
    colormapService: QualitativeColormapService,
    forceEnabled: boolean,
    glyphOptions: Observable < BedGlyphOptions > ,
    dialog: MatDialog,
    storage: LocalStorageService
  ) {
    super(name, data, granularity, tooltipService, colormapService, forceEnabled, glyphOptions, dialog, storage);

    this.rectPadding = 2;

    this.rectYOffset = 2;

  }

  latAcc(d: Feature < MultiPolygon, AggregatedHospitalOut < QualitativeTimedStatus >> ): number {
    return d.properties.centroid.coordinates[1];
  }

  lngAcc(d: Feature < MultiPolygon, AggregatedHospitalOut < QualitativeTimedStatus >> ): number {
    return d.properties.centroid.coordinates[0];
  }

  getTransformPixelPosition(p: L.Point): L.Point {
    // to move the glyph into the center
    const newpt = {
      x: p.x - ((3 * this.rectSize + this.rectPadding * 3) / 2),
      y: p.y - (22 / 2)
    } as L.Point;


    // console.log('transformd', p, newpt);

    return newpt;
  }

  appendText(container: Selection < SVGGElement, Feature < MultiPolygon, AggregatedHospitalOut < QualitativeTimedStatus >> , SVGSVGElement, unknown > ) {
    container
      .append('text')
      .attr('class', 'text-bg aggName')
      .text(d1 => {
        return d1.properties.name;
      })
      .attr('x', (this.rectPadding + 3 * this.rectSize + 4 * this.rectPadding) / 2)
      .attr('y', '22');


    container
      .append('text')
      .attr('class', 'text-fg aggName')
      .text(d1 => d1.properties.name)
      .attr('x', (this.rectPadding + 3 * this.rectSize + 4 * this.rectPadding) / 2)
      .attr('y', '22');
  }

  onZoomed() {
    const zoom = this.map.getZoom();

    let level = 9;
    if (this.granularity === AggregationLevel.governmentDistrict) {
      level = 11;
    } else if (this.granularity === AggregationLevel.state) {
      level = 12;
    }

    const scale = Math.pow(level / (zoom), 3);

    this.gHospitals
      .selectAll('g.container')
      .transition()
      .duration(100)
      .attr('transform', () => {
        return `scale(${scale}, ${scale})`;
      });

    if (!this.visible) {
      return;
    }

    if (this.forceEnabled) {
      const glyphBoxes = [
        [-this.glyphSize.width * scale / 2, -this.glyphSize.height * scale / 2],
        [this.glyphSize.width * scale / 2, this.glyphSize.height * scale / 2]
      ];
      this.forceLayout.update(glyphBoxes, zoom);
    }
  }

}
