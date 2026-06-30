'use client';

import { useState, useEffect, useRef } from 'react';
import { api, ChatMessage } from '../lib/api';
import { getDocTypeInfo } from '../lib/documents';

interface Props {
  fields: Record<string, unknown>;
  docType: string | null;
  onFieldsUpdate: (fields: Record<string, unknown>) => void;
  onDocTypeChange: (docType: string) => void;
}

export default function DocumentChat({ fields, docType, onFieldsUpdate, onDocTypeChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef(fields);
  const docTypeRef = useRef(docType);

  useEffect(() => { fieldsRef.current = fields; }, [fields]);
  useEffect(() => { docTypeRef.current = docType; }, [docType]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api.chat([], {}, null).then(res => {
      if (cancelled) return;
      setMessages([{ role: 'assistant', content: res.message }]);
      if (res.doc_type) onDocTypeChange(res.doc_type);
      if (Object.keys(res.fields).length > 0) onFieldsUpdate(res.fields);
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
      const res = await api.chat(updated, fieldsRef.current, docTypeRef.current);
      setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);
      if (res.doc_type && res.doc_type !== docTypeRef.current) {
        onDocTypeChange(res.doc_type);
      }
      if (Object.keys(res.fields).length > 0) {
        onFieldsUpdate({ ...fieldsRef.current, ...res.fields });
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

  const docInfo = docType ? getDocTypeInfo(docType) : null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">AI Assistant</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {docInfo ? docInfo.name : 'Tell me what document you need'}
        </p>
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
