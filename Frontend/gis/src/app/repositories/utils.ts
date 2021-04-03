import { HttpParams } from '@angular/common/http';
import { Region } from './types/in/region';

export function prepareAggParams(dataRequests: Region[], ageGroups?: boolean): HttpParams {
    const map = new Map<string, string[]>();

    dataRequests.forEach(d => {
        if(!map.has(d.aggLevel)) {
        map.set(d.aggLevel, []);
        }

        map.get(d.aggLevel).push(d.id);
    });

    let params = new HttpParams();

    for (const [key, value] of map) {
        params = params.append(key, value.join(','));
    }

    if (ageGroups) {
        params = params.append('agegroups', 'true');
    }

    return params;
}
