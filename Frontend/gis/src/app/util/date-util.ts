import moment, { Moment } from 'moment';

const seenInput = new Set();

export function getMoment(strDate: string, tzIndependent: boolean = true): Moment {
  let res;
  if(tzIndependent) {
    res =  strDate === 'now' ? moment.utc() : moment.utc(strDate);
  } else {
    res =  strDate === 'now' ? moment() : moment(strDate);
  }

  if(!seenInput.has(strDate)) {
    console.log('input', strDate, 'output', res.toISOString());
    seenInput.add(strDate);
  }

  return res;
}

export function getStrDate(date: Moment): string {
  return date.utc().format('YYYY-MM-DD');
}