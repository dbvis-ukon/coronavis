import moment, { Moment } from 'moment';


export function getMoment(strDate: string): Moment {
  let res: Moment;
  if(strDate === 'now') {
    res = moment.utc();
  } else if(strDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    res = moment.utc(strDate, 'YYYY-MM-DD', true);
  } else if(strDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    res = moment.utc(strDate, 'YYYY-MM-DD[T]HH:mm:ss', true)
  } else if(strDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) { //2020-05-03T16:39:00.353Z
    res = moment.utc(strDate, 'YYYY-MM-DD[T]HH:mm:ss[.]SSSZ', true)
  } else {
    console.warn('unknown date time format', strDate);
    res = moment.utc(strDate);
  }

  if(!res || !res.isValid()) {
    throw 'invalid date ' + res;
  }

  return res;
}

export function getStrDate(date: Moment): string {
  return date.utc().format('YYYY-MM-DD');
}