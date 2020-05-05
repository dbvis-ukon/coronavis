"""
DIVI - Hospitals with their capacities
https://www.divi.de/register/intensivregister?view=items
"""
import logging
import sys
import time
import traceback

import pandas

from sqlalchemy import func
from sqlalchemy.sql import null

import db
import requests

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

logger.addHandler(handler)


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



def get_attr_if_exists(dict_, key_):
    if key_ in dict_:
        return dict_[key_]
    else:
        return None



def crawl_webpage(url):
    
    r = requests.get(url)
    rj = r.json()

    logger.debug(rj['rowCount'])
    
    url_melde = 'https://www.intensivregister.de/api/public/stammdaten/krankenhausstandort/{0}/meldebereiche'
    
    hospital_entries = []
    hospital_entries_extended = []
    hospital_beds_entries_extended = []
    
    len_ = len(rj['data'])
    for i, x in enumerate(rj['data']):
        logger.debug(str(i) + ' / ' + str(len_))
        
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
        
        hospital_id = int(x['id'])
        
        covid_cases = get_attr_if_exists(x, 'faelleCovidAktuell')
        if covid_cases is not None:
            covid_cases = int(covid_cases)
        else:
            covid_cases = null()
        
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
                    
            hospital_id_beds = int(y['krankenhausStandort']['id'])
            name_beds = y['bezeichnung']
            casesecmoyear_beds = int(y['faelleEcmoJahr'])
            available_beds_beds = int(y['bettenPlankapazitaet'])
            description_beds = y['bettenPlankapazitaet']
            last_update_beds = y['letzteMeldung']
            if last_update_beds is None:
                last_update_beds = null()
            beds_beds = y['krankenhausStandort']['intensivmedizinischePlanbetten']
            if beds_beds is not None:
                beds_beds = int(beds_beds)
            else:
                beds_beds = null()
            
            beds = [
                hospital_id_beds,
                name_beds,
                available_beds_beds,
                casesecmoyear_beds,
                beds_beds,
                description_beds,
                last_update_beds
            ]
            
            hospital_beds_entries_extended.append(beds)        
            
                
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
        
        hospital_entry = [
            hospital_id,
            name,
            address,
            contact,
            state,
            icu_low_state,
            icu_high_state,
            ecmo_state,
            last_update,
            location,
            covid_cases
        ]
        
        hospital_entries_extended.append(hospital_entry)
    
    return hospital_entries, hospital_entries_extended, hospital_beds_entries_extended


def full_fetch(quote_page):
    hospital_entries, hospital_entries_extended, hospital_entries_extended_beds = crawl_webpage(quote_page)
    
    df_hospital = pandas.DataFrame(hospital_entries, columns=[
        'name', 
        'address', 
        'contact', 
        'state', 
        'icu_low_state', 
        'icu_high_state', 
        'ecmo_state', 
        'last_update', 
        'location'])
    df_hospital['last_update'] =  pandas.to_datetime(df_hospital['last_update'])
    
    df_hospital_extended = pandas.DataFrame(hospital_entries_extended, columns=[
        'hospital_id',
        'name', 
        'address', 
        'contact', 
        'state', 
        'icu_low_state', 
        'icu_high_state', 
        'ecmo_state', 
        'last_update', 
        'location',
        'covid_cases'])
    df_hospital_extended['last_update'] =  pandas.to_datetime(df_hospital_extended['last_update'])
    
    df_beds = pandas.DataFrame(hospital_entries_extended_beds, columns=[
        'hospital_id', 
        'name', 
        'available_beds', 
        'cases_ecmo_year', 
        'overall_beds', 
        'description', 
        'last_update'])
    df_beds['last_update'] =  pandas.to_datetime(df_beds['last_update'], errors='ignore')
    
    return df_hospital, df_hospital_extended, df_beds


if __name__ == "__main__":
    
    try:

        query_page = 'https://www.intensivregister.de/api/public/intensivregister?page=0&size=10000'

        df_hospital, df_hospital_extended, df_beds = full_fetch(query_page)
        
        df_hospital['location'] = df_hospital['location'].map(lambda x: str(x).replace('None', '0'))
        df_hospital['location'] = df_hospital['location'].map(lambda x: 'SRID=4326;POINT' + x.replace(',', ''))
        
        df_hospital_extended['location'] = df_hospital_extended['location'].map(lambda x: str(x).replace('None', '0'))
        df_hospital_extended['location'] = df_hospital_extended['location'].map(lambda x: 'SRID=4326;POINT' + x.replace(',', ''))
        
        for index, row in df_hospital.iterrows():
            hospital = db.Hospital(**row.to_dict())
            logger.info(hospital)
            db.sess.add(hospital)

        db.sess.commit()
        
        for index, row in df_hospital_extended.iterrows():
            hospital = db.HospitalExtended(**row.to_dict())
            if db.sess.query(db.HospitalExtended.id).filter_by(last_update=hospital.last_update).filter_by(hospital_id=hospital.hospital_id).scalar() is None:
                logger.info(hospital)
                db.sess.add(hospital)

        db.sess.commit()
        
        for index, row in df_beds.iterrows():
            bed = db.Beds(**row.to_dict())
            if db.sess.query(db.Beds.id).filter_by(last_update=bed.last_update).filter_by(hospital_id=bed.hospital_id).scalar() is None:
                logger.info(bed)
                db.sess.add(bed)

        db.sess.commit()
        
        db.sess.execute("REFRESH MATERIALIZED VIEW filled_hospital_timeseries_with_fix")
        db.sess.commit()

        exit(0)
    
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(str(e) + '\n' + str(tb))
        
        exit(1)
