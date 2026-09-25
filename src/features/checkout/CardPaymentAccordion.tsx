import { useState } from "react"
import { CreditCard, Lock, ShieldCheck } from "lucide-react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"

export function CardPaymentAccordion() {
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [zip, setZip] = useState("")

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    return value
      .replace(/^([1-9]\/|[2-9])$/g, "0$1/")
      .replace(/^(0[1-9]|1[0-2])$/g, "$1/")
      .replace(/^([0-1])([3-9])$/g, "0$1/$2")
      .replace(/^(0[1-9]|1[0-2])([0-9]{2})$/g, "$1/$2")
      .replace(/\/\//g, "/")
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value="card-payment"
        className="rounded-2xl border border-border/80 bg-card/60 px-4 backdrop-blur-md overflow-hidden"
      >
        <AccordionTrigger className="hover:no-underline py-3.5">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Pay with Credit / Debit Card</span>
            <span className="text-[10px] text-muted-foreground font-normal ml-1">
              (or use 1-Tap Apple/Google Pay below)
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-4 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Card Number
            </label>
            <div className="relative">
              <Input
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(formatCardNumber(e.target.value))
                }
                className="font-mono text-xs pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                <span className="text-[10px] font-bold">VISA</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Expiry
              </label>
              <Input
                placeholder="MM/YY"
                maxLength={5}
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                className="font-mono text-xs text-center"
              />
            </div>
            <div className="col-span-1">
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                CVC
              </label>
              <Input
                placeholder="123"
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                className="font-mono text-xs text-center"
              />
            </div>
            <div className="col-span-1">
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Zip Code
              </label>
              <Input
                placeholder="90210"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                className="font-mono text-xs text-center"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>256-bit encrypted escrow pipeline. Zero card storage.</span>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
