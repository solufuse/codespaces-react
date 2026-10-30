import { expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders the ASCII Sodural logo linked to LinkedIn and interactive ETAP SLD simulator', () => {
  render(<App />);
  const logoLink = screen.getByRole('link', { name: /sodural.*linkedin/i });
  expect(logoLink.getAttribute('href')).toBe('https://www.linkedin.com/in/pascalso/');
  expect(logoLink.querySelector('pre').textContent.match(/#/g).length).toBeGreaterThan(100);
  expect(document.querySelector('.ascii-vortex').getAttribute('aria-hidden')).toBe('true');

  // Verify Load Flow & Short-Circuit IEC 60909 simulator renders
  expect(screen.getByText(/Simulateur de Réseau HTB\/HTA/i)).toBeInTheDocument();
  const faultBtn = screen.getByRole('button', { name: /MODE COURT-CIRCUIT Icc/i });
  fireEvent.click(faultBtn);
  expect(screen.getByText(/ANALYSE COURT-CIRCUIT CEI 60909/i)).toBeInTheDocument();
});
