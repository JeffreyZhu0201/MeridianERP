'use client';

/**
 * PickupVerifyDialog - 自提核销对话框组件
 *
 * 用于商户验证消费者自提订单场景：
 * - 显示订单信息（订单号、客户名称、总金额）
 * - 支持 6 位数字验证码输入
 * - 支持二维码扫描（通过 BarcodeDetector API）
 * - 支持粘贴 JSON 格式的 QR payload
 * - 支持文本文件上传解析
 *
 * @example
 * ```tsx
 * <PickupVerifyDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   orderId="order_abc123"
 *   customerLabel="张三"
 *   total="¥128.00"
 *   onVerify={(code) => handleVerify(code)}
 *   isSubmitting={isVerifying}
 *   error={errorMessage}
 * />
 * ```
 */

import * as React from 'react';
import { ScanLine } from 'lucide-react';

import { Button } from '../ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '../ui/input-otp';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';

/**
 * PickupVerifyDialog 属性接口
 * @param open - 对话框是否打开
 * @param onOpenChange - 对话框开关状态变化回调
 * @param orderId - 订单 ID
 * @param customerLabel - 客户名称
 * @param total - 订单总金额
 * @param onVerify - 确认核销回调（参数为 6 位验证码）
 * @param isSubmitting - 是否正在提交（显示 loading 状态）
 * @param error - 错误信息
 */
export interface PickupVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  customerLabel: string;
  total: string;
  onVerify?: (code: string) => void;
  isSubmitting?: boolean;
  error?: string;
}

/**
 * 从 QR payload 中解析 6 位取货码
 * 支持两种格式：
 * 1. 纯 6 位数字：'123456'
 * 2. JSON 格式：'{"orderId":"...","code":"123456"}'
 */
function parsePickupCodeFromQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  // 格式 1：纯 6 位数字
  if (/^\d{6}$/.test(trimmed)) {
    return trimmed;
  }
  // 格式 2：JSON 格式
  try {
    const data = JSON.parse(trimmed) as { code?: unknown; orderId?: unknown };
    if (typeof data.code === 'string' && /^\d{6}$/.test(data.code)) {
      return data.code;
    }
  } catch {
    // not JSON — fall through
  }
  return null;
}

/**
 * 从图片文件中解析取货码
 * 使用 BarcodeDetector API（Chrome/Edge 支持）检测二维码
 * 返回解析到的第一个 6 位取货码
 */
async function parsePickupCodeFromImageFile(file: File): Promise<string | null> {
  const BarcodeDetectorCtor = (
    globalThis as typeof globalThis & {
      BarcodeDetector?: new (options: { formats: string[] }) => {
        detect: (source: ImageBitmap) => Promise<Array<{ rawValue: string }>>;
      };
    }
  ).BarcodeDetector;
  if (!BarcodeDetectorCtor) {
    return null;
  }
  const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
  const bitmap = await createImageBitmap(file);
  const codes = await detector.detect(bitmap);
  bitmap.close();
  for (const result of codes) {
    const parsed = parsePickupCodeFromQrPayload(result.rawValue);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * 自提核销对话框组件
 * - 6 位 OTP 输入框 + 扫描二维码按钮
 * - 支持粘贴 JSON payload 或上传 QR 图片
 * - ESC 键关闭对话框
 */
export function PickupVerifyDialog({
  open,
  onOpenChange,
  orderId,
  customerLabel,
  total,
  onVerify,
  isSubmitting,
  error,
}: PickupVerifyDialogProps) {
  const [code, setCode] = React.useState('');
  const [scanOpen, setScanOpen] = React.useState(false);
  const [pasteValue, setPasteValue] = React.useState('');
  const [scanError, setScanError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 关闭时重置所有状态
  React.useEffect(() => {
    if (!open) {
      setCode('');
      setScanOpen(false);
      setPasteValue('');
      setScanError('');
    }
  }, [open]);

  // ESC 键关闭对话框
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  /** 应用解析后的取货码 */
  function applyParsedCode(parsed: string | null, fallbackMessage: string) {
    if (parsed) {
      setCode(parsed);
      setScanError('');
      setScanOpen(false);
      return;
    }
    setScanError(fallbackMessage);
  }

  /** 处理粘贴的 JSON payload */
  function handlePasteApply() {
    applyParsedCode(
      parsePickupCodeFromQrPayload(pasteValue),
      'Could not parse a 6-digit code from pasted content.',
    );
  }

  /** 处理文件上传（支持文本文件和图片） */
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setScanError('');

    // 文本文件：直接解析内容
    if (
      file.type.startsWith('text/') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.txt')
    ) {
      const text = await file.text();
      applyParsedCode(
        parsePickupCodeFromQrPayload(text),
        'Could not parse pickup code from text file.',
      );
      return;
    }

    // 图片文件：使用 BarcodeDetector 解析二维码
    if (file.type.startsWith('image/')) {
      try {
        const parsed = await parsePickupCodeFromImageFile(file);
        applyParsedCode(
          parsed,
          'Could not read QR from image. Paste the QR payload JSON instead.',
        );
      } catch {
        setScanError('Could not read QR from image. Paste the QR payload JSON instead.');
      }
      return;
    }

    setScanError('Unsupported file type. Paste JSON or upload a QR image.');
  }

  const canSubmit = code.length === 6 && !isSubmitting;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => !isSubmitting && onOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="pickup-verify-title"
        className={cn(
          'relative z-50 grid w-full max-w-md gap-4 rounded-xl bg-background p-6 ring-1 ring-border',
        )}
      >
        <div className="space-y-2">
          <h2 id="pickup-verify-title" className="text-lg font-semibold">
            Verify pickup
          </h2>
          <p className="text-sm text-muted-foreground">
            Confirm the customer&apos;s 6-digit code or scan their QR before handing over goods.
          </p>
        </div>

        <div className="space-y-4 py-2">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="font-mono text-xs">{orderId.slice(0, 12)}…</dd>
            <dt className="text-muted-foreground">Customer</dt>
            <dd>{customerLabel}</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-medium tabular-nums">{total}</dd>
          </dl>

          <div className="space-y-3">
            <Label htmlFor="pickup-code">Pickup code</Label>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <InputOTP
                id="pickup-code"
                maxLength={6}
                value={code}
                onChange={setCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0"
                onClick={() => {
                  setScanOpen((prev) => !prev);
                  setScanError('');
                }}
              >
                <ScanLine className="mr-2 size-4" aria-hidden />
                {scanOpen ? 'Hide scan' : 'Scan QR'}
              </Button>
            </div>

            {scanOpen ? (
              <div className="space-y-3 rounded-lg bg-muted/40 p-3 ring-1 ring-border">
                <div className="space-y-2">
                  <Label htmlFor="pickup-qr-paste">Paste QR payload</Label>
                  <Textarea
                    id="pickup-qr-paste"
                    value={pasteValue}
                    onChange={(e) => setPasteValue(e.target.value)}
                    placeholder='{"orderId":"…","code":"123456"}'
                    rows={3}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handlePasteApply}
                    disabled={!pasteValue.trim()}
                  >
                    Apply pasted payload
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-qr-file">Upload QR image or text file</Label>
                  <input
                    ref={fileInputRef}
                    id="pickup-qr-file"
                    type="file"
                    accept="image/*,.json,.txt,text/plain"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose file
                  </Button>
                </div>
                {scanError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {scanError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => onVerify?.(code)}
          >
            {isSubmitting ? 'Verifying…' : 'Confirm pickup'}
          </Button>
        </div>
      </div>
    </div>
  );
}
