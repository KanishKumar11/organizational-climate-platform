import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Action Plans | Organizational Climate Platform',
  description: 'Create, manage, and track action plans based on survey insights and AI recommendations.',
};

export default function ActionPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
