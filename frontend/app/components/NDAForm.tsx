'use client';

import { NDAFormData, PartyInfo } from '../lib/types';

interface Props {
  data: NDAFormData;
  onChange: (data: NDAFormData) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold tracking-widest uppercase text-gray-400 mt-6 mb-3 pb-2 border-b border-gray-100 first:mt-0">
      {children}
    </div>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{optional && <span className="font-normal text-gray-400 ml-1">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors";

function PartyFields({ prefix, value, onChange }: {
  prefix: string;
  value: PartyInfo;
  onChange: (v: PartyInfo) => void;
}) {
  const set = (key: keyof PartyInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Company">
        <input className={inputClass} placeholder={`${prefix} Corp.`} value={value.company} onChange={set('company')} />
      </Field>
      <Field label="Signatory Name">
        <input className={inputClass} placeholder="Jane Smith" value={value.name} onChange={set('name')} />
      </Field>
      <Field label="Title">
        <input className={inputClass} placeholder="CEO" value={value.title} onChange={set('title')} />
      </Field>
      <Field label="Notice Address">
        <input className={inputClass} placeholder="jane@company.com" value={value.address} onChange={set('address')} />
      </Field>
    </div>
  );
}

export default function NDAForm({ data, onChange }: Props) {
  const set = <K extends keyof NDAFormData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...data, [key]: e.target.value });

  return (
    <div className="p-5 pb-16">
      <SectionTitle>Agreement Details</SectionTitle>

      <Field label="Purpose">
        <textarea
          className={`${inputClass} resize-y min-h-[72px]`}
          placeholder="Evaluating whether to enter into a business relationship with the other party."
          value={data.purpose}
          onChange={set('purpose')}
        />
      </Field>

      <Field label="Effective Date">
        <input type="date" className={inputClass} value={data.effectiveDate} onChange={set('effectiveDate')} />
      </Field>

      <Field label="MNDA Term">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="radio" name="mndaTermType" className="accent-indigo-500"
              checked={data.mndaTermType === 'expires'}
              onChange={() => onChange({ ...data, mndaTermType: 'expires' })} />
            Expires after
            <input type="number" min={1} max={99}
              className="w-16 px-2 py-1 text-sm text-center border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400"
              value={data.mndaYears}
              onChange={(e) => onChange({ ...data, mndaYears: Number(e.target.value) })} />
            <span className="text-gray-500">year(s)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="radio" name="mndaTermType" className="accent-indigo-500"
              checked={data.mndaTermType === 'until_terminated'}
              onChange={() => onChange({ ...data, mndaTermType: 'until_terminated' })} />
            Continues until terminated
          </label>
        </div>
      </Field>

      <Field label="Term of Confidentiality">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="radio" name="confTermType" className="accent-indigo-500"
              checked={data.confTermType === 'years'}
              onChange={() => onChange({ ...data, confTermType: 'years' })} />
            <input type="number" min={1} max={99}
              className="w-16 px-2 py-1 text-sm text-center border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400"
              value={data.confYears}
              onChange={(e) => onChange({ ...data, confYears: Number(e.target.value) })} />
            <span className="text-gray-500">year(s) from Effective Date</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="radio" name="confTermType" className="accent-indigo-500"
              checked={data.confTermType === 'perpetuity'}
              onChange={() => onChange({ ...data, confTermType: 'perpetuity' })} />
            In perpetuity
          </label>
        </div>
      </Field>

      <Field label="Governing Law (State)">
        <input className={inputClass} placeholder="e.g. Delaware" value={data.governingLaw} onChange={set('governingLaw')} />
      </Field>

      <Field label="Jurisdiction">
        <input className={inputClass} placeholder="e.g. courts located in New Castle, DE" value={data.jurisdiction} onChange={set('jurisdiction')} />
      </Field>

      <Field label="MNDA Modifications" optional>
        <textarea className={`${inputClass} resize-y min-h-[60px]`}
          placeholder="List any modifications, or leave blank"
          value={data.modifications} onChange={set('modifications')} />
      </Field>

      <SectionTitle>Party 1</SectionTitle>
      <PartyFields prefix="Alpha" value={data.party1}
        onChange={(v) => onChange({ ...data, party1: v })} />

      <SectionTitle>Party 2</SectionTitle>
      <PartyFields prefix="Beta" value={data.party2}
        onChange={(v) => onChange({ ...data, party2: v })} />
    </div>
  );
}
