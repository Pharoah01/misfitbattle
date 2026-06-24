"""
Team Name Validation — server-side mirror of frontend validation.
Profanity filter, leet-speak normalization, injection detection, reserved names.
"""

import re

BANNED = [
    'drop','select','insert','delete','update','truncate','exec','union',
    'script','alert','onerror','onload','javascript','eval','iframe','documentcookie',
    'fuck','shit','bitch','bastard','cunt','dick','cock','pussy','whore','slut',
    'asshole','motherfucker','bullshit','dumbass','nigger','nigga','faggot','retard',
    'testicles','sisterfucker','blabbermouth','alcoholic','idiot','pimp','prostitute',
    'donkey','nipple','nipples','boobs','druggie','pubic','penis','vagina','arse',
    'excrete','faeces','piss','masturbate',
    'nazi','isis','jihad','terrorist','hitler','kkk',
    'tvk','dmk','admk','aiadmk','bjp','congress','ntk','rss','hindutva','communist',
    'thalapathy','vijay','modi','stalin','seeman','annamalai','rahulgandhi','tmc','inc','elipandi',
    'porn','sex','rape','kill','murder',
    'aad','aand','bahenchod','behenchod','bhenchod','bhenchodd','bhosdike','bhonsdike',
    'bsdk','bakchod','bakchodd','bakchodi','bevda','bewda','bevakoof','bewakoof',
    'bhadua','bhaduaa','bhadva','bhadvaa','bhadwa','bhadwaa','bhosada','bhosda',
    'bhosdaa','bhosdiki','bhosdiwala','bhosdiwale','bhosadchod','charsi','chooche',
    'choochi','chuchi','chod','chodd','chudne','chudney','chudwa','chudwaa',
    'choot','chut','chute','chutia','chutiya','chutiye','chuttad','chutad',
    'dalaal','dalal','dalle','dalley','fattu','gadha','gadhe','gadhalund',
    'gaand','gand','gandu','gandfat','gandfut','gandiya','gandiye',
    'harami','haramjada','haraamjaada','haramzyada','haraamkhor','haramkhor',
    'jhat','jhaat','jhaatu','jhatu','kutta','kutte','kuttey','kutia','kutiya',
    'landi','landy','laude','laudey','laura','lora','lauda','ling','loda','lode','lund',
    'madarchod','madarchodd','madarchood','madarchoot','madarchut',
    'pkmkb','raand','rand','randi','randy','suar','tatte','tatti','tatty','ullu',
]

RESERVED = [
    'admin','administrator','system','root','official','moderator','support',
    'organizer','management','ops','participant','owasp','sathyabama',
]

ALLOWED_RE = re.compile(r"^[a-zA-Z0-9 '_\-.]+$")


def normalize_leet(text):
    t = text.lower()
    replacements = {'4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i',
                    '0': 'o', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g'}
    for k, v in replacements.items():
        t = t.replace(k, v)
    return t


def collapse_repeated(text):
    return re.sub(r'(.)\1+', r'\1', text)


def normalize_team_name(name):
    import unicodedata
    stripped = re.sub(r'[\x00-\x1f\x7f]', '', name)
    stripped = unicodedata.normalize('NFD', stripped)
    stripped = re.sub(r'[\u0300-\u036f]', '', stripped)
    stripped = re.sub(r'[^\x20-\x7e]', '', stripped)
    stripped = stripped.lower().strip()
    stripped = re.sub(r'\s+', ' ', stripped)
    collapsed = collapse_repeated(stripped)
    return normalize_leet(collapsed)


def validate_team_name(name):
    """
    Validate team name. Returns (is_valid, error_message).
    """
    if not name or not isinstance(name, str):
        return False, 'Team name is required'

    t = re.sub(r'[\x00-\x1f\x7f]', '', name).strip()

    if len(t) < 3:
        return False, 'Team name must be at least 3 characters'
    if len(t) > 40:
        return False, 'Team name must be at most 40 characters'

    if not ALLOWED_RE.match(t):
        return False, 'Only letters, numbers, spaces, apostrophes, hyphens and dots allowed'

    if re.search(r'\s{2,}', t):
        return False, 'Multiple consecutive spaces are not allowed'

    if re.search(r'(.)\1{4,}', t, re.IGNORECASE):
        return False, 'Too many repeated characters'

    if re.match(r'^\d+$', t):
        return False, 'Team name cannot contain only numbers'

    dangerous = [r'<[^>]*>', r'--', r'/\*', r'\*/', r'\bOR\b.+?=', r'\bAND\b.+?=']
    for pattern in dangerous:
        if re.search(pattern, t, re.IGNORECASE):
            return False, 'Invalid or dangerous pattern detected'

    norm = normalize_team_name(t)
    compact = re.sub(r"[\s._'-]+", '', norm)

    for word in RESERVED:
        if compact == word:
            return False, 'Reserved team name is not allowed'

    for word in BANNED:
        if word in norm or word in compact:
            return False, 'Team name contains prohibited content'

    return True, None
