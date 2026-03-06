// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Mitarbeiter {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    mitarbeiternummer?: string;
    position?: string;
    email?: string;
    telefon?: string;
  };
}

export interface Schichtvorlagen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schichtname?: string;
    startzeit?: string;
    endzeit?: string;
    anzahl_mitarbeiter?: number;
    beschreibung?: string;
  };
}

export interface Schichtzuweisung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    schichtvorlage?: string; // applookup -> URL zu 'Schichtvorlagen' Record
    mitarbeiter?: string; // applookup -> URL zu 'Mitarbeiter' Record
    notizen?: string;
  };
}

export const APP_IDS = {
  MITARBEITER: '69a5860192f737e692036858',
  SCHICHTVORLAGEN: '69a58607b76784b46b9548cc',
  SCHICHTZUWEISUNG: '69a58608e5f5a19d37e7a3b4',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitarbeiter': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'mitarbeiternummer': 'string/text',
    'position': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
  },
  'schichtvorlagen': {
    'schichtname': 'string/text',
    'startzeit': 'string/text',
    'endzeit': 'string/text',
    'anzahl_mitarbeiter': 'number',
    'beschreibung': 'string/textarea',
  },
  'schichtzuweisung': {
    'datum': 'date/date',
    'schichtvorlage': 'applookup/select',
    'mitarbeiter': 'applookup/select',
    'notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitarbeiter = StripLookup<Mitarbeiter['fields']>;
export type CreateSchichtvorlagen = StripLookup<Schichtvorlagen['fields']>;
export type CreateSchichtzuweisung = StripLookup<Schichtzuweisung['fields']>;