import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Organizational Climate Platform',
  description:
    'Sign in to access your organizational climate and culture insights',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
