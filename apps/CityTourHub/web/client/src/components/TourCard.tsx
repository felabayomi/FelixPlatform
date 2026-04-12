import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { Link } from "wouter";

interface TourCardProps {
  id: string;
  city: string;
  state: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  maxParticipants: number;
  currentParticipants: number;
}

export default function TourCard({
  id,
  city,
  state,
  description,
  startDate,
  endDate,
  imageUrl,
  maxParticipants,
  currentParticipants,
}: TourCardProps) {
  const spotsLeft = maxParticipants - currentParticipants;
  const isAlmostFull = spotsLeft <= 5;

  return (
    <Card
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      data-testid={`card-tour-${id}`}
    >
      <div className="relative aspect-[1.72/1] overflow-hidden bg-slate-100">
        <img 
          src={imageUrl} 
          alt={`${city}, ${state}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <Badge className="rounded-md border border-slate-200 bg-white/95 px-3 py-1.5 text-[0.95rem] font-medium text-slate-700 shadow-sm backdrop-blur-sm">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            {startDate}
          </Badge>
        </div>
      </div>
      
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3
              className="line-clamp-2 text-[1.05rem] font-semibold leading-[1.3] text-slate-900 sm:text-[1.1rem]"
              data-testid={`text-city-${id}`}
            >
              {city}
            </h3>
            {isAlmostFull && (
              <Badge variant="secondary" className="shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold">
                {spotsLeft} spots left
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[0.95rem] text-slate-500">
            <MapPin className="h-4 w-4" />
            <span>{state}</span>
          </div>
        </div>

        <p
          className="line-clamp-3 text-[0.98rem] leading-8 text-slate-600"
          data-testid={`text-description-${id}`}
        >
          {description}
        </p>

        <div className="mt-auto flex items-center gap-5 border-t border-slate-100 pt-4 text-[0.95rem] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{endDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{currentParticipants}/{maxParticipants}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button
          asChild
          className="min-h-11 w-full rounded-md border-0 bg-[#0f5db8] text-[1rem] font-semibold text-white shadow-none transition-colors hover:bg-[#0b4f9f]"
          data-testid={`button-signup-${id}`}
        >
          <Link href={`/tour/${id}`}>Sign Up for Tour</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
