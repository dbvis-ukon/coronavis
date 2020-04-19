import { Point } from 'leaflet';
import { CanvasLayer, IViewInfo } from 'src/app/util/ts-canvas-layer';

export class TestCanvasLayer extends CanvasLayer {
  

  public onDrawLayer(options: IViewInfo) {
    const ctx = options.canvas.getContext('2d');

    const data = [];

    for(let i = 0; i < 1000; i++) {
      data.push([Math.random() + 47, Math.random() + 8]);
    }

    let dot: Point;
    ctx.clearRect(0, 0, options.canvas.width, options.canvas.height);
    ctx.fillStyle = "rgba(255,116,0, 0.2)";
    for (var i = 0; i < data.length; i++) {
        var d = data[i];
        if (options.bounds.contains([d[0], d[1]])) {
            dot = this._map.latLngToContainerPoint([d[0], d[1]]);
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }
  }
}