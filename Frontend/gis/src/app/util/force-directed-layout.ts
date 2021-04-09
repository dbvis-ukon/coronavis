import { forceX, forceY } from 'd3';
import { forceSimulation, Simulation } from 'd3-force';
import { Observable, Subject } from 'rxjs';
import { MAP_FORCE_CACHE_KEY } from '../../constants';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { MyLocalStorageService } from '../services/my-local-storage.service';
import { BBox, CBBbox, rectCollide } from './rect-collide';

interface ForceDirectedLayoutEvent<D> {
  type: 'tick' | 'end';

  zoom: number;

  data: D;
}

interface FDGItem {
  x: number;
  y: number;
  _x: number;
  _y: number;
}

export class ForceDirectedLayout<D extends FDGItem> {

  private levelPositionMap: { [key: number]: number[][] };
  private sim: Simulation<D, any>;

  private data: D[];

  private cacheKey: string;

  private obs$: Subject<ForceDirectedLayoutEvent<D[]>> = new Subject();

  constructor(private storage: MyLocalStorageService,
              aggregationLevel: AggregationLevel) {

    this.cacheKey = MAP_FORCE_CACHE_KEY + aggregationLevel;


    // = new Map<number, Array<[number, number]>>();
  }

  public getEvents(): Observable<ForceDirectedLayoutEvent<D[]>> {
    return this.obs$.asObservable();
  }

  public update(glyphSizes: BBox & CBBbox, data: D[], zoom: number) {
    if (this.sim) {
      this.sim.stop();
    }

    this.data = data;

    this.sim = forceSimulation(data)
    // .alpha(0.1)
    // .alphaMin(0.0001)
    .stop();

    this.loadOrInvalidateCache();

    const useCache = false;

    // load from cache and update positions
    if (this.levelPositionMap[zoom] && useCache) {
      const positions = this.levelPositionMap[zoom];
      this.data.forEach((d, i) => {
        const cached = positions[i];
        d.x = cached[0];
        d.y = cached[1];
      });

      this.obs$.next({
        type: 'end',
        zoom,
        data: this.data
      });
    } else { // run simulation
      this.data.forEach(d => {
        d.x = d._x;
        d.y = d._y;
      });
      this.sim.force('collide', (rectCollide(glyphSizes).strength(0.3) as any).iterations(10) as any)
      .force('x', forceX<D>().x(d => d._x).strength(0.5))
      .force('y', forceY<D>().y(d => d._y).strength(0.2))
      .alphaDecay(0.3)
      // .alpha(0.1)
      //  .velocityDecay(0.6)
        .restart()
        // .on('tick', () => this.obs$.next({
        //   type: 'tick',
        //   zoom: zoom,
        //   data: data
        // }))
        .on('end', () => this.forceComplete(zoom));
    }
  }

  private forceComplete(zoom) {
    // persist to cache
    const positions = [];
    this.data.forEach((d) => {
      positions.push([d.x, d.y]);
    });
    this.levelPositionMap[zoom] = positions;
    this.storage.store(this.cacheKey, JSON.stringify(this.levelPositionMap));

    this.obs$.next({
      type: 'end',
      zoom,
      data: this.data
    });
  }

  private loadOrInvalidateCache() {
    const cachedLayoutForAggLevel: { [key: number]: number[][] } = JSON.parse(this.storage.retrieve(this.cacheKey)) ?? {};
    if (Object.keys(cachedLayoutForAggLevel).length > 0) {
      if (Array.from(Object.values(cachedLayoutForAggLevel)).every(levelCache => levelCache.length === this.data.length)) {
        this.levelPositionMap = cachedLayoutForAggLevel;
      } else {
        // Cache length does not match current data;
        this.levelPositionMap = {};
        this.storage.clear(this.cacheKey);
      }
    } else {
      this.levelPositionMap = {};
      this.storage.clear(this.cacheKey);
    }
  }

}
