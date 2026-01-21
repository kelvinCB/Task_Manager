import { useState } from "react"
import { Check } from "lucide-react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import NumberFlow from "@number-flow/react"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"

export type Plan = {
  id: string
  name: string
  price: {
    monthly: number
    yearly: number
  }
  features: string[]
  recommended?: boolean
}

interface PricingProps {
  plans: Plan[]
  title?: string
  description?: string
  onPlanSelect?: (planId: string, interval: "monthly" | "yearly") => void
}

export function Pricing({
  plans,
  title = "Simple, transparent pricing",
  description = "Choose the plan that's right for you",
  onPlanSelect,
}: PricingProps) {
  const [isYearly, setIsYearly] = useState(false)

  const handleToggle = (checked: boolean) => {
    setIsYearly(checked)
    if (checked) {
      const end = Date.now() + 1000
      const colors = ["#a786ff", "#fd8bbd", "#ffff00", "#ff0099"]

      const frame = () => {
        if (Date.now() > end) return

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        })

        requestAnimationFrame(frame)
      }

      frame()
    }
  }

  return (
    <div className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-8 flex justify-center items-center gap-3">
          <Switch
            id="billing-interval"
            checked={isYearly}
            onCheckedChange={handleToggle}
          />
          <Label
            htmlFor="billing-interval"
            className="text-sm font-semibold leading-6 cursor-pointer text-foreground"
          >
            Annual billing <span className="text-primary font-normal ml-1">(Save 20%)</span>
          </Label>
        </div>

        <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-12 sm:gap-y-0 lg:max-w-7xl lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan, planIdx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: planIdx * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "relative rounded-3xl p-8 ring-1 transition-all duration-300 flex flex-col",
                plan.recommended
                  ? "bg-black text-white dark:bg-black dark:text-white shadow-2xl scale-110 z-10 border-2 border-transparent dark:border-white sm:p-12"
                  : "bg-white text-gray-900 dark:bg-black dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-gray-300 dark:hover:ring-gray-700 sm:p-10"
              )}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-black text-white dark:bg-white dark:text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-gray-100 dark:border-gray-900">
                    Popular
                  </span>
                </div>
              )}
              
              <h3 className={cn("text-sm font-bold uppercase tracking-widest", plan.recommended ? "text-gray-400 dark:text-gray-500" : "text-muted-foreground")}>{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-x-2">
                <span className="text-5xl font-bold tracking-tight">
                  <NumberFlow
                    value={isYearly ? plan.price.yearly : plan.price.monthly}
                    format={{ style: "currency", currency: "USD" }}
                  />
                </span>
                <span className={cn("text-sm font-semibold leading-6", plan.recommended ? "text-gray-400 dark:text-gray-500" : "text-muted-foreground")}>
                  /{isYearly ? "year" : "month"}
                </span>
              </div>
              
              <div className={cn("mt-2 text-xs", plan.recommended ? "text-gray-400 dark:text-gray-500" : "text-muted-foreground")}>
                {isYearly ? "billed yearly" : "billed monthly"}
              </div>

              <ul
                role="list"
                className="mt-8 space-y-3 text-sm leading-6 flex-1"
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3 items-start">
                    <Check className={cn("h-5 w-5 flex-none", plan.recommended ? "text-inherit" : "text-black dark:text-white")} aria-hidden="true" />
                    <span className="opacity-90">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={() => onPlanSelect?.(plan.id, isYearly ? "yearly" : "monthly")}
                className={cn(
                  "mt-8 w-full h-12 rounded-xl text-base font-semibold transition-all duration-300",
                  plan.recommended
                    ? "bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-lg"
                    : "bg-transparent border-2 border-gray-200 dark:border-gray-800 text-black dark:text-white hover:border-black dark:hover:border-white hover:bg-transparent"
                )}
                variant="ghost"
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : (plan.name === 'Starter' ? 'Start Free Trial' : 'Get Started')}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
