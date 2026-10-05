import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Syringe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { differenceInWeeks, parseISO } from 'date-fns';

interface VaccineRecommendationProps {
  arrivalDate: string;
}

const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
};

// Vaccine schedule based on chicken age in weeks
const vaccineSchedule = [
  { week: 1, vaccines: ['মারেক্স (হ্যাচারিতে)', 'ND+IB (B1 স্ট্রেইন)'] },
  { week: 2, vaccines: ['IBD (গামবোরো) প্রথম ডোজ'] },
  { week: 3, vaccines: ['IBD (গামবোরো) বুস্টার', 'ND লাসোটা'] },
  { week: 4, vaccines: ['ND লাইভ বুস্টার'] },
  { week: 5, vaccines: ['ফাউল পক্স'] },
  { week: 6, vaccines: ['ND+IB কিল্ড'] },
  { week: 7, vaccines: ['মাইকোপ্লাজমা (MG)'] },
  { week: 8, vaccines: ['এভিয়ান ইনফ্লুয়েঞ্জা (H9N2)'] },
  { week: 10, vaccines: ['সালমোনেলা'] },
  { week: 12, vaccines: ['ND+IB+EDS কিল্ড'] },
  { week: 14, vaccines: ['এভিয়ান ইনফ্লুয়েঞ্জা (H5N1)'] },
  { week: 16, vaccines: ['ND লাইভ বুস্টার'] },
];

export function VaccineRecommendation({ arrivalDate }: VaccineRecommendationProps) {
  if (!arrivalDate) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Syringe className="w-5 h-5 text-primary" />
            ভ্যাকসিন রিকমেন্ডেশন
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>প্রথমে মুরগি আনার তারিখ সেট করুন</p>
            <p className="text-xs mt-1">"মুরগি" ট্যাবে গিয়ে তারিখ দিন</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const today = new Date();
  const arrival = parseISO(arrivalDate);
  const currentWeek = Math.max(0, differenceInWeeks(today, arrival));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Syringe className="w-5 h-5 text-primary" />
          ভ্যাকসিন রিকমেন্ডেশন
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          বর্তমান বয়স: {toBengaliNumber(currentWeek)} সপ্তাহ
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {vaccineSchedule.map((schedule) => {
            const isPast = schedule.week < currentWeek;
            const isCurrent = schedule.week === currentWeek;
            const isUpcoming = schedule.week > currentWeek && schedule.week <= currentWeek + 2;

            return (
              <div
                key={schedule.week}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-primary/10 border-primary'
                    : isUpcoming
                    ? 'bg-warning/10 border-warning/50'
                    : isPast
                    ? 'bg-muted/50 border-transparent opacity-60'
                    : 'bg-secondary border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    ) : isCurrent ? (
                      <AlertCircle className="w-4 h-4 text-primary animate-pulse shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <span className="font-medium">
                      {toBengaliNumber(schedule.week)} সপ্তাহ
                    </span>
                  </div>
                  {isCurrent && (
                    <Badge variant="default" className="shrink-0">
                      এখন
                    </Badge>
                  )}
                  {isUpcoming && (
                    <Badge variant="secondary" className="shrink-0">
                      আসছে
                    </Badge>
                  )}
                </div>
                <div className="mt-2 ml-6 space-y-1">
                  {schedule.vaccines.map((vaccine, idx) => (
                    <div key={idx} className="text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {vaccine}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
