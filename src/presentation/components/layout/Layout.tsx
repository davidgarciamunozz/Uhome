import { type ReactNode } from 'react';
import Nav from './Nav';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
    </>
  );
}
