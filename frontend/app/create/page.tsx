import type { Metadata } from 'next';
import AppShell from '../components/AppShell';
import NDACreatorInner from '../components/NDACreatorInner';

export const metadata: Metadata = { title: 'Mutual NDA Creator — Prelegal AI' };

export default function CreatePage() {
  return (
    <AppShell>
      <NDACreatorInner />
    </AppShell>
  );
}
