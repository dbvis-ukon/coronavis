"""
DIVI - Hospitals with their capacities
https://www.divi.de/register/intensivregister?view=items
"""
import db

import time
import pandas
import traceback

import requests

from sqlalchemy import func

from geoalchemy2.shape import to_shape 

import logging
logger = logging.getLogger(__name__)


def legends(class_input):
    if class_input == None:
        return 'Nicht verfügbar'
    if 'NICHT_VERFUEGBAR' in class_input:
        return 'Ausgelastet'
    if 'VERFUEGBAR' in class_input:
        return 'Verfügbar'
    if 'BEGRENZT' in class_input:
        return 'Begrenzt'
    return ''


def remove_spaces(text):
    text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    text = text.strip()
    text = ' '.join(text.split())
    return text


def get_geo_location(adress):
    osm_geolocator = Nominatim(user_agent='COVID-19', timeout=10)
    arcgis_geolocator = ArcGIS()
    photon_geolocator = Photon()
    
    location = osm_geolocator.geocode(adress)
    loc = (None, None)
    if location != None:
        loc = (location.longitude, location.latitude)
    else:
        location = arcgis_geolocator.geocode(adress)
        if location != None:
            loc = (location.longitude, location.latitude)
        else:
            location = photon_geolocator.geocode(adress)
            if location != None:
                loc = (location.longitude, location.latitude)
        
    return loc, location


def crawl_webpage(url):
    
    r = requests.get(url)
    rj = r.json()

    print(rj['rowCount'])
    
    url_melde = 'https://www.intensivregister.de/api/public/stammdaten/krankenhausstandort/{0}/meldebereiche'
    
    hospital_entries = []
    hospital_entries_extended = []
    hospital_beds_entries_extended = []
    
    len_ = len(rj['data'])
    for i, x in enumerate(rj['data']):
        logger.info(str(i) + ' / ' + str(len_))
        
        name = x['krankenhausStandort']['bezeichnung']
        
        address = str(x['krankenhausStandort']['strasse'])
        address += ' '
        address += str(x['krankenhausStandort']['hausnummer'])
        address += ' '
        address += str(x['krankenhausStandort']['plz'])
        address += ' '
        address += str(x['krankenhausStandort']['ort'])
        
        state = x['krankenhausStandort']['bundesland']
        
        location = '('
        location += str(x['krankenhausStandort']['position']['longitude'])
        location += ' '
        location += str(x['krankenhausStandort']['position']['latitude'])
        location += ')'
        
        icu_low_state = legends(x['bettenStatus']['statusLowCare'])
        
        icu_high_state = legends(x['bettenStatus']['statusHighCare'])
        
        ecmo_state = legends(x['bettenStatus']['statusECMO'])
        
        last_update = x['meldezeitpunkt']
        
        hospital_id = x['id']
        
        tmp_url = url_melde.format(str(hospital_id))
        r_melde = requests.get(tmp_url)
        rj_melde = r_melde.json()
        
        contact = ''
        for y in rj_melde:
            if len(y['ansprechpartner']):
                for c in y['ansprechpartner']:
                    contact += str(c['zustaendigkeit']['bezeichnung']) + ' : ' + str(c['nachname']) + ' : Tel. ' + str(c['telefonnummer'])
                    contact += ', '
            else:
                for c in y['tags']:
                    contact += c
                    contact += ', '
                
        contact = contact[:-2]
        if len(contact) > 255:
            contact = contact[:250]
        
        hospital_entry = [
            name,
            address,
            contact,
            state,
            icu_low_state,
            icu_high_state,
            ecmo_state,
            last_update,
            location
        ]
        
        hospital_entries.append(hospital_entry)
    
    return hospital_entries


def full_fetch(quote_page):
    hospital_entries = crawl_webpage(quote_page)
    
    df = pandas.DataFrame(hospital_entries, columns=[
        'name', 
        'address', 
        'contact', 
        'state', 
        'icu_low_state', 
        'icu_high_state', 
        'ecmo_state', 
        'last_update', 
        'location'])
    df['last_update'] =  pandas.to_datetime(df['last_update'])
    
    return df


if __name__ == "__main__":
    
    try:

        query_page = 'https://www.intensivregister.de/api/public/intensivregister?page=0&size=10000'

        df = full_fetch(query_page)
        
        df['location'] = df['location'].map(lambda x: str(x).replace('None', '0'))
        df['location'] = df['location'].map(lambda x: 'SRID=4326;POINT' + x.replace(',', ''))
        
        crawl = db.Crawl(**{
            'url': query_page,
            'text': df.to_json(),
            'doc': df.to_json(),
        })
        db.sess.add(crawl)
        
        for index, row in df.iterrows():
            hospital = db.Hospital(**row.to_dict())
            logger.info(hospital)
            db.sess.add(hospital)

        db.sess.commit()
        
        exit(0)
    
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(e)
        logger.error(tb)
        
        exit(-1)
