import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
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
  ExternalLink,
  QrCode,
  Sparkles,
} from "lucide-react"
import { truncateHash } from "@/lib/utils"

export function TrustReceiptModal() {
  const { isReceiptOpen, setIsReceiptOpen } = useAppStore()
  const [copiedHash, setCopiedHash] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const transactionHash =
    "0x7a39d841b8f102ca992bc4e7d01859ae3c42e88126bb01fa816928cb901844b2"

  const handleCopyHash = () => {
    navigator.clipboard.writeText(transactionHash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleDownloadPdf = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)
    }, 1200)
  }

  return (
    <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="text-center sm:text-center pb-2 border-b border-border/50">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <DialogTitle className="text-lg font-bold">
            TrustLink Cryptographic Receipt
          </DialogTitle>
          <DialogDescription className="text-xs">
            Immutable proof of escrow custody & carrier weight audit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          {/* QR Code and Vault ID */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-background/60 border border-border/60">
            {/* SVG QR Code Simulation */}
            <div className="w-20 h-20 bg-white p-1 rounded-xl flex items-center justify-center shadow-inner shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
                {/* Clean QR code pattern SVG */}
                <rect x="10" y="10" width="25" height="25" rx="3" />
                <rect x="15" y="15" width="15" height="15" fill="white" />
                <rect x="18" y="18" width="9" height="9" />

                <rect x="65" y="10" width="25" height="25" rx="3" />
                <rect x="70" y="15" width="15" height="15" fill="white" />
                <rect x="73" y="18" width="9" height="9" />

                <rect x="10" y="65" width="25" height="25" rx="3" />
                <rect x="15" y="70" width="15" height="15" fill="white" />
                <rect x="18" y="73" width="9" height="9" />

                <rect x="42" y="15" width="6" height="10" />
                <rect x="52" y="20" width="6" height="6" />
                <rect x="40" y="42" width="20" height="20" rx="2" />
                <rect x="46" y="48" width="8" height="8" fill="white" />
                <rect x="68" y="45" width="8" height="12" />
                <rect x="70" y="65" width="18" height="8" />
                <rect x="80" y="78" width="8" height="10" />
                <rect x="42" y="70" width="8" height="15" />
              </svg>
            </div>

            <div className="ml-3 flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                Escrow Order ID
              </span>
              <p className="font-mono font-bold text-foreground text-sm">
                TL-ORD-9824-7128
              </p>
              <div className="text-[11px] text-muted-foreground">
                Verified on Base L2 / Sepolia
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <Check className="w-3 h-3" /> State Confirmed
              </div>
            </div>
          </div>

          {/* Ledger Details Table */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-muted/20 border border-border/50">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seller:</span>
              <span className="font-medium text-foreground">@urban_ceramics</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Buyer:</span>
              <span className="font-medium text-foreground">Jane Doe</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item:</span>
              <span className="font-medium text-foreground">
                Ceramic Vase (Handmade 1 of 1)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Declared vs Actual:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                1.20 kg / 1.21 kg (PASS)
              </span>
            </div>
            <div className="pt-2 border-t border-border/50 flex justify-between font-bold text-sm">
              <span className="text-foreground">Escrow Amount:</span>
              <span className="font-mono text-emerald-400">$132.00 USD</span>
            </div>
          </div>

          {/* SHA-256 Ledger Hash */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground block">
              Cryptographic Proof Hash (SHA-256)
            </span>
            <div className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-border/60 font-mono text-[11px]">
              <span className="truncate mr-2 text-foreground">
                {truncateHash(transactionHash, 14, 12)}
              </span>
              <button
                onClick={handleCopyHash}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
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

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-card border border-border text-xs font-semibold hover:bg-muted text-foreground transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {downloading
                  ? "Generating..."
                  : downloaded
                  ? "Saved PDF!"
                  : "Download PDF"}
              </span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://trustlink.dev/receipt/TL-ORD-9824-7128"
                )
                alert("Receipt verification link copied to clipboard!")
              }}
              className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Receipt</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
