export default function HowItWorks() {
  const steps = [
    {
      title: "Submit Invoice",
      description:
        "Freelancers upload verified invoices with a set discount rate for immediate purchase.",
    },
    {
      title: "Fund as LP",
      description:
        "Liquidity Providers purchase invoices at the discounted rate using USDC on Stellar.",
    },
    {
      title: "Protocol Settle",
      description:
        "When the payer settles the invoice, the full amount is distributed to the LP automatically.",
    },
  ];

  return (
    <section className="bg-surface-container-low py-24 px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-headline mb-16 text-center">
          How ILN works
        </h2>
        <div className="grid md:grid-cols-3 gap-12 relative mb-24">
          {steps.map((step, index) => (
            <div key={index} className="relative z-10">
              <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-bold mb-6">
                {index + 1}
              </div>
              <h3 className="text-xl font-headline mb-3">{step.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Flow Diagram */}
        <div className="bg-surface-container-highest p-8 md:p-12 rounded-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-outline-variant/40">
          <div className="text-center">
            <div className="text-xs font-bold mb-2 uppercase text-on-surface-variant">
              Liquidity Provider
            </div>
            <div className="text-2xl font-headline font-medium">$1,000</div>
            <div className="text-xs text-primary mt-1">Capital Out</div>
          </div>
          <div className="flex-1 h-[2px] bg-outline-variant relative flex items-center justify-center w-full">
            <span className="absolute right-0 w-2 h-2 bg-outline-variant rotate-45 border-t border-r -mr-1"></span>
            <div className="bg-primary text-surface-container-lowest text-[10px] px-2 py-1 rounded-full -mt-8 font-bold whitespace-nowrap">
              DISCOUNT: 3%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold mb-2 uppercase text-on-surface-variant">
              Freelancer
            </div>
            <div className="text-2xl font-headline font-medium">$970</div>
            <div className="text-xs text-primary mt-1">Instant Cash</div>
          </div>
          <div className="flex-1 h-[2px] bg-outline-variant relative flex items-center justify-center w-full">
            <span className="absolute right-0 w-2 h-2 bg-outline-variant rotate-45 border-t border-r -mr-1"></span>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold mb-2 uppercase text-on-surface-variant">
              Payer Settles
            </div>
            <div className="text-2xl font-headline font-medium">$1,000</div>
            <div className="text-xs text-primary mt-1">To LP</div>
          </div>
        </div>
      </div>
    </section>
  );
}
