import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { RoleBadge } from './RoleBadge';

describe('RoleBadge Component', () => {
  it('renders System Administrator badge for admin role', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText('System Administrator')).toBeInTheDocument();
  });

  it('renders Compliance Officer badge for compliance_officer role', () => {
    render(<RoleBadge role="compliance_officer" />);
    expect(screen.getByText('Compliance Officer')).toBeInTheDocument();
  });

  it('renders Data Analyst badge for default/analyst role', () => {
    render(<RoleBadge role="analyst" />);
    expect(screen.getByText('Data Analyst')).toBeInTheDocument();
  });
});
