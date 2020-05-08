import moment, { Moment } from 'moment';

export function getMoment(strDate: string | Date): Moment {
  return strDate === 'now' ? moment() : moment(strDate);
}

export function getStrDate(date: Date | Moment): string {
  return moment(date).format('YYYY-MM-DD');
}