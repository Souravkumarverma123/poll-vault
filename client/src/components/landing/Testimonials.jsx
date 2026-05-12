import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "PollVault completely changed how we run our all-hands meetings. Real-time feedback has never been easier.",
    author: "Sarah Jenkins",
    role: "VP Engineering",
    avatar: "SJ"
  },
  {
    quote: "The ability to instantly publish results to our audience is a game changer for our live streams.",
    author: "Marcus Chen",
    role: "Content Creator",
    avatar: "MC"
  },
  {
    quote: "Finally, a polling tool that respects privacy but still provides deep analytics. Highly recommended.",
    author: "Dr. Elena Rodriguez",
    role: "University Professor",
    avatar: "ER"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-muted/10 border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold sm:text-4xl">Loved by teams worldwide</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div key={i} className="relative rounded-2xl bg-background p-8 shadow-sm border border-border/50 hover:shadow-md transition-shadow group">
              <div className="text-4xl text-primary/20 absolute top-4 left-4 font-heading transition-colors group-hover:text-primary/40">"</div>
              <p className="relative z-10 text-muted-foreground mb-6 line-clamp-4 pt-2">
                {t.quote}
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">{t.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
