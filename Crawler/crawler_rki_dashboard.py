"""
Bundesländer
https://experience.arcgis.com/experience/478220a4c454480e823b17327b2bf1d4/page/page_0/
Landkreise
https://experience.arcgis.com/experience/478220a4c454480e823b17327b2bf1d4/page/page_1/
"""
import re
import time
import pandas

from requests_html import HTMLSession

import db


def remove_spaces(text):
    text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    text = text.strip()
    text = ' '.join(text.split())
    return text


def crawl_webpage(url):

    session = HTMLSession()
    r = session.get(url)
    r.html.render(sleep=10, keep_page=True)

    entries = []
    for entry in r.html.find('.feature-list', first=True).find('.feature-list-item'):
        data = re.split(r'\s{2,}', entry.text.replace(u'\xa0', u' ').replace(',', ''))
        entries.append(data)
    
    return entries
    
    
def full_fetch(quote_page):
    entries = crawl_webpage(quote_page)

    df = pandas.DataFrame(entries, columns=['cases', 'deaths', 'name'])
    df['cases'] = df['cases'].astype('int')
    df['deaths'] = df['deaths'].astype('int')
    
    return df


if __name__ == "__main__":
    
    print('Start ArcGIS Crawling')

    quote_page = 'https://npgeo-de.maps.arcgis.com/apps/opsdashboard/index.html#/bca904a683844e7784141559b540dbc2'

    df = full_fetch(quote_page)
    
    for index, row in df.iterrows():
        covid19caseslk = db.Covid19CasesLK(**row.to_dict())
        print(covid19caseslk)
        db.sess.add(covid19caseslk)

    db.sess.commit()
    
    quote_page = 'https://npgeo-de.maps.arcgis.com/apps/opsdashboard/index.html#/2694322fc7894bf5886647f652f093ca'

    df = full_fetch(quote_page)
    
    for index, row in df.iterrows():
        covid19casesbl = db.Covid19CasesBL(**row.to_dict())
        print(covid19casesbl)
        db.sess.add(covid19casesbl)

    db.sess.commit()
    
    print('Done')
    
    
    
