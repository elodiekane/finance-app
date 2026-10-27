import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SummaryCard } from '../../components/charts/SummaryCard';

describe('SummaryCard', () => {
  it('renders label and value', () => {
    render(<SummaryCard label="Price" value="$171.20" />);

    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('$171.20')).toBeInTheDocument();
  });

  it('renders subValue when provided', () => {
    render(<SummaryCard label="Change" value="+2.35" subValue="+1.39%" positive />);

    expect(screen.getByText('+2.35')).toBeInTheDocument();
    expect(screen.getByText('+1.39%')).toBeInTheDocument();
  });

  it('renders without subValue', () => {
    render(<SummaryCard label="Volume" value="4.2M" />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('4.2M')).toBeInTheDocument();
  });
});
