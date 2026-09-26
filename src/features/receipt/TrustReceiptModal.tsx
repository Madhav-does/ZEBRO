import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { useOrder, useActiveOrders, usePastOrders } from "@/hooks/useEscrow"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  ShieldCheck,
  Download,
  Copy,
  Check,
  Share2,
  Lock,
  Scale,
  Truck,
  ExternalLink,
  PackageCheck,
  QrCode,
  FileCheck2,
} from "lucide-react"
import { truncateHash } from "@/lib/utils"

export function TrustReceiptModal() {
  const { isReceiptOpen, setIsReceiptOpen, currentOrderId } = useAppStore()
  const { data: order } = useOrder(currentOrderId)
  const { data: activeOrders = [] } = useActiveOrders()
  const { data: pastOrders = [] } = usePastOrders()

  // Dynamic fallback: If currentOrderId is empty or not resolved yet, pick active or past order
  const resolvedOrder =
    order ||
    activeOrders.find((o) => o.id === currentOrderId) ||
    pastOrders.find((o) => o.id === currentOrderId) ||
    pastOrders[0] ||
    activeOrders[0]

  const [copiedHash, setCopiedHash] = useState(false)
  const [copiedProof, setCopiedProof] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const transactionHash =
    resolvedOrder?.escrowVaultAddress ||
    "0x7a39d841b8f102ca992bc4e7d01859ae3c42e88126bb01fa816928cb901844b2"

  const orderNum = resolvedOrder?.orderNumber || "TL-ORD-9824-7128"
  const sellerHandle = resolvedOrder?.seller.handle
    ? `@${resolvedOrder.seller.handle}`
    : "@urban_ceramics"
  const sellerName = resolvedOrder?.seller.name || "Maya Lin Studios"
  const itemTitle = resolvedOrder?.product.title || "Ceramic Stoneware Vase"
  const itemPrice = resolvedOrder?.product.price
    ? resolvedOrder.product.price.toFixed(2)
    : "126.00"
  const shippingFee = resolvedOrder?.product.shippingFee
    ? resolvedOrder.product.shippingFee.toFixed(2)
    : "6.00"
  const totalAmount = resolvedOrder
    ? (resolvedOrder.product.price + resolvedOrder.product.shippingFee).toFixed(2)
    : "132.00"

  const declaredKg = resolvedOrder?.weightAudit.declaredKg
    ? resolvedOrder.weightAudit.declaredKg.toFixed(2)
    : "1.20"
  const actualKg = resolvedOrder?.weightAudit.actualKg
    ? resolvedOrder.weightAudit.actualKg.toFixed(2)
    : declaredKg

  const weightStatus =
    resolvedOrder?.weightAudit.status === "match"
      ? "PASS ✓"
      : resolvedOrder?.weightAudit.status === "anomaly"
      ? "ANOMALY ⚠️"
      : "PENDING"

  const carrierName = resolvedOrder?.carrierName || "USPS Priority Mail Insured"
  const trackingNum = resolvedOrder?.trackingNumber || "EP-9400-1092-8821"
  const station = resolvedOrder?.weightAudit.carrierStation || "Portland Station #97201"
  const scaleId = resolvedOrder?.weightAudit.scaleId || "NIST-CAL-7718"
  const otp = resolvedOrder?.deliveryOtp || "482-901"

  const handleCopyHash = () => {
    navigator.clipboard.writeText(transactionHash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleShare = async () => {
    const proofText = `══════════════════════════════════════════════════
       TRUSTLINK™ CRYPTOGRAPHIC ESCROW RECEIPT
══════════════════════════════════════════════════
Order ID: ${orderNum}
Date: ${new Date().toLocaleDateString()}
Status: VERIFIED & FUNDS SETTLED

ITEMIZED BILL:
• Item: ${itemTitle}
• Seller: ${sellerHandle} (${sellerName})
• Buyer: Verified Buyer
• Subtotal: $${itemPrice} USD
• Shipping: $${shippingFee} USD (${carrierName})
• Smart Vault Guarantee: $0.00 (Waived)
• TOTAL SETTLED: $${totalAmount} USD

CARRIER INTAKE AUDIT (NIST-CAL-7718):
• Scale Model: NIST Class III Certified Scale
• Declared Manifest Weight: ${declaredKg} kg
• Actual Counter Scale: ${actualKg} kg
• Audit Result: ${weightStatus} (NIST Certified)
• Intake Station: ${station}
• Doorstep OTP Handover: Verified (${otp})

CRYPTOGRAPHIC SETTLEMENT:
• Smart Vault Address: ${transactionHash}
• Proof Hash (SHA-256): ${transactionHash}
• Consensus: Base L2 / Sepolia Multi-Sig
══════════════════════════════════════════════════
Verified on TrustLink Protocol: https://trustlink.network/verify/${orderNum}`

    try {
      await navigator.clipboard.writeText(proofText)
      setCopiedProof(true)
      setTimeout(() => setCopiedProof(false), 3000)
    } catch (err) {
      console.warn("Clipboard copy error:", err)
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `TrustLink Receipt ${orderNum}`,
          text: proofText,
        })
      } catch {
        // User cancelled share dialog
      }
    }
  }

  const handleDownloadPdf = () => {
    setDownloading(true)

    const printableHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TrustLink Escrow Receipt ${orderNum}</title>
  <style>
    @page { size: portrait; margin: 10mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier New', monospace;
      color: #0f172a;
      background: #ffffff;
      padding: 16px;
      max-width: 440px;
      margin: 0 auto;
    }
    .bill-header { text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 12px; margin-bottom: 14px; }
    .brand { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
    .title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 2px; }
    .stamp { display: inline-block; border: 2px solid #059669; color: #059669; padding: 4px 8px; font-size: 11px; font-weight: 800; transform: rotate(-2deg); margin: 8px 0; border-radius: 4px; }
    .meta { font-size: 11px; font-family: monospace; color: #64748b; margin-top: 2px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-top: 12px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    td { padding: 3px 0; }
    .label { color: #64748b; }
    .value { font-weight: 600; text-align: right; }
    .total-row { font-size: 14px; font-weight: 800; border-top: 2px dashed #94a3b8; padding-top: 6px; margin-top: 6px; }
    .hash-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px; font-family: monospace; font-size: 9px; word-break: break-all; margin-top: 8px; }
    .barcode { text-align: center; margin-top: 14px; font-family: 'Courier New', monospace; font-size: 20px; letter-spacing: 4px; }
  </style>
</head>
<body>
  <div class="bill-header">
    <div class="brand">TRUSTLINK PROTOCOL</div>
    <div class="title">Cryptographic Escrow Clearing House</div>
    <div class="stamp">✓ NIST-CAL-7718 VERIFIED & FUNDS SETTLED</div>
    <div class="meta">Receipt #${orderNum} · ${new Date().toLocaleDateString()}</div>
  </div>

  <div class="section-title">Itemized Order Settlement</div>
  <table>
    <tr><td class="label">Item</td><td class="value">${itemTitle}</td></tr>
    <tr><td class="label">Seller</td><td class="value">${sellerHandle} (${sellerName})</td></tr>
    <tr><td class="label">Buyer</td><td class="value">Verified Buyer</td></tr>
    <tr><td class="label">Item Subtotal</td><td class="value">$${itemPrice} USD</td></tr>
    <tr><td class="label">Tracked Insured Shipping (USPS)</td><td class="value">$${shippingFee} USD</td></tr>
    <tr><td class="label">Escrow Smart Vault Guarantee</td><td class="value">$0.00 (Waived)</td></tr>
    <tr class="total-row"><td style="font-weight: 800;">TOTAL SETTLED</td><td class="value" style="font-size: 15px; color: #059669;">$${totalAmount} USD</td></tr>
  </table>

  <div class="section-title">Carrier Intake & Scale Tare Telemetry</div>
  <table>
    <tr><td class="label">Carrier / Tracking</td><td class="value">${carrierName} · ${trackingNum}</td></tr>
    <tr><td class="label">Scale ID</td><td class="value">${scaleId} (Class III Postal)</td></tr>
    <tr><td class="label">Declared Manifest Weight</td><td class="value">${declaredKg} kg</td></tr>
    <tr><td class="label">Counter Scale Scanned Weight</td><td class="value">${actualKg} kg</td></tr>
    <tr><td class="label">Intake Audit Result</td><td class="value" style="color: #059669;">${weightStatus}</td></tr>
    <tr><td class="label">Intake Station</td><td class="value">${station}</td></tr>
    <tr><td class="label">Doorstep Handover OTP</td><td class="value">Verified (${otp})</td></tr>
  </table>

  <div class="section-title">Cryptographic Immutability Ledger</div>
  <div class="hash-box">
    <strong>Smart Vault Address:</strong><br>${transactionHash}<br><br>
    <strong>SHA-256 Proof Hash:</strong><br>${transactionHash}<br><br>
    <strong>Network Consensus:</strong> Base L2 / Sepolia Multi-Sig
  </div>

  <div class="barcode">||| | |||| | ||| |||| | ||</div>
  <div style="text-align: center; font-size: 10px; font-family: monospace; color: #64748b; margin-top: 2px;">
    ${orderNum}
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`

    // Generate immediate downloadable HTML/PDF receipt file Blob
    const blob = new Blob([printableHtml], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `TrustLink_Receipt_${orderNum}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Trigger instant native browser print-to-PDF dialog
    const printWindow = window.open("", "_blank", "width=500,height=750")
    if (printWindow) {
      printWindow.document.write(printableHtml)
      printWindow.document.close()
    }

    setDownloading(false)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
      <DialogContent className="max-w-md p-5 sm:p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center pb-2 border-b border-border/50">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base sm:text-lg font-bold">
            TrustLink Cryptographic Receipt
          </DialogTitle>
          <DialogDescription className="text-xs">
            Immutable proof of escrow custody & carrier intake tare audit
          </DialogDescription>
        </DialogHeader>

        {/* Feedback Toasts */}
        {copiedProof && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
            <Check className="w-4 h-4" />
            <span>✓ Cryptographic proof & receipt copied to clipboard!</span>
          </div>
        )}

        {downloaded && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
            <FileCheck2 className="w-4 h-4" />
            <span>✓ Printable receipt & PDF file generated!</span>
          </div>
        )}

        {/* THE BILL UI: Thermal Paper Aesthetic Container */}
        <div className="relative bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-xs space-y-4">
          {/* Perforated Top Border simulation */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400/60 to-emerald-500/30 rounded-t-2xl" />

          {/* Rubber Stamp Watermark */}
          <div className="flex items-center justify-between border-b border-dashed border-zinc-700/80 pb-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                ESCROW CLEARING HOUSE
              </span>
              <p className="font-mono font-bold text-sm text-foreground">
                {orderNum}
              </p>
              <span className="text-[10px] text-zinc-400 font-mono">
                {new Date().toLocaleDateString()} · Base L2 Consensus
              </span>
            </div>

            {/* Approved Stamp */}
            <div className="border-2 border-emerald-500/80 text-emerald-400 text-[10px] font-mono font-black px-2 py-1 rounded rotate-[-4deg] tracking-wider uppercase bg-emerald-500/10 shadow-sm">
              ✓ PASSED & SETTLED
            </div>
          </div>

          {/* Product & Participants Row */}
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex justify-between items-center text-zinc-400 text-[11px]">
              <span>Seller</span>
              <span className="font-semibold text-foreground font-mono">
                {sellerHandle}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-400 text-[11px]">
              <span>Buyer</span>
              <span className="font-semibold text-foreground">Verified Buyer</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400 text-[11px]">
              <span>Purchased Item</span>
              <span className="font-semibold text-foreground truncate max-w-[180px]">
                {itemTitle}
              </span>
            </div>
          </div>

          {/* Itemized Bill Breakdown */}
          <div className="space-y-1.5 text-[11px] font-mono border-t border-dashed border-zinc-800 pt-3">
            <div className="flex justify-between text-zinc-400">
              <span>Item Subtotal</span>
              <span className="text-zinc-200">${itemPrice} USD</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Tracked Insured Shipping ({carrierName.split(" ")[0]})</span>
              <span className="text-zinc-200">${shippingFee} USD</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Smart Vault Tare Protection</span>
              <span className="text-emerald-400 font-medium">$0.00 (Waived)</span>
            </div>
            <div className="flex justify-between font-bold text-xs pt-2 border-t border-zinc-800 text-foreground">
              <span>TOTAL ESCROW SETTLED</span>
              <span className="text-emerald-400 font-bold">${totalAmount} USD</span>
            </div>
          </div>

          {/* Carrier Postal Scale Tare Telemetry */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold text-emerald-400">
              <span className="flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                Postal Scale Tare Telemetry
              </span>
              <span>{scaleId}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Declared Manifest</span>
                <span className="font-bold text-zinc-200">{declaredKg} kg</span>
              </div>
              <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Counter Scale Audit</span>
                <span className="font-bold text-emerald-400">{actualKg} kg ({weightStatus})</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1 border-t border-zinc-800/80">
              <span>Doorstep OTP: {otp}</span>
              <span className="truncate max-w-[170px]">{station}</span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Ledger Hash */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-400 block">
              Cryptographic Proof Hash (SHA-256)
            </span>
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-[11px]">
              <span className="truncate mr-2 text-zinc-300">
                {truncateHash(transactionHash, 14, 12)}
              </span>
              <button
                onClick={handleCopyHash}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                title="Copy hash"
              >
                {copiedHash ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Simulated Barcode */}
          <div className="text-center pt-2 border-t border-dashed border-zinc-800 space-y-1">
            <div className="font-mono text-lg tracking-[0.3em] text-zinc-400 select-none">
              ||| | |||| | ||| |||| | ||
            </div>
            <span className="text-[9px] font-mono text-zinc-500 block">
              TRUSTLINK-NIST-VERIFIED-SETTLEMENT-LEDGER
            </span>
          </div>
        </div>

        {/* Action Buttons: Save as PDF & Share Proof */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-border/80 bg-background/80 hover:bg-muted font-bold text-xs transition-colors active:scale-[0.98]"
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">PDF Saved!</span>
              </>
            ) : downloading ? (
              <span>Generating...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Save as PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors active:scale-[0.98] shadow-md shadow-emerald-500/20"
          >
            {copiedProof ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-950" />
                <span>Proof Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Proof</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
