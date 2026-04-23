export default function OpenSource() {
  const cards = [
    {
      icon: "bug_report",
      title: "Fix a Security Bug",
      description:
        "Help us harden the protocol.",
    },
    {
      icon: "add_box",
      title: "Build a New Feature",
      description:
        "Contribute to our core Soroban contracts or the frontend dashboard ecosystem.",
    },
    {
      icon: "edit_note",
      title: "Write Documentation",
      description:
        "Help others build on ILN by improving our guides and technical API references.",
    },
  ];

  return (
    <section className="bg-surface-container-low text-on-surface py-24 px-8 overflow-hidden relative">
      {/* Abstract background detail */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
        <span className="material-symbols-outlined text-[400px] absolute -top-20 -right-20">
          code
        </span>
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h2 className="text-4xl font-headline mb-4">Built in the open.</h2>
            <p className="text-on-surface/60 max-w-xl">
              ILN is a public utility. We believe financial infrastructure
              should be transparent, verifiable, and community-driven.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="bg-primary text-surface-container-lowest px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors">
              Explore GitHub
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="p-8 bg-surface-container-lowest/5 rounded-xl border border-on-surface/10 group hover:border-primary-container transition-colors"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="material-symbols-outlined text-primary-container">
                  {card.icon}
                </span>
              </div>
              <h4 className="font-bold mb-3 group-hover:text-primary-container transition-colors">
                {card.title}
              </h4>
              <p className="text-on-surface/60 text-sm leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
