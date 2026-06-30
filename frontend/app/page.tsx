import type { Metadata } from 'next';
import NDACreator from './components/NDACreator';

export const metadata: Metadata = {
  title: 'Mutual NDA Creator — Prelegal AI',
};

export default function Home() {
  return <NDACreator />;
}
