import { useLocation } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CHALLENGE_CARDS, DISCUSSION_PROMPTS } from "@/lib/domain/content";
import { useAppStore } from "@/lib/store";

function routeKey(pathname: string): string {
  if (pathname.startsWith("/case/") && pathname.endsWith("/trace")) return "/trace";
  if (pathname.startsWith("/case/") && pathname.endsWith("/record")) return "/record";
  if (pathname.startsWith("/case/")) return "/case";
  return pathname;
}

export function DiscussionSheet() {
  const { open, setOpen } = useAppStore(useShallow((s) => ({ open: s.discussionMode, setOpen: s.setDiscussionMode })));
  const { pathname } = useLocation();
  const key = routeKey(pathname);
  const relevant = DISCUSSION_PROMPTS.filter((p) => p.routes.includes(key));
  const others = DISCUSSION_PROMPTS.filter((p) => !p.routes.includes(key));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Discussion mode</SheetTitle>
          <SheetDescription>
            Questions to put to the room after the demonstration, and challenge cards with a defensible answer. Nothing here is labelled by job title.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          <section aria-labelledby="prompts-here">
            <h3 id="prompts-here" className="mb-2 text-sm font-semibold text-teal-800 dark:text-teal-300">Ask on this screen</h3>
            {relevant.length === 0 ? (
              <p className="text-sm text-muted-foreground">No prompt is tied to this screen; use the list below.</p>
            ) : (
              <ul className="space-y-2">
                {relevant.map((p) => (
                  <li key={p.text} className="rounded-md border-l-4 border-teal-600 bg-muted/40 p-3 text-sm">{p.text}</li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="prompts-other">
            <h3 id="prompts-other" className="mb-2 text-sm font-semibold">Other questions for the first fifteen minutes</h3>
            <ul className="space-y-1.5">
              {others.map((p) => (
                <li key={p.text} className="rounded-md border p-2.5 text-sm">{p.text}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="cards">
            <h3 id="cards" className="mb-2 text-sm font-semibold">Challenge cards</h3>
            <Accordion type="single" collapsible className="w-full">
              {CHALLENGE_CARDS.map((card, i) => (
                <AccordionItem key={card.q} value={`card-${i}`}>
                  <AccordionTrigger className="text-left text-sm">{card.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{card.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
