export interface PartyInfo {
  company: string;
  name: string;
  title: string;
  address: string;
}

export interface NDAFormData {
  purpose: string;
  effectiveDate: string;
  mndaTermType: 'expires' | 'until_terminated';
  mndaYears: number;
  confTermType: 'years' | 'perpetuity';
  confYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyInfo;
  party2: PartyInfo;
}

export const defaultFormData: NDAFormData = {
  purpose: '',
  effectiveDate: '',
  mndaTermType: 'expires',
  mndaYears: 1,
  confTermType: 'years',
  confYears: 1,
  governingLaw: '',
  jurisdiction: '',
  modifications: '',
  party1: { company: '', name: '', title: '', address: '' },
  party2: { company: '', name: '', title: '', address: '' },
};
