import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderEntryForm } from '../components/OrderEntryForm';
import { useExchangeStore } from '../store/exchangeStore';

// Mock the store
jest.mock('../store/exchangeStore', () => ({
  useExchangeStore: jest.fn(),
}));

const mockUseExchangeStore = useExchangeStore as jest.MockedFunction<typeof useExchangeStore>;

describe('OrderEntryForm Integration', () => {
  const mockStore = {
    currentOrder: {
      side: 'buy' as const,
      type: 'limit' as const,
      price: '',
      quantity: '',
    },
    isOrderModalOpen: false,
    orderBook: {
      bids: [{ price: 99.5, quantity: 5, total: 5, count: 1 }],
      asks: [{ price: 100.5, quantity: 3, total: 3, count: 1 }],
      midPrice: 100,
      spread: 1,
    },
    updateOrderForm: jest.fn(),
    setOrderModalOpen: jest.fn(),
    submitOrder: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseExchangeStore.mockReturnValue(mockStore);
  });

  test('should open order modal when button is clicked', async () => {
    const user = userEvent.setup();
    render(<OrderEntryForm />);

    const openButton = screen.getByText(/new order/i);
    await user.click(openButton);

    expect(mockStore.setOrderModalOpen).toHaveBeenCalledWith(true);
  });

  test('should show modal with form fields when open', () => {
    mockUseExchangeStore.mockReturnValue({
      ...mockStore,
      isOrderModalOpen: true,
    });

    const { container } = render(<OrderEntryForm />);

    // Instead of looking for text that appears in both button and modal,
    // check for the modal's existence using a specific query
    expect(container.querySelector('.bg-slate-800')).toBeInTheDocument(); // Modal dialog
    
    // Be more specific about which buy/sell buttons we're looking for
    const sideButtons = container.querySelectorAll('.grid.grid-cols-2 button');
    expect(sideButtons[0]).toHaveTextContent('Buy');
    expect(sideButtons[1]).toHaveTextContent('Sell');
    
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
  });

  test('should submit order with correct data', async () => {
    const user = userEvent.setup();
    mockUseExchangeStore.mockReturnValue({
      ...mockStore,
      isOrderModalOpen: true,
      currentOrder: {
        side: 'buy',
        type: 'limit',
        price: '100.50',
        quantity: '2.5',
      },
    });

    render(<OrderEntryForm />);

    const submitButton = screen.getByRole('button', { name: /place buy order/i });
    await user.click(submitButton);

    expect(mockStore.submitOrder).toHaveBeenCalledWith({
      side: 'buy',
      type: 'limit',
      price: '100.50',
      quantity: '2.5',
    });
  });

  test('should validate required fields', async () => {
    const user = userEvent.setup();
    mockUseExchangeStore.mockReturnValue({
      ...mockStore,
      isOrderModalOpen: true,
      currentOrder: {
        side: 'buy',
        type: 'limit',
        price: '',
        quantity: '',
      },
    });

    render(<OrderEntryForm />);

    const submitButton = screen.getByRole('button', { name: /place buy order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/quantity must be greater than 0/i)).toBeInTheDocument();
      expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument();
    });

    expect(mockStore.submitOrder).not.toHaveBeenCalled();
  });

  test('should update form data when inputs change', async () => {
    const user = userEvent.setup();
    mockUseExchangeStore.mockReturnValue({
      ...mockStore,
      isOrderModalOpen: true,
    });

    render(<OrderEntryForm />);

    const priceInput = screen.getByLabelText(/price/i);
    const quantityInput = screen.getByLabelText(/quantity/i);

    await user.type(priceInput, '100.50');
    await user.type(quantityInput, '2.5');

    expect(mockStore.updateOrderForm).toHaveBeenCalledWith({ price: expect.any(String) });
    expect(mockStore.updateOrderForm).toHaveBeenCalledWith({ quantity: expect.any(String) });
  });

  test('should switch between buy and sell', async () => {
    const user = userEvent.setup();
    mockUseExchangeStore.mockReturnValue({
      ...mockStore,
      isOrderModalOpen: true,
    });

    render(<OrderEntryForm />);

    const sellButton = screen.getByRole('button', { name: /sell/i });
    await user.click(sellButton);

    expect(mockStore.updateOrderForm).toHaveBeenCalledWith({ side: 'sell' });
  });

  test('should switch between market and limit orders', async () => {
    const user = userEvent.setup();
    mockUseExchangeStore.mockReturnValue({
      ...mockStore,
      isOrderModalOpen: true,
    });

    render(<OrderEntryForm />);

    const marketButton = screen.getByRole('button', { name: /market/i });
    await user.click(marketButton);

    expect(mockStore.updateOrderForm).toHaveBeenCalledWith({ type: 'market' });
  });

  test('should quick-fill price for buy orders', async () => {
    const user = userEvent.setup();
    mockUseExchangeStore.mockReturnValue({
      ...mockStore,
      isOrderModalOpen: true,
      currentOrder: { ...mockStore.currentOrder, side: 'buy' },
    });

    render(<OrderEntryForm />);

    const quickFillButton = screen.getByRole('button', { name: /best ask/i });
    await user.click(quickFillButton);

    expect(mockStore.updateOrderForm).toHaveBeenCalledWith({ price: '100.5' });
  });

  test('should close modal on escape key', async () => {
    const user = userEvent.setup();
    mockUseExchangeStore.mockReturnValue({
      ...mockStore,
      isOrderModalOpen: true,
    });

    render(<OrderEntryForm />);

    await user.keyboard('{Escape}');

    expect(mockStore.setOrderModalOpen).toHaveBeenCalledWith(false);
  });

  test('should not show price input for market orders', () => {
    mockUseExchangeStore.mockReturnValue({
      ...mockStore,
      isOrderModalOpen: true,
      currentOrder: { ...mockStore.currentOrder, type: 'market' },
    });

    render(<OrderEntryForm />);

    expect(screen.queryByLabelText(/price/i)).not.toBeInTheDocument();
  });
});