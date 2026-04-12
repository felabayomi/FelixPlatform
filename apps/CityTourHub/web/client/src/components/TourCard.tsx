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
    <Card className="overflow-hidden hover-elevate group" data-testid={`card-tour-${id}`}>
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={imageUrl} 
          alt={`${city}, ${state}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-border">
            <Calendar className="w-3 h-3 mr-1" />
            {startDate}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-2xl font-semibold" data-testid={`text-city-${id}`}>
              {city}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span>{state}</span>
            </div>
          </div>
          {isAlmostFull && (
            <Badge variant="secondary" className="text-xs">
              {spotsLeft} spots left
            </Badge>
          )}
        </div>
        
        <p className="text-muted-foreground line-clamp-3" data-testid={`text-description-${id}`}>
          {description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{endDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{currentParticipants}/{maxParticipants}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full" data-testid={`button-signup-${id}`}>
          <Link href={`/tour/${id}`}>Sign Up for Tour</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
