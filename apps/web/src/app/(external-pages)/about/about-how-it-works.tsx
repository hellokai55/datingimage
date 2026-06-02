const STEPS = [
  {
    num: '01',
    title: 'Upload',
    desc: 'Share 5–10 selfies. Different angles, different lighting. The more variety, the more convincing the results.',
  },
  {
    num: '02',
    title: 'Train',
    desc: 'Our AI learns your unique facial features, expressions, and skin tone. This takes about 60 seconds.',
  },
  {
    num: '03',
    title: 'Generate',
    desc: 'Pick a scene — beach, café, city street — and get 8 professional photos in under 5 minutes.',
  },
  {
    num: '04',
    title: 'Download',
    desc: 'Choose your favorites, download in high resolution, and upload to Tinder, Bumble, or Hinge.',
  },
];

export function AboutHowItWorks() {
  return (
    <div>
      <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
        The Process
      </p>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-10">
        How it actually works
      </h2>

      <div className="space-y-8">
        {STEPS.map((step) => (
          <div key={step.num} className="flex gap-6">
            <span className="text-4xl font-bold text-muted-foreground/30 w-12 shrink-0 select-none">
              {step.num}
            </span>
            <div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
