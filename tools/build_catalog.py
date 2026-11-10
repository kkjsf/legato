# Construit perso/legato-catalogue.zip depuis PDMX (Zenodo 15571083) : pièces pour piano, licence sans conflit.
# Entrées (non versionnées, ~2,1 Go) : perso/pdmx/PDMX.csv et perso/pdmx/mxl.tar.gz
#   https://zenodo.org/records/15571083/files/PDMX.csv?download=1
#   https://zenodo.org/records/15571083/files/mxl.tar.gz?download=1
# Sortie : un zip « stocké » (sans recompression) : index.json + mxl/<id>.mxl, que Legato ouvre une fois et garde.
# Lancer : python -I tools/build_catalog.py   (depuis PERSO/legato)
import csv, io, json, math, os, re, sys, tarfile, zipfile, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'perso', 'pdmx')
OUT = os.path.join(ROOT, 'perso', 'legato-catalogue.zip')
RISKY = {'pop', 'rock', 'soundtrack', 'electronic', 'hiphop', 'rbfunksoul', 'jazz', 'metal', 'country', 'reggae', 'latin'}

def na(v):
    v = (v or '').strip()
    return '' if v in ('NA', 'nan', 'None', 'Composer', 'composer') else v

def piano(z):
    tr = [t for t in z['tracks'].split('-') if t != '']
    return 1 <= len(tr) <= 2 and all(t.isdigit() and int(t) <= 7 for t in tr)

# « domaine public » est ce que déclare la personne qui publie : on ne garde que des compositeurs morts avant 1956
# (domaine public en France), la musique traditionnelle ou anonyme, et les compositions de la personne elle-même
PD_COMPOSERS = re.compile(r'\b(bach|mozart|beethoven|chopin|schumann|schubert|liszt|debussy|satie|grieg|tch?aik|haydn|h(a|ä|ae)ndel|clementi|czerny'
    r'|burgm(u|ü|ue)ller|scarlatti|mendelssohn|brahms|dvo(r|ř)(a|á)k|joplin|couperin|rameau|purcell|vivaldi|telemann|kuhlau|diabelli|gurlitt'
    r'|heller|streabbog|field|alb(e|é)niz|granados|faur(e|é)|mussorgsk|moussorgsk|rimsk|borodin|rachmanin|scriabin|skrjabin|elgar|holst|mahler'
    r'|bruckner|verdi|rossini|puccini|bizet|offenbach|saint-sa(e|ë)ns|franck|massenet|delibes|gounod|paganini|weber|hummel|dussek|pachelbel'
    r'|albinoni|corelli|boccherini|gluck|lully|byrd|dowland|morley|tallis|gibbons|carolan|gow|marshall|skinner|sousa|foster|macdowell'
    r'|chaminade|lyapunov|glinka|smetana|bart(o|ó)k|ravel|wagner|strauss|j(a|á)na(c|č)ek|tchaikovsky|glazunov|arensky|reger|busoni|godowsky'
    r'|moszkowski|grainger|gottschalk|lanner|waldteufel|lemoine|duvernoy|bertini|k(o|ö)hler|beyer|hanon|cramer|loeschhorn|bach,|kirkpatrick'
    r'|susato|playford|praetorius|frescobaldi|buxtehude|pergolesi|cimarosa|soler|seixas|zipoli|krebs|mattheson|graupner|kirnberger|neefe'
    r'|gade|sinding|lack|ellmenreich|spindler|reinecke|kullak|lichner|behr|wohlfahrt|biehl|lemoine|le couppey|schmitt)', re.I)
TRAD = re.compile(r'\b(trad|traditional|traditionnel|traditionell|folk|anon|anonymous|anonyme|unknown|unbekannt|misc tunes|misc traditional|hymn)', re.I)
MODERN = re.compile(r'\b(arr|arranged|cover|ost|theme|disney|pixar|ghibli|anime|netflix|game|pok(e|é)mon|zelda|mario|undertale|minecraft'
    r'|yiruma|einaudi|hisaishi|tiersen|zimmer|williams|from |soundtrack|op(e|é)ning|ending|remix|lofi|lo-fi|meme)', re.I)

def keep(z):
    T = lambda k: z[k] == 'True'
    if not (T('subset:no_license_conflict') and T('subset:all_valid') and T('is_best_unique_arrangement')) or T('is_draft') or T('has_paywall') or not piano(z):
        return False
    who = ' '.join((z['composer_name'], z['artist_name'])); what = ' '.join((z['title'], z['song_name'], z['subtitle'], who))
    if T('is_original'):
        if MODERN.search(what):
            return False
    elif not (PD_COMPOSERS.search(who) or TRAD.search(who)) or set(z['genres'].split('-')) & RISKY:
        return False
    n_notes = int(float(z['n_notes'] or 0))
    if n_notes < 24:
        return False
    rated = int(z['n_ratings'] or 0) >= 1 and float(z['rating'] or 0) >= 3.5
    two = len([t for t in z['tracks'].split('-') if t]) == 2
    named = bool(na(z['composer_name']) or na(z['artist_name']))
    return rated or (two and named and n_notes >= 60) or (two and int(z['n_favorites'] or 0) >= 3)

def level(z):
    c = int(z['complexity'] or 0); npb = float(z['notes_per_bar'] or 0)
    est = 1 if npb < 7 else 2 if npb < 16 else 3
    if c in (1, 2, 3):
        return max(c, est - 1) if c == 1 else c
    return est

def score(z):
    n = int(z['n_ratings'] or 0); r = float(z['rating'] or 0) if n else 3.0
    return r * min(n, 10) / 10 + 0.6 * math.log10(1 + int(z['n_favorites'] or 0)) + 0.25 * math.log10(1 + int(z['n_views'] or 0))

def main():
    csv.field_size_limit(10 ** 8)
    rows = [z for z in csv.DictReader(open(os.path.join(SRC, 'PDMX.csv'), encoding='utf-8', newline='')) if keep(z)]
    rows.sort(key=score, reverse=True)
    want = {}
    for z in rows:
        h = os.path.splitext(os.path.basename(z['mxl']))[0]
        want[h] = z
    print(len(want), 'pièces retenues', file=sys.stderr)
    items, done = [], 0
    with zipfile.ZipFile(OUT + '.tmp', 'w', zipfile.ZIP_STORED) as zo, tarfile.open(os.path.join(SRC, 'mxl.tar.gz'), 'r|gz') as tf:
        found = {}
        for m in tf:
            if not m.isfile():
                continue
            h = os.path.splitext(os.path.basename(m.name))[0]
            if h not in want:
                continue
            data = tf.extractfile(m).read()
            try:
                with zipfile.ZipFile(io.BytesIO(data)) as mz:
                    xml = b''.join(mz.read(n) for n in mz.namelist() if not n.startswith('META-INF') and n.lower().endswith(('.xml', '.musicxml')))
            except zipfile.BadZipFile:
                continue
            fing = len(re.findall(rb'<fingering[ >]', xml))
            if b'score-partwise' not in xml or b'<pitch>' not in xml:
                continue
            found[h] = (data, fing)
            done += 1
            if done % 2000 == 0:
                print(done, file=sys.stderr)
        for z in rows:
            h = os.path.splitext(os.path.basename(z['mxl']))[0]
            if h not in found:
                continue
            data, fing = found.pop(h)
            cid = h[:16]
            zo.writestr('mxl/' + cid + '.mxl', data)
            title = (na(z['song_name']) or na(z['title']) or 'Sans titre')[:90]
            comp = (na(z['composer_name']) or na(z['artist_name']))[:60]
            rated = int(z['n_ratings'] or 0) >= 1
            items.append([cid, title, comp, level(z), int(float(z['song_length.bars'] or 0)), int(float(z['n_notes'] or 0)), fing,
                          round(float(z['rating']) * 10) if rated else 0, 'CC0' if z['license'] == 'cc-zero' else 'PD'])
        idx = {'v': 1, 'date': datetime.date.today().isoformat(), 'n': len(items),
               'src': f'{len(items)} pièces pour piano tirées de PDMX v9 (Long et al., 2024, jeu de données sous CC BY 4.0, '
                      'zenodo.org/records/15571083) : partitions de la communauté MuseScore publiées en domaine public ou CC0, '
                      'sans conflit de licence ; difficulté donnée par MuseScore ou estimée. Classées des mieux notées aux autres.',
               'items': items}
        zo.writestr(zipfile.ZipInfo('index.json'), json.dumps(idx, ensure_ascii=False, separators=(',', ':')).encode('utf-8'), compress_type=zipfile.ZIP_DEFLATED)
    os.replace(OUT + '.tmp', OUT)
    print(len(items), 'pièces,', round(os.path.getsize(OUT) / 1e6, 1), 'Mo ->', OUT, file=sys.stderr)

if __name__ == '__main__':
    main()
