import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Appointments from "@/pages/Appointments";
import Reschedule from "@/pages/Reschedule";
import NotFound from "@/pages/not-found";
import { ProtectedAdmin } from "@/components/ProtectedAdmin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/reschedule/:token" component={Reschedule} />
      <Route path="/felabayomi/appointments">
        <ProtectedAdmin>
          <Appointments />
        </ProtectedAdmin>
      </Route>
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
