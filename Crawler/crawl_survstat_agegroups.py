import datetime
import logging
import math

import pandas as pd
import pandas.io.sql as sqlio
from zeep import Client

# code from https://github.com/rgieseke/opencoviddata/blob/main/scripts/fetch-county.py
# and adapted by Maximilian Fischer and Wolfgang Jentner
import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras
# noinspection PyUnresolvedReferences
import loadenv
from db_config import SQLALCHEMY_DATABASE_URI, get_connection

start = datetime.datetime.now()

logging.getLogger("zeep").setLevel(logging.INFO)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logging.getLogger('urllib3.connectionpool').setLevel(logging.INFO)

state_ids = {
    "Baden-Württemberg": "08",
    "Bayern": "09",
    "Berlin": "11",
    "Brandenburg": "12",
    "Bremen": "04",
    "Hamburg": "02",
    "Hessen": "06",
    "Mecklenburg-Vorpommern": "13",
    "Niedersachsen": "03",
    "Nordrhein-Westfalen": "05",
    "Rheinland-Pfalz": "07",
    "Saarland": "10",
    "Sachsen": "14",
    "Sachsen-Anhalt": "15",
    "Schleswig-Holstein": "01",
    "Thüringen": "16",
}

counties = {
    "LK Ahrweiler": {"State": "07", "Region": "DEB1", "County": "07131"},
    "LK Aichach-Friedberg": {"State": "09", "Region": "DE27", "County": "09771"},
    "LK Alb-Donau-Kreis": {"State": "08", "Region": "DE14", "County": "08425"},
    "LK Altenburger Land": {"State": "16", "Region": "DEG0", "County": "16077"},
    "LK Altenkirchen": {"State": "07", "Region": "DEB1", "County": "07132"},
    "LK Altmarkkreis Salzwedel": {"State": "15", "Region": "DEE0", "County": "15081"},
    "LK Altötting": {"State": "09", "Region": "DE21", "County": "09171"},
    "LK Alzey-Worms": {"State": "07", "Region": "DEB3", "County": "07331"},
    "LK Amberg-Sulzbach": {"State": "09", "Region": "DE23", "County": "09371"},
    "LK Ammerland": {"State": "03", "Region": "DE94", "County": "03451"},
    "LK Anhalt-Bitterfeld": {"State": "15", "Region": "DEE0", "County": "15082"},
    "LK Ansbach": {"State": "09", "Region": "DE25", "County": "09571"},
    "LK Aschaffenburg": {"State": "09", "Region": "DE26", "County": "09671"},
    "LK Augsburg": {"State": "09", "Region": "DE27", "County": "09772"},
    "LK Aurich": {"State": "03", "Region": "DE94", "County": "03452"},
    "LK Bad Dürkheim": {"State": "07", "Region": "DEB3", "County": "07332"},
    "LK Bad Kissingen": {"State": "09", "Region": "DE26", "County": "09672"},
    "LK Bad Kreuznach": {"State": "07", "Region": "DEB1", "County": "07133"},
    "LK Bad Tölz-Wolfratshausen": {"State": "09", "Region": "DE21", "County": "09173"},
    "LK Bamberg": {"State": "09", "Region": "DE24", "County": "09471"},
    "LK Barnim": {"State": "12", "Region": "DE40", "County": "12060"},
    "LK Bautzen": {"State": "14", "Region": "DED2", "County": "14625"},
    "LK Bayreuth": {"State": "09", "Region": "DE24", "County": "09472"},
    "LK Berchtesgadener Land": {"State": "09", "Region": "DE21", "County": "09172"},
    "LK Bergstraße": {"State": "06", "Region": "DE71", "County": "06431"},
    "LK Bernkastel-Wittlich": {"State": "07", "Region": "DEB2", "County": "07231"},
    "LK Biberach": {"State": "08", "Region": "DE14", "County": "08426"},
    "LK Birkenfeld": {"State": "07", "Region": "DEB1", "County": "07134"},
    "LK Bitburg-Prüm": {"State": "07", "Region": "DEB2", "County": "07232"},
    "LK Bodenseekreis": {"State": "08", "Region": "DE14", "County": "08435"},
    "LK Borken": {"State": "05", "Region": "DEA3", "County": "05554"},
    "LK Breisgau-Hochschwarzwald": {"State": "08", "Region": "DE13", "County": "08315"},
    "LK Burgenlandkreis": {"State": "15", "Region": "DEE0", "County": "15084"},
    "LK Böblingen": {"State": "08", "Region": "DE11", "County": "08115"},
    "LK Börde": {"State": "15", "Region": "DEE0", "County": "15083"},
    "LK Calw": {"State": "08", "Region": "DE12", "County": "08235"},
    "LK Celle": {"State": "03", "Region": "DE93", "County": "03351"},
    "LK Cham": {"State": "09", "Region": "DE23", "County": "09372"},
    "LK Cloppenburg": {"State": "03", "Region": "DE94", "County": "03453"},
    "LK Coburg": {"State": "09", "Region": "DE24", "County": "09473"},
    "LK Cochem-Zell": {"State": "07", "Region": "DEB1", "County": "07135"},
    "LK Coesfeld": {"State": "05", "Region": "DEA3", "County": "05558"},
    "LK Cuxhaven": {"State": "03", "Region": "DE93", "County": "03352"},
    "LK Dachau": {"State": "09", "Region": "DE21", "County": "09174"},
    "LK Dahme-Spreewald": {"State": "12", "Region": "DE40", "County": "12061"},
    "LK Darmstadt-Dieburg": {"State": "06", "Region": "DE71", "County": "06432"},
    "LK Deggendorf": {"State": "09", "Region": "DE22", "County": "09271"},
    "LK Diepholz": {"State": "03", "Region": "DE92", "County": "03251"},
    "LK Dillingen a.d.Donau": {"State": "09", "Region": "DE27", "County": "09773"},
    "LK Dingolfing-Landau": {"State": "09", "Region": "DE22", "County": "09279"},
    "LK Dithmarschen": {"State": "01", "Region": "DEF0", "County": "01051"},
    "LK Donau-Ries": {"State": "09", "Region": "DE27", "County": "09779"},
    "LK Donnersbergkreis": {"State": "07", "Region": "DEB3", "County": "07333"},
    "LK Düren": {"State": "05", "Region": "DEA2", "County": "05358"},
    "LK Ebersberg": {"State": "09", "Region": "DE21", "County": "09175"},
    "LK Eichsfeld": {"State": "16", "Region": "DEG0", "County": "16061"},
    "LK Eichstätt": {"State": "09", "Region": "DE21", "County": "09176"},
    "LK Elbe-Elster": {"State": "12", "Region": "DE40", "County": "12062"},
    "LK Emmendingen": {"State": "08", "Region": "DE13", "County": "08316"},
    "LK Emsland": {"State": "03", "Region": "DE94", "County": "03454"},
    "LK Ennepe-Ruhr-Kreis": {"State": "05", "Region": "DEA5", "County": "05954"},
    "LK Enzkreis": {"State": "08", "Region": "DE12", "County": "08236"},
    "LK Erding": {"State": "09", "Region": "DE21", "County": "09177"},
    "LK Erlangen-Höchstadt": {"State": "09", "Region": "DE25", "County": "09572"},
    "LK Erzgebirgskreis": {"State": "14", "Region": "DED4", "County": "14521"},
    "LK Esslingen": {"State": "08", "Region": "DE11", "County": "08116"},
    "LK Euskirchen": {"State": "05", "Region": "DEA2", "County": "05366"},
    "LK Forchheim": {"State": "09", "Region": "DE24", "County": "09474"},
    "LK Freising": {"State": "09", "Region": "DE21", "County": "09178"},
    "LK Freudenstadt": {"State": "08", "Region": "DE12", "County": "08237"},
    "LK Freyung-Grafenau": {"State": "09", "Region": "DE22", "County": "09272"},
    "LK Friesland": {"State": "03", "Region": "DE94", "County": "03455"},
    "LK Fulda": {"State": "06", "Region": "DE73", "County": "06631"},
    "LK Fürstenfeldbruck": {"State": "09", "Region": "DE21", "County": "09179"},
    "LK Fürth": {"State": "09", "Region": "DE25", "County": "09573"},
    "LK Garmisch-Partenkirchen": {"State": "09", "Region": "DE21", "County": "09180"},
    "LK Germersheim": {"State": "07", "Region": "DEB3", "County": "07334"},
    "LK Gießen": {"State": "06", "Region": "DE72", "County": "06531"},
    "LK Gifhorn": {"State": "03", "Region": "DE91", "County": "03151"},
    "LK Goslar": {"State": "03", "Region": "DE91", "County": "03153"},
    "LK Gotha": {"State": "16", "Region": "DEG0", "County": "16067"},
    "LK Grafschaft Bentheim": {"State": "03", "Region": "DE94", "County": "03456"},
    "LK Greiz": {"State": "16", "Region": "DEG0", "County": "16076"},
    "LK Groß-Gerau": {"State": "06", "Region": "DE71", "County": "06433"},
    "LK Göppingen": {"State": "08", "Region": "DE11", "County": "08117"},
    "LK Görlitz": {"State": "14", "Region": "DED2", "County": "14626"},
    "LK Göttingen": {"State": "03", "Region": "DE91", "County": "03159"},
    "LK Günzburg": {"State": "09", "Region": "DE27", "County": "09774"},
    "LK Gütersloh": {"State": "05", "Region": "DEA4", "County": "05754"},
    "LK Hameln-Pyrmont": {"State": "03", "Region": "DE92", "County": "03252"},
    "LK Harburg": {"State": "03", "Region": "DE93", "County": "03353"},
    "LK Harz": {"State": "15", "Region": "DEE0", "County": "15085"},
    "LK Havelland": {"State": "12", "Region": "DE40", "County": "12063"},
    "LK Haßberge": {"State": "09", "Region": "DE26", "County": "09674"},
    "LK Heidekreis": {"State": "03", "Region": "DE93", "County": "03358"},
    "LK Heidenheim": {"State": "08", "Region": "DE11", "County": "08135"},
    "LK Heilbronn": {"State": "08", "Region": "DE11", "County": "08125"},
    "LK Heinsberg": {"State": "05", "Region": "DEA2", "County": "05370"},
    "LK Helmstedt": {"State": "03", "Region": "DE91", "County": "03154"},
    "LK Herford": {"State": "05", "Region": "DEA4", "County": "05758"},
    "LK Hersfeld-Rotenburg": {"State": "06", "Region": "DE73", "County": "06632"},
    "LK Herzogtum Lauenburg": {"State": "01", "Region": "DEF0", "County": "01053"},
    "LK Hildburghausen": {"State": "16", "Region": "DEG0", "County": "16069"},
    "LK Hildesheim": {"State": "03", "Region": "DE92", "County": "03254"},
    "LK Hochsauerlandkreis": {"State": "05", "Region": "DEA5", "County": "05958"},
    "LK Hochtaunuskreis": {"State": "06", "Region": "DE71", "County": "06434"},
    "LK Hof": {"State": "09", "Region": "DE24", "County": "09475"},
    "LK Hohenlohekreis": {"State": "08", "Region": "DE11", "County": "08126"},
    "LK Holzminden": {"State": "03", "Region": "DE92", "County": "03255"},
    "LK Höxter": {"State": "05", "Region": "DEA4", "County": "05762"},
    "LK Ilm-Kreis": {"State": "16", "Region": "DEG0", "County": "16070"},
    "LK Jerichower Land": {"State": "15", "Region": "DEE0", "County": "15086"},
    "LK Kaiserslautern": {"State": "07", "Region": "DEB3", "County": "07335"},
    "LK Karlsruhe": {"State": "08", "Region": "DE12", "County": "08215"},
    "LK Kassel": {"State": "06", "Region": "DE73", "County": "06633"},
    "LK Kelheim": {"State": "09", "Region": "DE22", "County": "09273"},
    "LK Kitzingen": {"State": "09", "Region": "DE26", "County": "09675"},
    "LK Kleve": {"State": "05", "Region": "DEA1", "County": "05154"},
    "LK Konstanz": {"State": "08", "Region": "DE13", "County": "08335"},
    "LK Kronach": {"State": "09", "Region": "DE24", "County": "09476"},
    "LK Kulmbach": {"State": "09", "Region": "DE24", "County": "09477"},
    "LK Kusel": {"State": "07", "Region": "DEB3", "County": "07336"},
    "LK Kyffhäuserkreis": {"State": "16", "Region": "DEG0", "County": "16065"},
    "LK Lahn-Dill-Kreis": {"State": "06", "Region": "DE72", "County": "06532"},
    "LK Landsberg a.Lech": {"State": "09", "Region": "DE21", "County": "09181"},
    "LK Landshut": {"State": "09", "Region": "DE22", "County": "09274"},
    "LK Leer": {"State": "03", "Region": "DE94", "County": "03457"},
    "LK Leipzig": {"State": "14", "Region": "DED5", "County": "14729"},
    "LK Lichtenfels": {"State": "09", "Region": "DE24", "County": "09478"},
    "LK Limburg-Weilburg": {"State": "06", "Region": "DE72", "County": "06533"},
    "LK Lindau": {"State": "09", "Region": "DE27", "County": "09776"},
    "LK Lippe": {"State": "05", "Region": "DEA4", "County": "05766"},
    "LK Ludwigsburg": {"State": "08", "Region": "DE11", "County": "08118"},
    "LK Ludwigslust-Parchim": {"State": "13", "Region": "DE80", "County": "13076"},
    "LK Lörrach": {"State": "08", "Region": "DE13", "County": "08336"},
    "LK Lüchow-Dannenberg": {"State": "03", "Region": "DE93", "County": "03354"},
    "LK Lüneburg": {"State": "03", "Region": "DE93", "County": "03355"},
    "LK Main-Kinzig-Kreis": {"State": "06", "Region": "DE71", "County": "06435"},
    "LK Main-Spessart": {"State": "09", "Region": "DE26", "County": "09677"},
    "LK Main-Tauber-Kreis": {"State": "08", "Region": "DE11", "County": "08128"},
    "LK Main-Taunus-Kreis": {"State": "06", "Region": "DE71", "County": "06436"},
    "LK Mainz-Bingen": {"State": "07", "Region": "DEB3", "County": "07339"},
    "LK Mansfeld-Südharz": {"State": "15", "Region": "DEE0", "County": "15087"},
    "LK Marburg-Biedenkopf": {"State": "06", "Region": "DE72", "County": "06534"},
    "LK Mayen-Koblenz": {"State": "07", "Region": "DEB1", "County": "07137"},
    "LK Mecklenburgische Seenplatte": {
        "State": "13",
        "Region": "DE80",
        "County": "13071",
    },
    "LK Meißen": {"State": "14", "Region": "DED2", "County": "14627"},
    "LK Merzig-Wadern": {"State": "10", "Region": "DEC0", "County": "10042"},
    "LK Mettmann": {"State": "05", "Region": "DEA1", "County": "05158"},
    "LK Miesbach": {"State": "09", "Region": "DE21", "County": "09182"},
    "LK Miltenberg": {"State": "09", "Region": "DE26", "County": "09676"},
    "LK Minden-Lübbecke": {"State": "05", "Region": "DEA4", "County": "05770"},
    "LK Mittelsachsen": {"State": "14", "Region": "DED4", "County": "14522"},
    "LK Märkisch-Oderland": {"State": "12", "Region": "DE40", "County": "12064"},
    "LK Märkischer Kreis": {"State": "05", "Region": "DEA5", "County": "05962"},
    "LK Mühldorf a.Inn": {"State": "09", "Region": "DE21", "County": "09183"},
    "LK München": {"State": "09", "Region": "DE21", "County": "09184"},
    "LK Neckar-Odenwald-Kreis": {"State": "08", "Region": "DE12", "County": "08225"},
    "LK Neu-Ulm": {"State": "09", "Region": "DE27", "County": "09775"},
    "LK Neuburg-Schrobenhausen": {"State": "09", "Region": "DE21", "County": "09185"},
    "LK Neumarkt i.d.OPf.": {"State": "09", "Region": "DE23", "County": "09373"},
    "LK Neunkirchen": {"State": "10", "Region": "DEC0", "County": "10043"},
    "LK Neustadt a.d.Aisch-Bad Windsheim": {
        "State": "09",
        "Region": "DE25",
        "County": "09575",
    },
    "LK Neustadt a.d.Waldnaab": {"State": "09", "Region": "DE23", "County": "09374"},
    "LK Neuwied": {"State": "07", "Region": "DEB1", "County": "07138"},
    "LK Nienburg (Weser)": {"State": "03", "Region": "DE92", "County": "03256"},
    "LK Nordfriesland": {"State": "01", "Region": "DEF0", "County": "01054"},
    "LK Nordhausen": {"State": "16", "Region": "DEG0", "County": "16062"},
    "LK Nordsachsen": {"State": "14", "Region": "DED5", "County": "14730"},
    "LK Nordwestmecklenburg": {"State": "13", "Region": "DE80", "County": "13074"},
    "LK Northeim": {"State": "03", "Region": "DE91", "County": "03155"},
    "LK Nürnberger Land": {"State": "09", "Region": "DE25", "County": "09574"},
    "LK Oberallgäu": {"State": "09", "Region": "DE27", "County": "09780"},
    "LK Oberbergischer Kreis": {"State": "05", "Region": "DEA2", "County": "05374"},
    "LK Oberhavel": {"State": "12", "Region": "DE40", "County": "12065"},
    "LK Oberspreewald-Lausitz": {"State": "12", "Region": "DE40", "County": "12066"},
    "LK Odenwaldkreis": {"State": "06", "Region": "DE71", "County": "06437"},
    "LK Oder-Spree": {"State": "12", "Region": "DE40", "County": "12067"},
    "LK Offenbach": {"State": "06", "Region": "DE71", "County": "06438"},
    "LK Oldenburg": {"State": "03", "Region": "DE94", "County": "03458"},
    "LK Olpe": {"State": "05", "Region": "DEA5", "County": "05966"},
    "LK Ortenaukreis": {"State": "08", "Region": "DE13", "County": "08317"},
    "LK Osnabrück": {"State": "03", "Region": "DE94", "County": "03459"},
    "LK Ostalbkreis": {"State": "08", "Region": "DE11", "County": "08136"},
    "LK Ostallgäu": {"State": "09", "Region": "DE27", "County": "09777"},
    "LK Osterholz": {"State": "03", "Region": "DE93", "County": "03356"},
    "LK Ostholstein": {"State": "01", "Region": "DEF0", "County": "01055"},
    "LK Ostprignitz-Ruppin": {"State": "12", "Region": "DE40", "County": "12068"},
    "LK Paderborn": {"State": "05", "Region": "DEA4", "County": "05774"},
    "LK Passau": {"State": "09", "Region": "DE22", "County": "09275"},
    "LK Peine": {"State": "03", "Region": "DE91", "County": "03157"},
    "LK Pfaffenhofen a.d.Ilm": {"State": "09", "Region": "DE21", "County": "09186"},
    "LK Pinneberg": {"State": "01", "Region": "DEF0", "County": "01056"},
    "LK Plön": {"State": "01", "Region": "DEF0", "County": "01057"},
    "LK Potsdam-Mittelmark": {"State": "12", "Region": "DE40", "County": "12069"},
    "LK Prignitz": {"State": "12", "Region": "DE40", "County": "12070"},
    "LK Rastatt": {"State": "08", "Region": "DE12", "County": "08216"},
    "LK Ravensburg": {"State": "08", "Region": "DE14", "County": "08436"},
    "LK Recklinghausen": {"State": "05", "Region": "DEA3", "County": "05562"},
    "LK Regen": {"State": "09", "Region": "DE22", "County": "09276"},
    "LK Regensburg": {"State": "09", "Region": "DE23", "County": "09375"},
    "LK Rems-Murr-Kreis": {"State": "08", "Region": "DE11", "County": "08119"},
    "LK Rendsburg-Eckernförde": {"State": "01", "Region": "DEF0", "County": "01058"},
    "LK Reutlingen": {"State": "08", "Region": "DE14", "County": "08415"},
    "LK Rhein-Erft-Kreis": {"State": "05", "Region": "DEA2", "County": "05362"},
    "LK Rhein-Hunsrück-Kreis": {"State": "07", "Region": "DEB1", "County": "07140"},
    "LK Rhein-Kreis Neuss": {"State": "05", "Region": "DEA1", "County": "05162"},
    "LK Rhein-Lahn-Kreis": {"State": "07", "Region": "DEB1", "County": "07141"},
    "LK Rhein-Neckar-Kreis": {"State": "08", "Region": "DE12", "County": "08226"},
    "LK Rhein-Pfalz-Kreis": {"State": "07", "Region": "DEB3", "County": "07338"},
    "LK Rhein-Sieg-Kreis": {"State": "05", "Region": "DEA2", "County": "05382"},
    "LK Rheingau-Taunus-Kreis": {"State": "06", "Region": "DE71", "County": "06439"},
    "LK Rheinisch-Bergischer Kreis": {
        "State": "05",
        "Region": "DEA2",
        "County": "05378",
    },
    "LK Rhön-Grabfeld": {"State": "09", "Region": "DE26", "County": "09673"},
    "LK Rosenheim": {"State": "09", "Region": "DE21", "County": "09187"},
    "LK Rostock": {"State": "13", "Region": "DE80", "County": "13072"},
    "LK Rotenburg (Wümme)": {"State": "03", "Region": "DE93", "County": "03357"},
    "LK Roth": {"State": "09", "Region": "DE25", "County": "09576"},
    "LK Rottal-Inn": {"State": "09", "Region": "DE22", "County": "09277"},
    "LK Rottweil": {"State": "08", "Region": "DE13", "County": "08325"},
    "LK Saale-Holzland-Kreis": {"State": "16", "Region": "DEG0", "County": "16074"},
    "LK Saale-Orla-Kreis": {"State": "16", "Region": "DEG0", "County": "16075"},
    "LK Saalekreis": {"State": "15", "Region": "DEE0", "County": "15088"},
    "LK Saalfeld-Rudolstadt": {"State": "16", "Region": "DEG0", "County": "16073"},
    "LK Saar-Pfalz-Kreis": {"State": "10", "Region": "DEC0", "County": "10045"},
    "LK Saarlouis": {"State": "10", "Region": "DEC0", "County": "10044"},
    "LK Salzlandkreis": {"State": "15", "Region": "DEE0", "County": "15089"},
    "LK Sankt Wendel": {"State": "10", "Region": "DEC0", "County": "10046"},
    "LK Schaumburg": {"State": "03", "Region": "DE92", "County": "03257"},
    "LK Schleswig-Flensburg": {"State": "01", "Region": "DEF0", "County": "01059"},
    "LK Schmalkalden-Meiningen": {"State": "16", "Region": "DEG0", "County": "16066"},
    "LK Schwalm-Eder-Kreis": {"State": "06", "Region": "DE73", "County": "06634"},
    "LK Schwandorf": {"State": "09", "Region": "DE23", "County": "09376"},
    "LK Schwarzwald-Baar-Kreis": {"State": "08", "Region": "DE13", "County": "08326"},
    "LK Schweinfurt": {"State": "09", "Region": "DE26", "County": "09678"},
    "LK Schwäbisch Hall": {"State": "08", "Region": "DE11", "County": "08127"},
    "LK Segeberg": {"State": "01", "Region": "DEF0", "County": "01060"},
    "LK Siegen-Wittgenstein": {"State": "05", "Region": "DEA5", "County": "05970"},
    "LK Sigmaringen": {"State": "08", "Region": "DE14", "County": "08437"},
    "LK Soest": {"State": "05", "Region": "DEA5", "County": "05974"},
    "LK Sonneberg": {"State": "16", "Region": "DEG0", "County": "16072"},
    "LK Spree-Neiße": {"State": "12", "Region": "DE40", "County": "12071"},
    "LK Stade": {"State": "03", "Region": "DE93", "County": "03359"},
    "LK Stadtverband Saarbrücken": {"State": "10", "Region": "DEC0", "County": "10041"},
    "LK Starnberg": {"State": "09", "Region": "DE21", "County": "09188"},
    "LK Steinburg": {"State": "01", "Region": "DEF0", "County": "01061"},
    "LK Steinfurt": {"State": "05", "Region": "DEA3", "County": "05566"},
    "LK Stendal": {"State": "15", "Region": "DEE0", "County": "15090"},
    "LK Stormarn": {"State": "01", "Region": "DEF0", "County": "01062"},
    "LK Straubing-Bogen": {"State": "09", "Region": "DE22", "County": "09278"},
    "LK Sächsische Schweiz-Osterzgebirge": {
        "State": "14",
        "Region": "DED2",
        "County": "14628",
    },
    "LK Sömmerda": {"State": "16", "Region": "DEG0", "County": "16068"},
    "LK Südliche Weinstraße": {"State": "07", "Region": "DEB3", "County": "07337"},
    "LK Südwestpfalz": {"State": "07", "Region": "DEB3", "County": "07340"},
    "LK Teltow-Fläming": {"State": "12", "Region": "DE40", "County": "12072"},
    "LK Tirschenreuth": {"State": "09", "Region": "DE23", "County": "09377"},
    "LK Traunstein": {"State": "09", "Region": "DE21", "County": "09189"},
    "LK Trier-Saarburg": {"State": "07", "Region": "DEB2", "County": "07235"},
    "LK Tuttlingen": {"State": "08", "Region": "DE13", "County": "08327"},
    "LK Tübingen": {"State": "08", "Region": "DE14", "County": "08416"},
    "LK Uckermark": {"State": "12", "Region": "DE40", "County": "12073"},
    "LK Uelzen": {"State": "03", "Region": "DE93", "County": "03360"},
    "LK Unna": {"State": "05", "Region": "DEA5", "County": "05978"},
    "LK Unstrut-Hainich-Kreis": {"State": "16", "Region": "DEG0", "County": "16064"},
    "LK Unterallgäu": {"State": "09", "Region": "DE27", "County": "09778"},
    "LK Vechta": {"State": "03", "Region": "DE94", "County": "03460"},
    "LK Verden": {"State": "03", "Region": "DE93", "County": "03361"},
    "LK Viersen": {"State": "05", "Region": "DEA1", "County": "05166"},
    "LK Vogelsbergkreis": {"State": "06", "Region": "DE72", "County": "06535"},
    "LK Vogtlandkreis": {"State": "14", "Region": "DED4", "County": "14523"},
    "LK Vorpommern-Greifswald": {"State": "13", "Region": "DE80", "County": "13075"},
    "LK Vorpommern-Rügen": {"State": "13", "Region": "DE80", "County": "13073"},
    "LK Vulkaneifel": {"State": "07", "Region": "DEB2", "County": "07233"},
    "LK Waldeck-Frankenberg": {"State": "06", "Region": "DE73", "County": "06635"},
    "LK Waldshut": {"State": "08", "Region": "DE13", "County": "08337"},
    "LK Warendorf": {"State": "05", "Region": "DEA3", "County": "05570"},
    "LK Wartburgkreis": {"State": "16", "Region": "DEG0", "County": "16063"},
    "LK Weilheim-Schongau": {"State": "09", "Region": "DE21", "County": "09190"},
    "LK Weimarer Land": {"State": "16", "Region": "DEG0", "County": "16071"},
    "LK Weißenburg-Gunzenhausen": {"State": "09", "Region": "DE25", "County": "09577"},
    "LK Werra-Meißner-Kreis": {"State": "06", "Region": "DE73", "County": "06636"},
    "LK Wesel": {"State": "05", "Region": "DEA1", "County": "05170"},
    "LK Wesermarsch": {"State": "03", "Region": "DE94", "County": "03461"},
    "LK Westerwaldkreis": {"State": "07", "Region": "DEB1", "County": "07143"},
    "LK Wetteraukreis": {"State": "06", "Region": "DE71", "County": "06440"},
    "LK Wittenberg": {"State": "15", "Region": "DEE0", "County": "15091"},
    "LK Wittmund": {"State": "03", "Region": "DE94", "County": "03462"},
    "LK Wolfenbüttel": {"State": "03", "Region": "DE91", "County": "03158"},
    "LK Wunsiedel i.Fichtelgebirge": {
        "State": "09",
        "Region": "DE24",
        "County": "09479",
    },
    "LK Würzburg": {"State": "09", "Region": "DE26", "County": "09679"},
    "LK Zollernalbkreis": {"State": "08", "Region": "DE14", "County": "08417"},
    "LK Zwickau": {"State": "14", "Region": "DED4", "County": "14524"},
    "Region Hannover": {"State": "03", "Region": "DE92", "County": "03241"},
    "SK Amberg": {"State": "09", "Region": "DE23", "County": "09361"},
    "SK Ansbach": {"State": "09", "Region": "DE25", "County": "09561"},
    "SK Aschaffenburg": {"State": "09", "Region": "DE26", "County": "09661"},
    "SK Augsburg": {"State": "09", "Region": "DE27", "County": "09761"},
    "SK Baden-Baden": {"State": "08", "Region": "DE12", "County": "08211"},
    "SK Bamberg": {"State": "09", "Region": "DE24", "County": "09461"},
    "SK Bayreuth": {"State": "09", "Region": "DE24", "County": "09462"},
    "SK Berlin Charlottenburg-Wilmersdorf": {
        "State": "11",
        "Region": "DE30",
        "County": "11004",
    },
    "SK Berlin Friedrichshain-Kreuzberg": {
        "State": "11",
        "Region": "DE30",
        "County": "11002",
    },
    "SK Berlin Lichtenberg": {"State": "11", "Region": "DE30", "County": "11011"},
    "SK Berlin Marzahn-Hellersdorf": {
        "State": "11",
        "Region": "DE30",
        "County": "11010",
    },
    "SK Berlin Mitte": {"State": "11", "Region": "DE30", "County": "11001"},
    "SK Berlin Neukölln": {"State": "11", "Region": "DE30", "County": "11008"},
    "SK Berlin Pankow": {"State": "11", "Region": "DE30", "County": "11003"},
    "SK Berlin Reinickendorf": {"State": "11", "Region": "DE30", "County": "11012"},
    "SK Berlin Spandau": {"State": "11", "Region": "DE30", "County": "11005"},
    "SK Berlin Steglitz-Zehlendorf": {
        "State": "11",
        "Region": "DE30",
        "County": "11006",
    },
    "SK Berlin Tempelhof-Schöneberg": {
        "State": "11",
        "Region": "DE30",
        "County": "11007",
    },
    "SK Berlin Treptow-Köpenick": {"State": "11", "Region": "DE30", "County": "11009"},
    "SK Bielefeld": {"State": "05", "Region": "DEA4", "County": "05711"},
    "SK Bochum": {"State": "05", "Region": "DEA5", "County": "05911"},
    "SK Bonn": {"State": "05", "Region": "DEA2", "County": "05314"},
    "SK Bottrop": {"State": "05", "Region": "DEA3", "County": "05512"},
    "SK Brandenburg a.d.Havel": {"State": "12", "Region": "DE40", "County": "12051"},
    "SK Braunschweig": {"State": "03", "Region": "DE91", "County": "03101"},
    "SK Bremen": {"State": "04", "Region": "DE50", "County": "04011"},
    "SK Bremerhaven": {"State": "04", "Region": "DE50", "County": "04012"},
    "SK Chemnitz": {"State": "14", "Region": "DED4", "County": "14511"},
    "SK Coburg": {"State": "09", "Region": "DE24", "County": "09463"},
    "SK Cottbus": {"State": "12", "Region": "DE40", "County": "12052"},
    "SK Darmstadt": {"State": "06", "Region": "DE71", "County": "06411"},
    "SK Delmenhorst": {"State": "03", "Region": "DE94", "County": "03401"},
    "SK Dessau-Roßlau": {"State": "15", "Region": "DEE0", "County": "15001"},
    "SK Dortmund": {"State": "05", "Region": "DEA5", "County": "05913"},
    "SK Dresden": {"State": "14", "Region": "DED2", "County": "14612"},
    "SK Duisburg": {"State": "05", "Region": "DEA1", "County": "05112"},
    "SK Düsseldorf": {"State": "05", "Region": "DEA1", "County": "05111"},
    "SK Eisenach": {"State": "16", "Region": "DEG0", "County": "16056"},
    "SK Emden": {"State": "03", "Region": "DE94", "County": "03402"},
    "SK Erfurt": {"State": "16", "Region": "DEG0", "County": "16051"},
    "SK Erlangen": {"State": "09", "Region": "DE25", "County": "09562"},
    "SK Essen": {"State": "05", "Region": "DEA1", "County": "05113"},
    "SK Flensburg": {"State": "01", "Region": "DEF0", "County": "01001"},
    "SK Frankenthal": {"State": "07", "Region": "DEB3", "County": "07311"},
    "SK Frankfurt (Oder)": {"State": "12", "Region": "DE40", "County": "12053"},
    "SK Frankfurt am Main": {"State": "06", "Region": "DE71", "County": "06412"},
    "SK Freiburg i.Breisgau": {"State": "08", "Region": "DE13", "County": "08311"},
    "SK Fürth": {"State": "09", "Region": "DE25", "County": "09563"},
    "SK Gelsenkirchen": {"State": "05", "Region": "DEA3", "County": "05513"},
    "SK Gera": {"State": "16", "Region": "DEG0", "County": "16052"},
    "SK Hagen": {"State": "05", "Region": "DEA5", "County": "05914"},
    "SK Halle": {"State": "15", "Region": "DEE0", "County": "15002"},
    "SK Hamburg": {"State": "02", "Region": "DE60", "County": "02000"},
    "SK Hamm": {"State": "05", "Region": "DEA5", "County": "05915"},
    "SK Heidelberg": {"State": "08", "Region": "DE12", "County": "08221"},
    "SK Heilbronn": {"State": "08", "Region": "DE11", "County": "08121"},
    "SK Herne": {"State": "05", "Region": "DEA5", "County": "05916"},
    "SK Hof": {"State": "09", "Region": "DE24", "County": "09464"},
    "SK Ingolstadt": {"State": "09", "Region": "DE21", "County": "09161"},
    "SK Jena": {"State": "16", "Region": "DEG0", "County": "16053"},
    "SK Kaiserslautern": {"State": "07", "Region": "DEB3", "County": "07312"},
    "SK Karlsruhe": {"State": "08", "Region": "DE12", "County": "08212"},
    "SK Kassel": {"State": "06", "Region": "DE73", "County": "06611"},
    "SK Kaufbeuren": {"State": "09", "Region": "DE27", "County": "09762"},
    "SK Kempten": {"State": "09", "Region": "DE27", "County": "09763"},
    "SK Kiel": {"State": "01", "Region": "DEF0", "County": "01002"},
    "SK Koblenz": {"State": "07", "Region": "DEB1", "County": "07111"},
    "SK Krefeld": {"State": "05", "Region": "DEA1", "County": "05114"},
    "SK Köln": {"State": "05", "Region": "DEA2", "County": "05315"},
    "SK Landau i.d.Pfalz": {"State": "07", "Region": "DEB3", "County": "07313"},
    "SK Landshut": {"State": "09", "Region": "DE22", "County": "09261"},
    "SK Leipzig": {"State": "14", "Region": "DED5", "County": "14713"},
    "SK Leverkusen": {"State": "05", "Region": "DEA2", "County": "05316"},
    "SK Ludwigshafen": {"State": "07", "Region": "DEB3", "County": "07314"},
    "SK Lübeck": {"State": "01", "Region": "DEF0", "County": "01003"},
    "SK Magdeburg": {"State": "15", "Region": "DEE0", "County": "15003"},
    "SK Mainz": {"State": "07", "Region": "DEB3", "County": "07315"},
    "SK Mannheim": {"State": "08", "Region": "DE12", "County": "08222"},
    "SK Memmingen": {"State": "09", "Region": "DE27", "County": "09764"},
    "SK Mönchengladbach": {"State": "05", "Region": "DEA1", "County": "05116"},
    "SK Mülheim a.d.Ruhr": {"State": "05", "Region": "DEA1", "County": "05117"},
    "SK München": {"State": "09", "Region": "DE21", "County": "09162"},
    "SK Münster": {"State": "05", "Region": "DEA3", "County": "05515"},
    "SK Neumünster": {"State": "01", "Region": "DEF0", "County": "01004"},
    "SK Neustadt a.d.Weinstraße": {"State": "07", "Region": "DEB3", "County": "07316"},
    "SK Nürnberg": {"State": "09", "Region": "DE25", "County": "09564"},
    "SK Oberhausen": {"State": "05", "Region": "DEA1", "County": "05119"},
    "SK Offenbach": {"State": "06", "Region": "DE71", "County": "06413"},
    "SK Oldenburg": {"State": "03", "Region": "DE94", "County": "03403"},
    "SK Osnabrück": {"State": "03", "Region": "DE94", "County": "03404"},
    "SK Passau": {"State": "09", "Region": "DE22", "County": "09262"},
    "SK Pforzheim": {"State": "08", "Region": "DE12", "County": "08231"},
    "SK Pirmasens": {"State": "07", "Region": "DEB3", "County": "07317"},
    "SK Potsdam": {"State": "12", "Region": "DE40", "County": "12054"},
    "SK Regensburg": {"State": "09", "Region": "DE23", "County": "09362"},
    "SK Remscheid": {"State": "05", "Region": "DEA1", "County": "05120"},
    "SK Rosenheim": {"State": "09", "Region": "DE21", "County": "09163"},
    "SK Rostock": {"State": "13", "Region": "DE80", "County": "13003"},
    "SK Salzgitter": {"State": "03", "Region": "DE91", "County": "03102"},
    "SK Schwabach": {"State": "09", "Region": "DE25", "County": "09565"},
    "SK Schweinfurt": {"State": "09", "Region": "DE26", "County": "09662"},
    "SK Schwerin": {"State": "13", "Region": "DE80", "County": "13004"},
    "SK Solingen": {"State": "05", "Region": "DEA1", "County": "05122"},
    "SK Speyer": {"State": "07", "Region": "DEB3", "County": "07318"},
    "SK Straubing": {"State": "09", "Region": "DE22", "County": "09263"},
    "SK Stuttgart": {"State": "08", "Region": "DE11", "County": "08111"},
    "SK Suhl": {"State": "16", "Region": "DEG0", "County": "16054"},
    "SK Trier": {"State": "07", "Region": "DEB2", "County": "07211"},
    "SK Ulm": {"State": "08", "Region": "DE14", "County": "08421"},
    "SK Weiden i.d.OPf.": {"State": "09", "Region": "DE23", "County": "09363"},
    "SK Weimar": {"State": "16", "Region": "DEG0", "County": "16055"},
    "SK Wiesbaden": {"State": "06", "Region": "DE71", "County": "06414"},
    "SK Wilhelmshaven": {"State": "03", "Region": "DE94", "County": "03405"},
    "SK Wolfsburg": {"State": "03", "Region": "DE91", "County": "03103"},
    "SK Worms": {"State": "07", "Region": "DEB3", "County": "07319"},
    "SK Wuppertal": {"State": "05", "Region": "DEA1", "County": "05124"},
    "SK Würzburg": {"State": "09", "Region": "DE26", "County": "09663"},
    "SK Zweibrücken": {"State": "07", "Region": "DEB3", "County": "07320"},
    "StadtRegion Aachen": {"State": "05", "Region": "DEA2", "County": "05334"},
    # "Unbekannt": {"State": "-1", "Region": "????", "County": "?????"},
}

client = Client("https://tools.rki.de/SurvStat/SurvStatWebService.svc?wsdl")
factory = client.type_factory("ns2")

ages = ""
ages_update = ""
template_str = "(%(year)s, %(week)s, %(ags)s, "

for a in range(0, 80):
    ages += "A{:02d},".format(a)
    ages_update += "A{:02d} = EXCLUDED.A{:02d}, ".format(a, a)
    template_str += "%(A{:02d})s, ".format(a)

template_str += '%(A80)s, %(Unb)s)'

QUERY = f'INSERT INTO survstat_cases_agegroup ("year", "week", ags, {ages} "A80+", Unbekannt) ' \
        f'VALUES %s ON CONFLICT ON CONSTRAINT survstat_cases_agegroup_pk DO ' \
        f'UPDATE SET ' \
        f'{ages_update}' \
        f'"A80+" = EXCLUDED."A80+", ' \
        f'Unbekannt = EXCLUDED.Unbekannt;'

conn, cur = get_connection('crawl_survstat_agegroups')


def download_survstat_data_for_county(county, years, incidence, cumulated):
    logger.debug(f"Fetching: {county} {counties[county]} with incidences {incidence} and cumulated {cumulated}")
    if incidence and cumulated:
        raise Exception('Invalid arguments with incidence and cumulated true')

    measures = {"Count": 0}
    if incidence is True:
        measures = {"Incidence": 1}

    reporting_dates = []
    for year in years:
        reporting_dates.append(f"[ReportingDate].[WeekYear].&[{year}]")

    res = client.service.GetOlapData(
        {
            "Language": "German",
            "Measures": measures,
            "Cube": "SurvStat",
            # Totals still included, setting `true` yields duplicates
            "IncludeTotalColumn": False,
            "IncludeTotalRow": False,
            "IncludeNullRows": False,
            "IncludeNullColumns": True,
            "HierarchyFilters": factory.FilterCollection(
                [
                    {
                        "Key": {
                            "DimensionId": "[PathogenOut].[KategorieNz]",
                            "HierarchyId": "[PathogenOut].[KategorieNz].[Krankheit DE]",
                        },
                        "Value": factory.FilterMemberCollection(
                            ["[PathogenOut].[KategorieNz].[Krankheit DE].&[COVID-19]"]
                        ),
                    },
                    {
                        "Key": {
                            "DimensionId": "[ReferenzDefinition]",
                            "HierarchyId": "[ReferenzDefinition].[ID]",
                        },
                        "Value": factory.FilterMemberCollection(
                            ["[ReferenzDefinition].[ID].&[1]"]
                        ),
                    },
                    # Set "Meldejahr" filter to recent one, otherwise an average
                    # might be used.
                    # https://twitter.com/icestormfr/status/1313855275317825537
                    # As hinted at by https://github.com/dbvis-ukon/coronavis/issues/1
                    {
                        "Key": {
                            "DimensionId": "[ReportingDate]",
                            "HierarchyId": "[ReportingDate].[WeekYear]",
                        },
                        "Value": factory.FilterMemberCollection(
                            reporting_dates
                        ),
                    },
                    {
                        "Key": {
                            "DimensionId": "[DeutschlandNodes].[Kreise71Web]",
                            "HierarchyId": "[DeutschlandNodes].[Kreise71Web].[FedStateKey71]",
                        },
                        "Value": factory.FilterMemberCollection(
                            [
                                f"[DeutschlandNodes].[Kreise71Web].[FedStateKey71].&[{counties[county]['State']}].&[{counties[county]['Region']}].&[{counties[county]['County']}]"
                            ]
                        ),
                    },
                ]
            ),
            "RowHierarchy": "[ReportingDate].[YearWeek]",
            "ColumnHierarchy": "[AlterPerson80].[AgeGroupName8]"
        }
    )

    columns = [i["Caption"] for i in res.Columns.QueryResultColumn]

    df = pd.DataFrame(
        [
            [i["Caption"]]
            + [float(c.replace(".", "").replace(",", ".")) if c is not None else None for c in
               i["Values"]["string"]]
            for i in res.QueryResults.QueryResultRow
        ],
        columns=["KW"] + columns,
    )
    df = df.set_index("KW")
    df = df.astype("Float64")  # Allow for None values
    df = df.drop("Gesamt")
    df = df.drop("Gesamt", axis=1)
    df = df.rename(lambda s: s[0:3], axis='columns')
    df = df.fillna(0)

    if cumulated:
        df = df.cumsum()

    return df


def download_db_data_for_county(county, incidence):
    ags = counties[county]['County']
    if incidence:

        age_diff_cols = []
        age_inc_cols = []
        for i in range(0, 81):
            col = "a{:02d}".format(i)
            if i == 80:
                col = '"A80+"'
            age_diff_cols.append(f'((surv.{col} - lag(surv.{col}) over (order by surv.year, surv.week))) as {col}')
            age_inc_cols.append(f'round((diff.{col} / p.{col}::decimal) * 100000, 2) as {col}')

        query = f'''
            WITH diff as (
                SELECT surv.year || \'-KW\' || lpad(surv.week::text, 2, \'0\') AS yearweek,
                surv.ags,
                surv.year,
                surv.week,
                {','.join(age_diff_cols)}
                FROM survstat_cases_agegroup surv
                WHERE surv.ags = %(ags)s ORDER BY surv.year, surv.week
            )
            SELECT
                yearweek,
                {','.join(age_inc_cols)}
            FROM diff
            JOIN population_survstat_agegroup2 p ON diff.ags = p.ags AND diff.year = p.year 
        '''
        df = sqlio.read_sql_query(query, con=conn, params={'ags': ags}, index_col=['yearweek'])
        df = df.fillna(0)
    else:
        df = sqlio.read_sql_query('''
            SELECT *, year || \'-KW\' || lpad(week::text, 2, \'0\') AS yearweek 
            FROM survstat_cases_agegroup 
            WHERE ags = %(ags)s ORDER BY year, week''', con=conn, params={'ags': ags}, index_col=['yearweek'])

    df = df.rename(lambda s: s.replace('a', 'A') if s[0] == 'a' and s != 'ags' else s, axis='columns')
    df = df.rename(lambda s: s.replace('+', ''), axis='columns')
    df = df.rename(lambda s: s.replace('unbekannt', 'Unb') if s == 'unbekannt' else s, axis='columns')
    return df


def has_difference(survstat, db):
    age_cols = []
    for i in range(0, 81):
        age_cols.append("A{:02d}".format(i))

    diff = False
    for index, row in survstat.iterrows():
        for col in age_cols:
            survstat_value = row[col]
            db_value = db.loc[index, col] if index in db.index else None

            if survstat_value != db_value:
                logger.warning(f'Values of {index}:{col} not correct (survstat) {survstat_value} != {db_value} (db)')
                diff = True

    return diff


def update_case_values(county, df):
    ags = counties[county]['County']
    entries = []
    for rowName, row in df.iterrows():
        year = int(rowName[0:4])
        if year < 2020:
            continue

        kw = rowName[7:10]

        entry = row.to_dict()
        entry['year'] = year
        entry['week'] = kw
        entry['ags'] = ags

        entries.append(entry)

    psycopg2.extras.execute_values(
        cur, QUERY, entries,
        template=template_str,
        page_size=500
    )
    conn.commit()


def estimate_pop(v_count, v_incidence):
    res = []
    for i in range(0, min(len(v_count), len(v_incidence))):
        if v_count[i] is not None and v_incidence[i] is not None and v_incidence[i] > 0:
            res.append((v_count[i] * 100000) / v_incidence[i])

    if float(len(res)) == 0:
        return None

    return round(sum(res) / float(len(res)))


def update_population_values(county, year, df_abs, df_inc):
    updates = []
    ags = counties[county]['County']

    for colName, col in df_abs.iteritems():
        if colName == "Unb":
            continue
        v_count = df_abs[colName].nlargest(3).to_list()
        v_incidence = df_inc[colName].nlargest(3).to_list()

        pop = estimate_pop(v_count, v_incidence)
        if pop is None:
            logger.warning(f"{county} for {colName} is None!")
            pop = 'null'

        age = int(colName[1:3])

        if age == 0:
            cur.execute(
                f"SELECT COUNT(*) AS c FROM population_survstat_agegroup2 WHERE ags = '{'{:05d}'.format(int(ags))}' AND year = {year}")
            if cur.fetchone()[0] == 0:
                cur.execute(
                    f"INSERT INTO population_survstat_agegroup2 (ags, a00, year) VALUES ('{'{:05d}'.format(int(ags))}', {pop}, {year})")
                conn.commit()

        if 0 <= age < 80:
            updates.append(f"{'a{:02d}'.format(int(age))} = {pop}")
        else:
            updates.append(f"\"A80+\" = {pop}")

    allupdates = ', '.join(updates)
    query = f"UPDATE population_survstat_agegroup2 SET {allupdates} WHERE ags = '{'{:05d}'.format(int(ags))}' AND year = {year}"
    cur.execute(query)

    conn.commit()


def process_county(county):
    ags = counties[county]['County']
    logger.info(f'[{county} ({ags})] process county')

    current_year = datetime.datetime.now().year
    all_years = range(2020, current_year + 1)

    # download the absolute values for all years
    df_survstat_abs = download_survstat_data_for_county(county=county, years=all_years, incidence=False, cumulated=True)
    df_db_abs = download_db_data_for_county(county=county, incidence=False)

    # if there is a difference in the absolute values (e.g. new data or corrections) update our DB
    if has_difference(df_survstat_abs, df_db_abs):
        logger.info(f'[{county} ({ags})] update case data')
        update_case_values(county, df_survstat_abs)
    else:
        logger.info(f'[{county} ({ags})] case data up to date')

    # to check the population data via survstat each year has to be processed individually,
    # otherwise survstat averages the population numbers
    df_db_inc = download_db_data_for_county(county, True)

    for year in all_years:
        df_survstat_inc = download_survstat_data_for_county(county=county, years=[year], incidence=True,
                                                            cumulated=False)
        # check incidence values
        if has_difference(df_survstat_inc, df_db_inc):
            # non-accumulated case values
            df_survstat_abs = download_survstat_data_for_county(county=county, years=[year], incidence=False,
                                                                cumulated=False)
            logger.info(f'[{county} ({ags})] update population data for {year}')
            update_population_values(county=county, year=year, df_abs=df_survstat_abs, df_inc=df_survstat_inc)
        else:
            logger.info(f'[{county} ({ags})] population data up to date for {year}')

    logger.info(f'[{county} ({ags})] done.')



ex = False

for county_to_process in counties.keys():
    try:
        process_county(county_to_process)
    except Exception as e:
        ex = True
        logger.exception("Something went wrong fetching the data", exc_info=e)

try:
    logger.info('Refreshing materialized view')
    cur.execute('set time zone \'UTC\'; REFRESH MATERIALIZED VIEW cases_per_county_and_day;')
    conn.commit()
except Exception as e:
    ex = True
    logger.exception('Exception while updating materialized view', exc_info=e)

cur.close()
conn.close()

if ex:
    delta = datetime.datetime.now() - start
    logger.info(f'Survstat crawler had an error. Took {math.floor(delta.seconds / 60)} minutes {delta.seconds % 60} seconds')
    exit(1)

delta = datetime.datetime.now() - start
logger.info(f'Survstat crawler done. Took {math.floor(delta.seconds / 60)} minutes {delta.seconds % 60} seconds')
exit(0)
