import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusIndicator from '../components/StatusIndicator';

describe('StatusIndicator', () => {
  it('renders running status', () => {
    render(<StatusIndicator status="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders stopped status', () => {
    render(<StatusIndicator status="stopped" />);
    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<StatusIndicator status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders pending status', () => {
    render(<StatusIndicator status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders uploaded status', () => {
    render(<StatusIndicator status="uploaded" />);
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
  });
});
