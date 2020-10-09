import { forceX, forceY } from 'd3';
import { forceSimulation, Simulation } from 'd3-force';
import { FeatureCollection, Geometry } from 'geojson';
import { LocalStorageService } from 'ngx-webstorage';
import { Observable, Subject } from 'rxjs';
import { MAP_FORCE_CACHE_KEY } from '../../constants';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { ForceLayoutProperties } from '../repositories/types/out/abstract-hospital-out';
import { rectCollide } from './rect-collide';

interface ForceDirectedLayoutEvent<D> {
  type: 'tick' | 'end';

  zoom: number;

  data: D;
}

export class ForceDirectedLayout<G extends Geometry, P extends ForceLayoutProperties> {

  private levelPositionMap: { [key: number]: number[][] };
  private sim: Simulation<P, any>;

  private data: FeatureCollection<G, P>;

  private cacheKey: string;

  private obs$: Subject<ForceDirectedLayoutEvent<FeatureCollection<G, P>>> = new Subject();

  constructor(private storage: LocalStorageService,
              aggregationLevel: AggregationLevel) {

    this.cacheKey = MAP_FORCE_CACHE_KEY + aggregationLevel;


    // = new Map<number, Array<[number, number]>>();
  }

  public getEvents(): Observable<ForceDirectedLayoutEvent<FeatureCollection<G, P>>> {
    return this.obs$.asObservable();
  }

  private forceComplete(zoom) {
    // persist to cache
    const positions = [];
    this.data.features.forEach((d) => {
      positions.push([d.properties.x, d.properties.y]);
    });
    this.levelPositionMap[zoom] = positions;
    this.storage.store(this.cacheKey, JSON.stringify(this.levelPositionMap));

    this.obs$.next({
      type: 'end',
      zoom,
      data: this.data
    });
  }

  public update(glyphSizes: number[][], data: FeatureCollection<G, P>, zoom: number) {
    if (this.sim) {
      this.sim.stop();
    }

    this.data = data;

    this.sim = forceSimulation(this.data.features.map(d => d.properties))
    // .alpha(0.1)
    // .alphaMin(0.0001)
    .stop();

    this.loadOrInvalidateCache();

    const useCache = false;

    // load from cache and update positions
    if (this.levelPositionMap[zoom] && useCache) {
      const positions = this.levelPositionMap[zoom];
      this.data.features.forEach((d, i) => {
        const cached = positions[i];
        d.properties.x = cached[0];
        d.properties.y = cached[1];
      });

      this.obs$.next({
        type: 'end',
        zoom,
        data: this.data
      });
    } else { // run simulation
      this.data.features.forEach(d => {
        d.properties.x = d.properties._x;
        d.properties.y = d.properties._y;
      });
      this.sim.force('collide', (rectCollide(glyphSizes).strength(0.5) as any).iterations(2) as any)
      .force('x', forceX<P>().x(d => d._x).strength(1))
      .force('y', forceY<P>().y(d => d._y).strength(0.5))
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

  private loadOrInvalidateCache() {
    const cachedLayoutForAggLevel: { [key: number]: number[][] } = JSON.parse(this.storage.retrieve(this.cacheKey)) ?? {};
    if (Object.keys(cachedLayoutForAggLevel).length > 0) {
      if (Array.from(Object.values(cachedLayoutForAggLevel)).every(levelCache => levelCache.length === this.data.features.length)) {
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
