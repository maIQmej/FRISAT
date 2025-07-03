
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslation } from '@/hooks/useTranslation';

export function HelpContent() {
  const { t } = useTranslation();
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>{t('whatIsSensorSync')}</AccordionTrigger>
        <AccordionContent>
          <div className="w-full overflow-hidden rounded-lg">
            <video
              src="/FRISAT.mp4"
              width="100%"
              controls
              muted
              autoPlay
              loop
              className="aspect-video"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="mt-4">{t('whatIsSensorSyncDesc')}</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>{t('quickStartGuide')}</AccordionTrigger>
        <AccordionContent>
          <ol className="list-decimal space-y-2 pl-5">
            <li dangerouslySetInnerHTML={{ __html: t('quickStartGuideConfig') }} />
            <li dangerouslySetInnerHTML={{ __html: t('quickStartGuideAcq') }} />
            <li dangerouslySetInnerHTML={{ __html: t('quickStartGuidePost') }} />
            <li dangerouslySetInnerHTML={{ __html: t('quickStartGuideExport') }} />
          </ol>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>{t('faq')}</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div>
            <h4 className="font-semibold">{t('faqFormat')}</h4>
            <p className="text-muted-foreground">{t('faqFormatDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('faqSamples')}</h4>
            <p className="text-muted-foreground">{t('faqSamplesDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('faqStop')}</h4>
            <p className="text-muted-foreground">{t('faqStopDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('faqAIPrediction')}</h4>
            <p className="text-muted-foreground">{t('faqAIPredictionDesc')}</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
