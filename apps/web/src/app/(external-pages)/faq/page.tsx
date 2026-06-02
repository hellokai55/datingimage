import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How does DatingImage work?',
    answer:
      'Upload 5–10 selfies of yourself. Choose one of our 8 curated scenes. Our AI generates 8 professional-quality dating photos that look like you — same face, different setting. The whole process takes about 5 minutes.',
  },
  {
    question: 'Will the photos actually look like me?',
    answer:
      'Yes. We use your uploaded selfies to train a personalized AI model for your face. The generated photos maintain your facial features, skin tone, and expressions. They look like professional photos of you, not a generic filter.',
  },
  {
    question: 'What happens to my original photos?',
    answer:
      'Your original selfies are automatically deleted after 24 hours. We only keep the generated photos you choose to save. We never use your photos to train our AI models or share them with third parties.',
  },
  {
    question: 'How many photos do I get?',
    answer:
      'Each generation produces 8 unique photos. You can regenerate individual photos you do not like for 1 credit each. You can also create multiple projects with different scenes.',
  },
  {
    question: 'What scenes are available?',
    answer:
      'We offer 8 curated scenes: Beach & Waterfront, Coffee Shop, Professional Office, Urban Street, Outdoor Adventure, Art Gallery, Wine Bar, and Gym & Fitness. We add new scenes regularly based on user feedback.',
  },
  {
    question: 'Can I use these photos on dating apps?',
    answer:
      'Absolutely. The photos are yours to use anywhere — Tinder, Bumble, Hinge, LinkedIn, or any other platform. They are high-resolution and ready to upload.',
  },
  {
    question: 'What if I run out of credits?',
    answer:
      'You can buy more credits at any time. Each credit pack gives you 20 credits for $4.99. Credits never expire. You get 15 free credits when you sign up.',
  },
  {
    question: 'What is your refund policy?',
    answer:
      'If a generation fails for any reason, your credits are automatically refunded. For purchased credits, contact us within 7 days if you are unsatisfied and we will work with you to make it right.',
  },
];

export default function FAQPage() {
  return (
    <div className="flex flex-col">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
            FAQ
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Questions? Answered.
          </h1>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
