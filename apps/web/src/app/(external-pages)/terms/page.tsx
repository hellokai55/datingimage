export default function TermsPage() {
  return (
    <div className="flex flex-col">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
            Legal
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-muted-foreground">
            Last updated: June 2025
          </p>

          <div className="mt-12 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                DatingImage is an AI-powered photo generation service. Users upload selfies,
                select a scene, and receive AI-generated photos. Credits are consumed per generation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">User Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of your original photos. You grant us a limited license
                to process your photos solely for the purpose of generating new photos.
                You may not upload photos of other people without their consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Credits & Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                Credits are virtual currency used to generate photos. Each generation costs
                8 credits. Credits are non-refundable except in cases of generation failure.
                Purchased credits do not expire.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Prohibited Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may not use DatingImage to generate deceptive, fraudulent, or harmful content.
                This includes impersonation, deepfakes of others, or any content that violates
                applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                DatingImage is provided as-is. We do not guarantee specific results from
                AI generation. Our liability is limited to the amount paid for the service
                in the 30 days preceding any claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these terms from time to time. Continued use of the service
                after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Questions about these terms? Contact us at{' '}
                <a href="mailto:hello@datingimage.app" className="text-primary hover:underline">
                  hello@datingimage.app
                </a>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
