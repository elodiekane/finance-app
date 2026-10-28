import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataSourceBadge } from '../../components/layout/DataSourceBadge';
import { Header } from '../../components/layout/Header';
import { isMockMode } from '../../services/dataSource';

// dataSource.ts reads import.meta.env, which Jest cannot load as CommonJS.
jest.mock('../../services/dataSource', () => ({ isMockMode: jest.fn() }));

describe('DataSourceBadge', () => {
  it('shows "MOCK DATA" when mock mode is on', () => {
    render(<DataSourceBadge isMock={true} />);
    expect(screen.getByRole('status')).toHaveTextContent('MOCK DATA');
    expect(screen.queryByText('LIVE DATA')).not.toBeInTheDocument();
  });

  it('shows "LIVE DATA" when mock mode is off', () => {
    render(<DataSourceBadge isMock={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('LIVE DATA');
    expect(screen.queryByText('MOCK DATA')).not.toBeInTheDocument();
  });
});

describe('Header', () => {
  it('shows the mock badge and keeps existing content when mock mode is on', () => {
    (isMockMode as jest.Mock).mockReturnValue(true);
    render(<Header />);
    expect(screen.getByText('Market Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Finance Analytics Lab')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('MOCK DATA');
  });

  it('shows the live badge and keeps existing content when mock mode is off', () => {
    (isMockMode as jest.Mock).mockReturnValue(false);
    render(<Header />);
    expect(screen.getByText('Market Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Finance Analytics Lab')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('LIVE DATA');
  });
});
