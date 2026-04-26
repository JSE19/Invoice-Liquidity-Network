import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InvoiceDetailPage from '../InvoiceDetail';
import * as soroban from '../../../utils/soroban';
import { useWallet } from '../../../context/WalletContext';
import { useToast } from '../../../context/ToastContext';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../context/WalletContext', () => ({
  useWallet: vi.fn(),
}));

vi.mock('../../../context/ToastContext', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../../utils/soroban', () => ({
  getInvoice: vi.fn(),
}));

vi.mock('../../../hooks/useApprovedTokens', () => ({
  useApprovedTokens: vi.fn().mockReturnValue({
    tokens: [],
    tokenMap: new Map(),
    defaultToken: null,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const FREELANCER_ADDR = 'GFREELANCERADDR1234567890123456789012345678901234567890';
const PAYER_ADDR = 'GPAYERADDR12345678901234567890123456789012345678901234567';

const baseMockInvoice: soroban.Invoice = {
  id: 42n,
  freelancer: FREELANCER_ADDR,
  payer: PAYER_ADDR,
  amount: 500_000_000n, // 50 USDC
  due_date: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
  discount_rate: 500, // 5%
  status: 'Funded',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InvoiceDetailPage — Copy Payer Link', () => {
  const mockAddToast = vi.fn().mockReturnValue('toast-id');
  const mockUpdateToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({
      addToast: mockAddToast,
      updateToast: mockUpdateToast,
      removeToast: vi.fn(),
    });
    (soroban.getInvoice as any).mockResolvedValue(baseMockInvoice);

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders "Copy payer link" button when connected as freelancer on a non-paid invoice', async () => {
    (useWallet as any).mockReturnValue({
      address: FREELANCER_ADDR,
      isConnected: true,
      connect: vi.fn(),
    });

    render(<InvoiceDetailPage id="42" />);

    await waitFor(() => {
      expect(screen.getByText('Copy payer link')).toBeInTheDocument();
    });
  });

  it('does NOT render "Copy payer link" button for non-freelancer addresses', async () => {
    (useWallet as any).mockReturnValue({
      address: PAYER_ADDR,
      isConnected: true,
      connect: vi.fn(),
    });

    render(<InvoiceDetailPage id="42" />);

    await waitFor(() => {
      expect(screen.getByText(/Invoice #42/)).toBeInTheDocument();
    });

    expect(screen.queryByText('Copy payer link')).not.toBeInTheDocument();
  });

  it('does NOT render "Copy payer link" button when invoice is Paid', async () => {
    (soroban.getInvoice as any).mockResolvedValue({
      ...baseMockInvoice,
      status: 'Paid',
    });

    (useWallet as any).mockReturnValue({
      address: FREELANCER_ADDR,
      isConnected: true,
      connect: vi.fn(),
    });

    render(<InvoiceDetailPage id="42" />);

    await waitFor(() => {
      expect(screen.getByText(/Invoice #42/)).toBeInTheDocument();
    });

    expect(screen.queryByText('Copy payer link')).not.toBeInTheDocument();
  });

  it('copies correct payer link URL and shows success toast on click', async () => {
    (useWallet as any).mockReturnValue({
      address: FREELANCER_ADDR,
      isConnected: true,
      connect: vi.fn(),
    });

    render(<InvoiceDetailPage id="42" />);

    await waitFor(() => {
      expect(screen.getByText('Copy payer link')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Copy payer link'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/pay/42')
      );
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Link copied!',
        })
      );
    });
  });

  it('shows error toast when clipboard write fails', async () => {
    (useWallet as any).mockReturnValue({
      address: FREELANCER_ADDR,
      isConnected: true,
      connect: vi.fn(),
    });

    (navigator.clipboard.writeText as any).mockRejectedValue(
      new Error('Clipboard denied')
    );

    render(<InvoiceDetailPage id="42" />);

    await waitFor(() => {
      expect(screen.getByText('Copy payer link')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Copy payer link'));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Copy failed',
        })
      );
    });
  });
});
