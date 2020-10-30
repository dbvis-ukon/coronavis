export interface EmailSubscription {
  email: string;
  lang: 'de' | 'en';
  verified?: boolean;

  counties: {
    ags: string;
    sub_id?: number;
    county?: {
      ags: string;
      desc: string;
      name: string;
    }
  }[];
}