import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompanyCard } from '../../components/dashboard/CompanyCard';
import type { Quote } from '../../types/finance';

const MOCK_QUOTE: Quote = {
  symbol:        'IBM',
  name:          'IBM',
  currency:      'USD',
  exchange:      'NYSE',
  price:         171.20,
  change:        2.35,
  changePercent: 1.39,
  volume:        4_200_000,
  dayHigh:       172.50,
  dayLow:        168.80,
};

describe('CompanyCard', () => {
  it('renders company name, symbol, and price', () => {
    render(<CompanyCard quote={MOCK_QUOTE} isLoading={false} />);

    // Symbol and name are both 'IBM' in the mock — use getAllByText
    const ibmElements = screen.getAllByText('IBM');
    expect(ibmElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('$171.20')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading is true', () => {
    render(<CompanyCard quote={MOCK_QUOTE} isLoading={true} />);
    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('$171.20')).not.toBeInTheDocument();
  });

  it('shows error banner when error prop is provided', () => {
    render(
      <CompanyCard
        quote={MOCK_QUOTE}
        isLoading={false}
        error="Failed to load quote"
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load quote')).toBeInTheDocument();
  });

  it('renders day range when dayHigh and dayLow are present', () => {
    render(<CompanyCard quote={MOCK_QUOTE} isLoading={false} />);
    expect(screen.getByText('Day Range')).toBeInTheDocument();
  });
});
