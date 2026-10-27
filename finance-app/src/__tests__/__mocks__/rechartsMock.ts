/**
 * Recharts mock for Jest / jsdom.
 *
 * Recharts uses ResizeObserver and SVG APIs that jsdom does not implement.
 * This mock replaces every Recharts component with a simple <div> that
 * carries a data-testid so tests can assert the chart was rendered.
 *
 * Referenced in jest.config.ts moduleNameMapper.
 */

import * as React from 'react';

function makeStub(displayName: string) {
  const Stub = ({ children, ...rest }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement(
      'div',
      { 'data-testid': `recharts-${displayName.toLowerCase()}`, ...rest },
      children,
    );
  Stub.displayName = displayName;
  return Stub;
}

export const ResponsiveContainer = ({ children }: { children: React.ReactNode }) =>
  React.createElement('div', { 'data-testid': 'recharts-responsivecontainer' }, children);

// Chart roots
export const LineChart  = makeStub('LineChart');
export const AreaChart  = makeStub('AreaChart');
export const BarChart   = makeStub('BarChart');

// Series
export const Line          = () => null;
export const Area          = () => null;
export const Bar           = () => null;

// Axes & decoration
export const XAxis         = () => null;
export const YAxis         = () => null;
export const CartesianGrid = () => null;
export const Tooltip       = () => null;
export const Legend        = () => null;
export const ReferenceLine = () => null;
