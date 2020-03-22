"""
DIVI - Beds with intensive care
https://www.divi.de/register/kartenansicht
"""
import json

import urllib.parse
import urllib.request

from bs4 import BeautifulSoup

import db

def get_html_content(url, data):
    data = urllib.parse.urlencode(data)
    data = data.encode('utf-8')
    page = urllib.request.urlopen(url, data)

    html_data = page.read()
    return html_data


def remove_spaces(text):
    text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    text = text.strip()
    text = ' '.join(text.split())
    return text


def crawl_webpage(url, data):
    
    html_data = get_html_content(url, data)

    soup = BeautifulSoup(html_data, 'html.parser')
    script_str = soup.body.script.text
    
    find_str = 'var spec = '
    sta_ = script_str.find(find_str)
    end_ = script_str.find('};', sta_)
    
    data = json.loads(script_str[sta_+len(find_str):end_+1])
    
    return data
    
    
if __name__ == "__main__":

    quote_page = 'https://www.divi.de/images/register/report2v.html'
    values = {}

    json_data = crawl_webpage(quote_page, values)
    with open('json_map_data.json', 'w') as f:
        json.dump(json_data, f)
        
    crawl = db.Crawl(**{
        'url': quote_page,
        'text': json.dumps(json_data),
        'doc': json.dumps(json_data),
    })
    db.sess.add(crawl)
    
    vegadata = db.VegaData(**{
        'text': json.dumps(json_data),
        'doc': json.dumps(json_data),
    })
    db.sess.add(vegadata)
    
    db.sess.commit()
    
    print('Crawling and inserting map done')
