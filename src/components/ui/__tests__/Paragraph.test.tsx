import React from 'react';
import { render, screen } from '@testing-library/react';
import { Paragraph } from '../Paragraph';

describe('Paragraph', () => {
  it('renders children correctly', () => {
    render(<Paragraph>Test paragraph content</Paragraph>);
    expect(screen.getByText('Test paragraph content')).toBeInTheDocument();
  });

  it('renders as a <p> element', () => {
    const { container } = render(<Paragraph>Content</Paragraph>);
    expect(container.firstChild?.nodeName).toBe('P');
  });

  it('has base styling classes', () => {
    render(<Paragraph>Styled text</Paragraph>);
    const p = screen.getByText('Styled text');
    expect(p).toHaveClass('text-sm');
    expect(p).toHaveClass('leading-relaxed');
    expect(p).toHaveClass('mb-4');
  });

  it('merges custom className alongside base classes', () => {
    render(<Paragraph className="mt-8">Custom class</Paragraph>);
    const p = screen.getByText('Custom class');
    expect(p).toHaveClass('mt-8');
    expect(p).toHaveClass('text-sm');
    expect(p).toHaveClass('leading-relaxed');
  });

  it('renders nested elements as children', () => {
    render(
      <Paragraph>
        Text with <strong>bold</strong> content
      </Paragraph>
    );
    expect(screen.getByText('bold')).toBeInTheDocument();
  });
});
