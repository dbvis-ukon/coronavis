import { Component, OnInit } from '@angular/core';
import { ScaleOrdinal } from 'd3-scale';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';

@Component({
  selector: 'app-bed-inline-legend',
  templateUrl: './bed-inline-legend.component.html',
  styleUrls: ['./bed-inline-legend.component.less']
})
export class BedInlineLegendComponent implements OnInit {

  glyphLegendColors: string[] = QualitativeColormapService.bedStati;

  colormap: ScaleOrdinal<string, string>;

  constructor(
    private colormapservice: QualitativeColormapService
  ) { }

  ngOnInit(): void {
    this.colormap = this.colormapservice.getSingleHospitalColormap();
  }

  getGlyphColor(c: string): string {
    return this.colormap(c);
  }

}
