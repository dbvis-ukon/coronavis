"""
Bundesländer
https://experience.arcgis.com/experience/478220a4c454480e823b17327b2bf1d4/page/page_0/
Landkreise
https://experience.arcgis.com/experience/478220a4c454480e823b17327b2bf1d4/page/page_1/
"""
import db

import time
import pandas

import requests

import logging
logger = logging.getLogger(__name__)


def remove_spaces(text):
    text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    text = text.strip()
    text = ' '.join(text.split())
    return text
    
    
def full_fetch_lk(url):
    
    r = requests.get(url)
    rj = r.json()
    
    entries = []
    for data in rj['features']:
        d = data['attributes']
        entry = [
            d['GEN'],
            d['BEZ'],
            d['BL'],
            d['county'],
            d['cases'],
            d['deaths'],
            d['EWZ'],
            d['death_rate'],
            d['cases_per_100k'],
            d['cases_per_population']
        ]
        entries.append(entry)
    
    json_str = str(rj)

    df = pandas.DataFrame(entries, columns=['name', 'desc', 'bl', 'county', 'cases', 'deaths', 'population', 'death_rate', 'cases_per_100k', 'cases_per_population'])
    df['cases'] = df['cases'].astype('int')
    df['deaths'] = df['deaths'].astype('int')
    df['population'] = df['population'].astype('int')
    df['death_rate'] = df['death_rate'].astype('float')
    df['cases_per_100k'] = df['cases_per_100k'].astype('float')
    df['cases_per_population'] = df['cases_per_population'].astype('float')
    
    return df, json_str


def full_fetch_bl(url):
    
    r = requests.get(url)
    rj = r.json()
    
    entries = []
    for data in rj['features']:
        d = data['attributes']
        entry = [
            d['LAN_ew_GEN'],
            d['LAN_ew_BEZ'],
            d['Fallzahl'],
            d['Death'],
            d['LAN_ew_EWZ']
        ]
        entries.append(entry)
    
    json_str = str(rj)

    df = pandas.DataFrame(entries, columns=['name', 'desc', 'cases', 'deaths', 'population'])
    df['cases'] = df['cases'].astype('int')
    df['deaths'] = df['deaths'].astype('int')
    df['population'] = df['population'].astype('int')
    
    return df, json_str


if __name__ == "__main__":
    
    try:
        
        logging.info('Start ArcGIS Crawling')

        quote_page = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=cases%20desc&outSR=102100&resultOffset=0&resultRecordCount=1000&cacheHint=true'

        df, json_str = full_fetch_lk(quote_page)
        
        for index, row in df.iterrows():
            caseslk = db.CasesLK(**row.to_dict())
            logging.info(caseslk)
            db.sess.add(caseslk)

        db.sess.commit()
        
        quote_page = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/Coronaf%C3%A4lle_in_den_Bundesl%C3%A4ndern/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Fallzahl%20desc&resultOffset=0&resultRecordCount=25&cacheHint=true'

        df, json_str = full_fetch_bl(quote_page)
        
        for index, row in df.iterrows():
            casesbl = db.CasesBL(**row.to_dict())
            logging.info(casesbl)
            db.sess.add(casesbl)

        db.sess.commit()
        
        logging.info('Done')
        
    except Exception as e:
        logger.error(e)
    
    
    
