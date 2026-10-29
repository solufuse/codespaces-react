import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders only the ASCII Sodural logo linked to LinkedIn', () => {
  render(<App />);
  const logoLink = screen.getByRole('link', { name: /sodural.*linkedin/i });
  expect(logoLink.getAttribute('href')).toBe('https://www.linkedin.com/in/pascalso/');
  expect(logoLink.querySelector('pre').textContent.match(/#/g).length).toBeGreaterThan(100);
  expect(document.querySelector('.ascii-vortex').getAttribute('aria-hidden')).toBe('true');
  expect(screen.getByRole('main').children).toHaveLength(2);
});
