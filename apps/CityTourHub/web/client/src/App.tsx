import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Tours from "@/pages/Tours";
import Destinations from "@/pages/Destinations";
import LocalPicks from "@/pages/LocalPicks";
import Contact from "@/pages/Contact";
import TourDetail from "@/pages/TourDetail";
import Confirmation from "@/pages/Confirmation";
import FAQ from "@/pages/FAQ";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import UserSignup from "@/pages/UserSignup";
import AdminTours from "@/pages/AdminTours";
import AdminTourEdit from "@/pages/AdminTourEdit";
import AdminTourNew from "@/pages/AdminTourNew";
import Appointment from "@/pages/Appointment";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tours" component={Tours} />
      <Route path="/destinations" component={Destinations} />
      <Route path="/local-picks" component={LocalPicks} />
      <Route path="/contact" component={Contact} />
      <Route path="/tour/:id" component={TourDetail} />
      <Route path="/confirmation" component={Confirmation} />
      <Route path="/faq" component={FAQ} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/signup" component={UserSignup} />
      <Route path="/admin/tours" component={AdminTours} />
      <Route path="/admin/tours/new" component={AdminTourNew} />
      <Route path="/admin/tours/:id/edit" component={AdminTourEdit} />
      <Route path="/appointment" component={Appointment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
