import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Banknote, Check, QrCode, X } from 'lucide-react';
import type { CartItem } from '../types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../services/api';

interface CheckoutModalProps {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  onClose: () => void;
  onConfirmPayment: (paymentMethod: 'CASH' | 'QRIS', cashAmount: number) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  subtotal,
  discount,
  tax,
  total,
  onClose,
  onConfirmPayment,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashAmount, setCashAmount] = useState(total);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  const quickCashOptions = useMemo(() => {
    const rounded50 = Math.ceil(total / 50000) * 50000;
    const rounded100 = Math.ceil(total / 100000) * 100000;
    return Array.from(new Set([total, rounded50, rounded100])).map((value) => ({
      value,
      label: value === total ? 'Uang pas' : formatRupiah(value),
    }));
  }, [total]);

  const changeAmount = cashAmount - total;

  const handlePay = async () => {
    if (paymentMethod === 'CASH' && cashAmount < total) {
      setErrorMessage(`Uang tunai masih kurang ${formatRupiah(total - cashAmount)}.`);
      return;
    }
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await onConfirmPayment(paymentMethod, paymentMethod === 'CASH' ? cashAmount : total);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Pembayaran gagal diproses. Coba lagi.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <header className="modal-header">
          <div><p className="eyebrow">Langkah terakhir</p><h2 id="checkout-title">Selesaikan pembayaran</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Tutup pembayaran"><X size={19} /></button>
        </header>

        <div className="modal-body checkout-body">
          <dl className="payment-summary">
            <div><dt>{cart.reduce((sum, item) => sum + item.qty, 0)} item</dt><dd>{formatRupiah(subtotal)}</dd></div>
            {discount > 0 && <div className="discount-row"><dt>Diskon</dt><dd>−{formatRupiah(discount)}</dd></div>}
            {tax !== undefined && tax > 0 && <div><dt>Pajak</dt><dd>{formatRupiah(tax)}</dd></div>}
            <div className="payment-total"><dt>Total bayar</dt><dd>{formatRupiah(total)}</dd></div>
          </dl>

          <fieldset className="payment-methods">
            <legend>Metode pembayaran</legend>
            <button type="button" className={paymentMethod === 'CASH' ? 'payment-method active' : 'payment-method'} onClick={() => setPaymentMethod('CASH')} aria-pressed={paymentMethod === 'CASH'}>
              <Banknote size={20} /><span><strong>Tunai</strong><small>Hitung kembalian</small></span>{paymentMethod === 'CASH' && <Check size={17} />}
            </button>
            <button type="button" className={paymentMethod === 'QRIS' ? 'payment-method active' : 'payment-method'} onClick={() => setPaymentMethod('QRIS')} aria-pressed={paymentMethod === 'QRIS'}>
              <QrCode size={20} /><span><strong>QRIS</strong><small>Pindai kode bayar</small></span>{paymentMethod === 'QRIS' && <Check size={17} />}
            </button>
          </fieldset>

          {paymentMethod === 'CASH' ? (
            <div className="cash-payment">
              <label className="field-group">
                <span>Uang diterima</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-field payment-input"
                  value={formatRupiahInput(cashAmount)}
                  onChange={(event) => setCashAmount(parseRupiahInput(event.target.value))}
                  placeholder="Rp 0"
                />
              </label>
              <div className="quick-values">
                {quickCashOptions.map((option) => <button key={option.value} type="button" onClick={() => setCashAmount(option.value)}>{option.label}</button>)}
              </div>
              <div className={changeAmount >= 0 ? 'change-row positive' : 'change-row negative'}>
                <span>{changeAmount >= 0 ? 'Kembalian' : 'Uang kurang'}</span>
                <strong>{formatRupiah(Math.abs(changeAmount))}</strong>
              </div>
            </div>
          ) : (
            <div className="qris-panel">
              <div className="qris-stand-card">
                <div className="qris-stand-top">
                  <span className="qris-logo-tag">QRIS</span>
                  <span className="gpn-logo-tag">GPN</span>
                </div>
                <div className="qris-merchant-info">
                  <h3 className="qris-merchant-name">QR ALLINS STORE</h3>
                  <p className="qris-nmid">NMID : ID1023303345624 · A01</p>
                </div>
                <div className="qris-code">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=00020101021126590013ID.CO.BNI.WWW011893600009150367784202096022739230303UMI51440014ID.CO.QRIS.WWW0215ID10233033456240303UMI5204599953033605802ID5915QR%20ALLINS%20STORE6006PADANG61052514262070703A0163040F05"
                    alt="Kode QRIS QR ALLINS STORE"
                    width="170"
                    height="170"
                  />
                </div>
                <div className="qris-stand-bottom">
                  <p className="qris-slogan">SATU QRIS UNTUK SEMUA</p>
                  <p className="qris-bank">Penyelenggara: <strong>BNI</strong></p>
                </div>
              </div>
              <div className="qris-instructions">
                <p className="eyebrow">Instruksi Pembayaran</p>
                <h3>Scan QR dengan Mobile Banking / E-Wallet</h3>
                <p>Mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, LinkAja, dll.</p>
                <div className="qris-check-box">
                  <div>
                    <small>Nama Penerima</small>
                    <strong>QR ALLINS STORE (MJB SPORT)</strong>
                  </div>
                  <div>
                    <small>Nominal Bayar</small>
                    <strong className="qris-amount">{formatRupiah(total)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errorMessage && <div className="form-alert" role="alert"><AlertCircle size={16} /> {errorMessage}</div>}
        </div>

        <footer className="modal-footer single-action">
          <button type="button" className="btn btn-primary btn-large" onClick={handlePay} disabled={isProcessing}>
            {isProcessing ? 'Memproses…' : `Konfirmasi · ${formatRupiah(total)}`}
          </button>
        </footer>
      </section>
    </div>
  );
};
