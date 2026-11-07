"""Fills proposed_category/subcategory/topic/discipline for every block in the mapping CSV."""
import csv
import re
import sys
from collections import Counter, defaultdict

SRC = 'data/category-mapping-drafts.csv'
OUT = 'data/category-mapping-assigned.csv'
PLATFORM_OUT = 'data/platform-fixes.csv'

rows = list(csv.DictReader(open(SRC)))
fields = list(rows[0].keys())

CODE = re.compile(r'^\s*(?:Category\s+)?\d+[A-Za-z]{0,2}\s*[.:\-–]\s*')
QUALIFIER = re.compile(
	r'\s*\((?:individual|staff|org|organization|organizations|staff or team|organization, staff or team|'
	r'individual or organization|single|multiple|multi)\)\s*$',
	re.I,
)
TOPIC_PAREN = re.compile(
	r'\s*\((?:news|sports|features|business|opinion|portrait|news, business|coronavirus pandemic|politics/elections|other)\)\s*$',
	re.I,
)


def clean(s):
	s = s.replace('’', "'").replace('™', '').replace('*', '')
	s = s.replace('Portolio', 'Portfolio').replace('Inforgraphics', 'Infographics').replace('Muller', 'Mueller')
	s = s.replace("World's Best Designed", "World's Best-Designed")
	return re.sub(r'\s+', ' ', s).strip()


def strip_code(s):
	s = CODE.sub('', s.strip())
	s = re.sub(r'^\d+[a-zA-Z]\s+(?=[A-Z])', '', s)
	return clean(s)


def strip_prefix(s):
	return re.sub(
		r'^(Design|LOC|Topics|Prod|Platform|Elements|InfoGfx|Illustrations?|Portfolio|Special [Tt]opic):\s*',
		'',
		s,
	)


# ---------- category / subcategory ----------


def split_label(label):
	m = re.match(r'^(.*?)\s*\[(.*)\]\s*$', label)
	if m:
		return m.group(1), m.group(2)
	for sep in (':', ' – '):
		if sep in label:
			a, b = label.split(sep, 1)
			return a.strip(), b.strip()
	return label, ''


def normalize_base(base, year):
	b = base.strip()
	low = b.lower()
	if low in ('portfolios', 'portfolio'):
		return 'Portfolio'
	if low == 'information graphics' and year and int(year) <= 2015:
		return 'Infographics'
	if low == 'information graphics' and 'graphics' in low and year and int(year) in (2010, 2011, 2012, 2013, 2014, 2015):
		return 'Infographics'
	if low.startswith("world's best-designed"):
		return "World's Best-Designed"
	return b


def new_portfolio_sub(s):
	s = re.sub(r'^(Individual|Staff):\s*', '', s)
	s = re.sub(r'\s+Portfolio$', '', s)
	return s


def digital_row(x):
	par = re.sub(r'^\d+\.\s*', '', x['parent']).strip()
	lab = strip_prefix(strip_code(x['category']))
	if lab.lower() == par.lower():
		lab = strip_prefix(strip_code(x['subcategory'])).split(':')[0].strip()
	par = clean(par)
	if par == "Portfolios and World's Best":
		if lab.startswith("World's Best"):
			return "World's Best-Designed", lab.split(':', 1)[1].strip()
		par = 'Portfolio'
	if par in ('Portfolios', 'Portfolio'):
		par = 'Portfolio'
		lab = new_portfolio_sub(lab)
		lab = re.sub(r'\s*\((?:individual|staff|organization, staff or team|organization|staff or team|individual or organization)\)\s*$', '', lab, flags=re.I)
	if par == "World's Best-Designed":
		par = "World's Best-Designed"
		lab = lab.split(':', 1)[-1].strip()
	if par.startswith('Information Graphics'):
		pass
	lab = QUALIFIER.sub('', lab)
	return par, lab


def print_row(x):
	parent, cat = x['parent'].strip(), x['category'].strip()
	if parent.startswith('Judges'):
		return 'Judges Special Recognition', ''
	pcode = re.match(r'^\s*(?:Category\s+)?(\d+)', parent)
	catname = strip_code(parent)
	sub = strip_code(cat)
	if not pcode:
		catname = strip_code(cat)
		sub = ''
	if re.match(r'^\s*(?:Category\s+)?10\b', parent) or re.match(r'^\s*(?:Category\s+)?10[A-Z]', parent):
		sub = sub.split(':', 1)[-1].strip()
		return 'Portfolio', TOPIC_PAREN.sub('', sub)
	if re.match(r'^\s*(?:Category\s+)?0?1\b', parent) and "World's" in catname or "World's" in sub:
		kind = sub if re.search(r'Daily', sub + catname) else ''
		if not kind and 'Non-Daily' in catname:
			kind = 'Non-Daily Newspapers'
		return catname if catname.startswith("World's Best-Designed Newspaper") else "World's Best-Designed", (
			kind if kind != "World's Best-Designed" else ''
		)
	if ':' in sub:
		prefix, rest = sub.split(':', 1)
		if prefix.lower().startswith('special section'):
			catname, sub = 'Special Section', rest.strip()
		else:
			sub = rest.strip()
	sub = TOPIC_PAREN.sub('', sub)
	sub = re.sub(r'\s*\((.*)\)$', lambda m: m.group(0) if 'single-day' in m.group(1) or 'multi-day' in m.group(1) else '', sub)
	norm = lambda s: re.sub(r'[^a-z]', '', re.sub(r'\(.*\)', '', s.lower()))
	if norm(sub) == '' or norm(sub).startswith(norm(catname)) or norm(catname).startswith(norm(sub)) and norm(sub) != '':
		sub = '' if norm(sub).startswith(norm(catname)) or norm(sub) == norm(catname) else sub
	if sub.lower().startswith('special coverage'):
		sub = ''
	return catname, sub


def legacy_row(x):
	year = x['year']
	label = clean(x['general_category'])
	num = x['category_number'].strip()
	source = x['source']
	if not label:
		label = strip_code(x['category'])
	if source == '2018':
		base, tail = split_label(label)
		base = normalize_base(base, year)
		m = re.match(r'^\d[A-C]:?\s*(.*)$', num)
		suffix = m.group(1).strip() if m else ''
		suffix = re.sub(r'^Format:\s*', '', suffix)
		if base == 'Portfolio':
			return base, new_portfolio_sub(QUALIFIER.sub('', tail))
		if tail and (tail.startswith('Use of') or base in ('Social Media Design', 'Special Events')):
			sub = tail
		elif suffix:
			sub = suffix
		else:
			sub = tail
		return base, QUALIFIER.sub('', sub)
	base, sub = split_label(label)
	base = normalize_base(base, year)
	if base == 'Portfolio':
		sub = new_portfolio_sub(sub)
	sub = strip_prefix(sub)
	sub = QUALIFIER.sub('', sub)
	return base, sub


def assign_cat(x):
	if x['parent'].strip() and not x['source'].endswith('print'):
		return digital_row(x)
	if x['source'].endswith('print'):
		return print_row(x)
	return legacy_row(x)


# ---------- topic ----------

TOPIC_RULES = [
	(r'investigat', 'Investigations'),
	(r'public interest|public service', 'Public interest'),
	(r'climate|natural disasters', 'Climate'),
	(r'ukraine|middle east|gaza|pope|queen elizabeth|coronation|sept\.? ?11|terrorist|refugee|natural disaster', 'News events'),
	(r'news,? (?:and |& )?business|business,? news|news and sports|news, local, business', ''),
	(r'\bsports?\b|olympic|world cup', 'Sports'),
	(r'politic|election|impeach|trump', 'Politics'),
	(r'health|science|coronavirus|covid|pandemic', 'Health & science'),
	(r'business|\bbiz\b|\btech\b|technology|economy|artificial intelligence|\bai\b', 'Business & tech'),
	(r'social issues|gender|racial|\bsoc\b', 'Identity & society'),
	(r'\barts\b|entertainment|lifestyle|a&e|taylor swift', 'Arts & leisure'),
]


def topic_of(text):
	t = text.lower()
	for pat, topic in TOPIC_RULES:
		if re.search(pat, t):
			return topic
	return ''


# ---------- discipline ----------


def discipline_of(cat, sub, platform=''):
	c, s = cat.lower(), sub.lower()
	if platform == 'Social':
		return 'Social media'
	cs = c + ' | ' + s
	infographic_cat = bool(re.search(r'infograph|information graphics|^graphics$', c))
	if re.search(r'audio|podcast', cs):
		return 'Audio'
	if re.search(r'social media|social story|stories design|instagram|twitter|carousel|shared image|card design', cs):
		return 'Social media'
	if c == 'portfolio':
		if re.search(r'infograph|information graphics', s):
			return 'Infographics'
		if 'art direction' in s:
			return 'Art direction'
		if 'illustrat' in s:
			return 'Illustration & animation'
		if re.search(r'visual editing|photo', s):
			return 'Photography'
		if 'product' in s:
			return 'Product design'
		return 'News design'
	if re.search(r'photo', s) or c == 'photography':
		return 'Photography'
	if (
		re.search(r'use of data|^data$|\bmaps?\b|ar/vr|augmented|data visualization', s)
		and 'infograph' not in s
		and not infographic_cat
	):
		return 'Graphics'
	if re.search(r'branding|advertis|brochure|corporate report|poster|promotion|advertorial|typograph|^events$|ad campaigns', s):
		return 'Art direction'
	if re.fullmatch(r'product|product design|news product|prod|mobile experience', c) or re.search(
		r'ux/ui|website|\bapp\b|landing page|newsletter|user input|reader interaction|interface|interactive|new site|redesigned site|mobile (app|experience)|news tools|home ?page|storytelling tools',
		s,
	):
		return 'Product design'
	if re.search(r'video|multimedia', s):
		return 'Video'
	if re.search(r'illustrat|animation|motion graphics|illos', s):
		return 'Illustration & animation'
	if infographic_cat or re.search(r'infograph|information graphics', s):
		return 'Infographics'
	if 'illustrat' in c:
		return 'Illustration & animation'
	if c == 'use of multimedia':
		return 'Video'
	return 'News design'


# ---------- build ----------

records = []
for x in rows:
	user_done = bool(x['proposed_category'].strip())
	if user_done:
		cat, sub = clean(x['proposed_category']), clean(x['proposed_subcategory'])
		if cat.lower() == 'inforgraphics':
			cat = 'Infographics'
	else:
		cat, sub = assign_cat(x)
	cat = {'Portfolios': 'Portfolio', 'Special event': 'Special events'}.get(cat, cat)
	records.append({'x': x, 'cat': cat, 'sub': sub, 'user': user_done})

# one spelling per case-insensitive label
def label_key(s):
	return re.sub(r'[-\s]+', ' ', re.sub(r'\s*/\s*', '/', s.lower()))


counts = defaultdict(Counter)
for rec in records:
	for k in ('cat', 'sub'):
		if rec[k]:
			counts[(k, label_key(rec[k]))][rec[k]] += 1
canon = {}
for key, c in counts.items():
	best = sorted(c.items(), key=lambda kv: (-kv[1], -sum(ch.isupper() for ch in kv[0]), kv[0]))[0][0]
	canon[key] = best
merged = []
for key, c in counts.items():
	if len(c) > 1:
		merged.append((key[1], dict(c), canon[key]))

KNOWN_TOPICS = {
	'Sports', 'Politics', 'Health & science', 'Business & tech', 'Identity & society', 'Arts & leisure',
	'Public interest', 'Investigations', 'Climate', 'News events',
}
TOPIC_FIX = {'Business': 'Business & tech', 'Breaking news': '', 'Muller/Impeachment': 'Politics'}

changed_disc = []
for rec in records:
	x = rec['x']
	for k in ('cat', 'sub'):
		if rec[k]:
			rec[k] = canon[(k, label_key(rec[k]))]
	cat, sub = rec['cat'], rec['sub']
	print_ctx = x['source'].endswith('print')
	text = sub + ' ' + (strip_code(x['parent']) + ' ' + strip_code(x['category']) if print_ctx else '')
	if rec['user']:
		topic = TOPIC_FIX.get(x['proposed_topic'], x['proposed_topic'])
		if topic and topic not in KNOWN_TOPICS:
			print('unknown topic kept:', topic, file=sys.stderr)
		if not topic:
			topic = topic_of(text)
	else:
		topic = topic_of(text)
	if print_ctx and cat in ('Portfolio',) and re.search(r'news', text, re.I) and topic == 'Business & tech':
		topic = ''
	engine = discipline_of(cat, sub, x['platform'])
	picked = x['proposed_discipline'].strip()
	if rec['user'] and picked and picked != x['current_discipline'] and picked == engine:
		disc = picked
	elif rec['user'] and picked and picked != x['current_discipline']:
		disc = engine
		changed_disc.append((x['source'], x['year'], cat, sub, picked, engine))
	else:
		disc = engine
	rec['topic'], rec['disc'] = topic, disc

with open(OUT, 'w', newline='') as f:
	w = csv.DictWriter(f, fieldnames=fields)
	w.writeheader()
	for rec in records:
		x = dict(rec['x'])
		x['proposed_category'], x['proposed_subcategory'] = rec['cat'], rec['sub']
		x['proposed_topic'], x['proposed_discipline'] = rec['topic'], rec['disc']
		w.writerow(x)

# platform: only rows where the current value is clearly wrong
def expected_platform(x):
	p, cur = x['platform'], x['current_platform']
	if p == 'Combo':
		return 'Multiplatform'
	if 'social issues' in (x['category'] + x['subcategory'] + x['current_category'] + x['current_subcategory']).lower() and cur == 'Social':
		return {'Commissioned Illustration': 'Other', 'In-house Illustration': 'Other'}.get(p, p or 'Digital')
	if p in ('Commissioned Illustration', 'In-house Illustration') and cur != 'Other':
		return 'Other'
	return cur


with open(PLATFORM_OUT, 'w', newline='') as f:
	w = csv.writer(f)
	w.writerow(['row_key', 'entry_count', 'current_platform', 'suggested_platform'])
	for x in rows:
		new = expected_platform(x)
		if new != x['current_platform']:
			w.writerow([x['row_key'], x['entry_count'], x['current_platform'], new])

print('rows', len(records))
print('\nmerged spellings:')
for m in sorted(merged):
	print(' ', m)
print('\nuser discipline overridden by engine:')
for c in changed_disc:
	print(' ', c)
