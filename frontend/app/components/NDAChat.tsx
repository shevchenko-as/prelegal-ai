'use client';

import { useState, useEffect, useRef } from 'react';
import { api, ChatMessage } from '../lib/api';
import { NDAFormData } from '../lib/types';

function ndaToFlat(data: NDAFormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.purpose) out.purpose = data.purpose;
  if (data.effectiveDate) out.effective_date = data.effectiveDate;
  if (data.mndaTermType) out.mnda_term_type = data.mndaTermType;
  if (data.mndaYears) out.mnda_years = data.mndaYears;
  if (data.confTermType) out.conf_term_type = data.confTermType;
  if (data.confYears) out.conf_years = data.confYears;
  if (data.governingLaw) out.governing_law = data.governingLaw;
  if (data.jurisdiction) out.jurisdiction = data.jurisdiction;
  if (data.modifications) out.modifications = data.modifications;
  if (data.party1.company) out.party1_company = data.party1.company;
  if (data.party1.name) out.party1_name = data.party1.name;
  if (data.party1.title) out.party1_title = data.party1.title;
  if (data.party1.address) out.party1_address = data.party1.address;
  if (data.party2.company) out.party2_company = data.party2.company;
  if (data.party2.name) out.party2_name = data.party2.name;
  if (data.party2.title) out.party2_title = data.party2.title;
  if (data.party2.address) out.party2_address = data.party2.address;
  return out;
}

function flatToNDA(flat: Record<string, unknown>, current: NDAFormData): NDAFormData {
  return {
    purpose: typeof flat.purpose === 'string' ? flat.purpose : current.purpose,
    effectiveDate: typeof flat.effective_date === 'string' ? flat.effective_date : current.effectiveDate,
    mndaTermType: (flat.mnda_term_type as 'expires' | 'until_terminated') ?? current.mndaTermType,
    mndaYears: typeof flat.mnda_years === 'number' ? flat.mnda_years : current.mndaYears,
    confTermType: (flat.conf_term_type as 'years' | 'perpetuity') ?? current.confTermType,
    confYears: typeof flat.conf_years === 'number' ? flat.conf_years : current.confYears,
    governingLaw: typeof flat.governing_law === 'string' ? flat.governing_law : current.governingLaw,
    jurisdiction: typeof flat.jurisdiction === 'string' ? flat.jurisdiction : current.jurisdiction,
    modifications: typeof flat.modifications === 'string' ? flat.modifications : current.modifications,
    party1: {
      company: typeof flat.party1_company === 'string' ? flat.party1_company : current.party1.company,
      name: typeof flat.party1_name === 'string' ? flat.party1_name : current.party1.name,
      title: typeof flat.party1_title === 'string' ? flat.party1_title : current.party1.title,
      address: typeof flat.party1_address === 'string' ? flat.party1_address : current.party1.address,
    },
    party2: {
      company: typeof flat.party2_company === 'string' ? flat.party2_company : current.party2.company,
      name: typeof flat.party2_name === 'string' ? flat.party2_name : current.party2.name,
      title: typeof flat.party2_title === 'string' ? flat.party2_title : current.party2.title,
      address: typeof flat.party2_address === 'string' ? flat.party2_address : current.party2.address,
    },
  };
}

interface Props {
  data: NDAFormData;
  onFieldsUpdate: (data: NDAFormData) => void;
}

export default function NDAChat({ data, onFieldsUpdate }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api.chat([], {}).then(res => {
      if (!cancelled) {
        setMessages([{ role: 'assistant', content: res.message }]);
      }
    }).catch(console.error).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function sendMessage() {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const updated: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await api.chat(updated, ndaToFlat(dataRef.current));
      setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);
      if (Object.keys(res.fields).length > 0) {
        onFieldsUpdate(flatToNDA(res.fields, dataRef.current));
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong — please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">AI Assistant</h2>
        <p className="text-xs text-gray-400 mt-0.5">Answer the questions to fill out your NDA</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
                AI
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
              AI
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex space-x-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-200">
        <div className="flex gap-2 items-end">
          <textarea
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            placeholder="Type your answer…"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
