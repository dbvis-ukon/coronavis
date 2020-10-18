import {AggregationLevel} from '../map/options/aggregation-level.enum';

export function aggLevelToEndpointMulti(aggLevel: AggregationLevel): string {
    return aggLevel;
}

export function aggLevelToEndpointSingle(aggLevel: AggregationLevel): string {
    let aggEndpoint = '';
    switch (aggLevel) {
      case AggregationLevel.county:
        aggEndpoint = 'landkreis';
        break;

      case AggregationLevel.governmentDistrict:
        aggEndpoint = 'regierungsbezirk';
        break;

      case AggregationLevel.state:
        aggEndpoint = 'bundesland';
        break;

      case AggregationLevel.country:
        aggEndpoint = 'land';
        break;

      default:
        throw new Error('Aggregation level ' + aggLevel + ' unknown');
    }
    return aggEndpoint;
}
