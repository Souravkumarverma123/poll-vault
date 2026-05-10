import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do my respondents need an account to vote?",
    answer: "No. You can create public polls that anyone with the link can answer anonymously. You also have the option to restrict polls to logged-in users only."
  },
  {
    question: "Is there a limit to how many people can vote at once?",
    answer: "PollVault is built on WebSockets and designed to handle thousands of concurrent connections. Your live analytics will update instantly regardless of volume."
  },
  {
    question: "Can I export the poll results?",
    answer: "Yes, admins can export full analytics and response data for any poll directly from the dashboard."
  },
  {
    question: "How do you prevent spam voting?",
    answer: "We use a combination of IP tracking, browser fingerprinting, and session cookies to ensure each person only votes once on anonymous polls."
  }
];

export function FAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold sm:text-4xl">Common questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
              <AccordionTrigger className="text-left text-lg py-4 font-medium hover:text-primary transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
