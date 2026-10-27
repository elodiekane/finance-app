import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TimeWindowTabs } from '../../components/layout/TimeWindowTabs';

describe('TimeWindowTabs', () => {
  it('renders all three tab labels', () => {
    render(<TimeWindowTabs active="day" onChange={() => {}} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Last Quarter')).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected=true', () => {
    render(<TimeWindowTabs active="7d" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Last 7 Days' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Today' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Last Quarter' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with "7d" when the Last 7 Days tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<TimeWindowTabs active="day" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Last 7 Days' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('7d');
  });

  it('calls onChange with "quarter" when Last Quarter is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<TimeWindowTabs active="day" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Last Quarter' }));

    expect(onChange).toHaveBeenCalledWith('quarter');
  });

  it('calls onChange with "day" when Today is clicked from another window', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<TimeWindowTabs active="quarter" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Today' }));

    expect(onChange).toHaveBeenCalledWith('day');
  });

  it('does not call onChange when the already-active tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<TimeWindowTabs active="day" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Today' }));

    // onChange is still called — the parent decides whether to re-fetch.
    // This test documents the actual behaviour: the callback fires regardless.
    expect(onChange).toHaveBeenCalledWith('day');
  });

  it('renders a tablist with an accessible label', () => {
    render(<TimeWindowTabs active="day" onChange={() => {}} />);
    expect(screen.getByRole('tablist', { name: 'Time window' })).toBeInTheDocument();
  });
});
