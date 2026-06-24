/**
 * Team Name Validation
 * Comprehensive validation with profanity filter, leet-speak normalization,
 * SQL injection / XSS detection, and reserved name blocking.
 */

const BANNED = [
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
];

const RESERVED = [
  'admin','administrator','system','root','official','moderator','support',
  'organizer','management','ops','participant','owasp','sathyabama',
];

const ALLOWED_RE = /^[a-zA-Z0-9 '_\-.]+$/;

function normalizeLeet(text: string): string {
  return text.toLowerCase()
    .replace(/4/g, 'a').replace(/@/g, 'a')
    .replace(/3/g, 'e').replace(/1/g, 'i')
    .replace(/!/g, 'i').replace(/0/g, 'o')
    .replace(/5/g, 's').replace(/\$/g, 's')
    .replace(/7/g, 't').replace(/8/g, 'b').replace(/9/g, 'g');
}

function collapseRepeatedChars(text: string): string {
  return text.replace(/(.)\1+/g, '$1');
}

export function normalizeTeamName(name: string): string {
  const stripped = name
    .replace(/[\x00-\x1F\x7F]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const collapsed = collapseRepeatedChars(stripped);
  return normalizeLeet(collapsed);
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  sanitized?: string;
  normalized?: string;
}

export function validateTeamName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'Team name is required' };
  }

  const t = name.replace(/[\x00-\x1F\x7F]/g, '').trim();

  if (t.length < 3) return { valid: false, reason: 'Team name must be at least 3 characters' };
  if (t.length > 40) return { valid: false, reason: 'Team name must be at most 40 characters' };

  if (!ALLOWED_RE.test(t)) {
    return { valid: false, reason: 'Only letters, numbers, spaces, apostrophes, hyphens and dots allowed' };
  }
  if (/\s{2,}/.test(t)) {
    return { valid: false, reason: 'Multiple consecutive spaces are not allowed' };
  }
  if (/(.)\1{4,}/i.test(t)) {
    return { valid: false, reason: 'Too many repeated characters' };
  }
  if (/^\d+$/.test(t)) {
    return { valid: false, reason: 'Team name cannot contain only numbers' };
  }

  const dangerousPatterns = [/<[^>]*>/, /--/, /\/\*/, /\*\//, /\bOR\b.+?=/i, /\bAND\b.+?=/i];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(t)) {
      return { valid: false, reason: 'Invalid or dangerous pattern detected' };
    }
  }

  const norm = normalizeTeamName(t);
  const compact = norm.replace(/[\s._'-]+/g, '');

  for (const word of RESERVED) {
    if (compact === word) {
      return { valid: false, reason: 'Reserved team name is not allowed' };
    }
  }

  for (const word of BANNED) {
    if (norm.includes(word) || compact.includes(word)) {
      return { valid: false, reason: 'Team name contains prohibited content' };
    }
  }

  return { valid: true, sanitized: t, normalized: norm };
}
