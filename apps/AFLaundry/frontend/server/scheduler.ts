import cron from 'node-cron';
import { storage } from './storage';
import { 
  sendDropoffReminder, 
  sendPickupReminder, 
  sendSameDayReminder,
  sendThankYouEmail 
} from './reminder-emails';

// Helper function to parse date and time into Date object
function parseDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr} ${timeStr}`);
}

// Helper function to check if we should send a reminder
function shouldSendReminder(
  appointmentDateTime: Date,
  hoursBeforeStart: number,
  hoursBeforeEnd: number
): boolean {
  const now = new Date();
  const timeUntilAppointment = appointmentDateTime.getTime() - now.getTime();
  const hoursUntilAppointment = timeUntilAppointment / (1000 * 60 * 60);
  
  return hoursUntilAppointment >= hoursBeforeEnd && hoursUntilAppointment < hoursBeforeStart;
}

async function checkAndSendReminders() {
  try {
    console.log('[Scheduler] Checking for reminder emails to send...');
    const appointments = await storage.getAllAppointments();
    
    for (const appointment of appointments) {
      // Skip cancelled appointments
      if (appointment.status === 'cancelled') continue;
      
      // Only send reminders if we have customer email
      if (!appointment.customerEmail) continue;

      // Ensure we have a reschedule token
      if (!appointment.rescheduleToken) {
        await storage.generateRescheduleToken(appointment.id);
        const updatedAppointment = await storage.getAppointment(appointment.id);
        if (!updatedAppointment) continue;
        appointment.rescheduleToken = updatedAppointment.rescheduleToken;
      }

      const dropoffDateTime = parseDateTime(appointment.dropoffDate, appointment.dropoffTime);
      const remindersSent = appointment.remindersSent || [];

      // 1. Drop-off reminder (24 hours before)
      if (!remindersSent.includes('dropoff_24h') && 
          shouldSendReminder(dropoffDateTime, 25, 23)) {
        console.log(`[Scheduler] Sending 24h drop-off reminder for ${appointment.id}`);
        await sendDropoffReminder(appointment, appointment.rescheduleToken!);
        await storage.addReminderSent(appointment.id, 'dropoff_24h');
      }

      // 2. Same-day drop-off reminder (3 hours before)
      if (!remindersSent.includes('dropoff_3h') && 
          shouldSendReminder(dropoffDateTime, 3.5, 2.5)) {
        console.log(`[Scheduler] Sending 3h drop-off reminder for ${appointment.id}`);
        await sendSameDayReminder(appointment, 'dropoff', appointment.rescheduleToken!);
        await storage.addReminderSent(appointment.id, 'dropoff_3h');
      }

      // 3. Same-day drop-off reminder (2 hours before)
      if (!remindersSent.includes('dropoff_2h') && 
          shouldSendReminder(dropoffDateTime, 2.5, 1.5)) {
        console.log(`[Scheduler] Sending 2h drop-off reminder for ${appointment.id}`);
        await sendSameDayReminder(appointment, 'dropoff', appointment.rescheduleToken!);
        await storage.addReminderSent(appointment.id, 'dropoff_2h');
      }

      // Only send pickup reminders if pickup is scheduled
      if (appointment.pickupDate && appointment.pickupTime) {
        const pickupDateTime = parseDateTime(appointment.pickupDate, appointment.pickupTime);

        // 4. Pickup reminder (24 hours before)
        if (!remindersSent.includes('pickup_24h') && 
            shouldSendReminder(pickupDateTime, 25, 23)) {
          console.log(`[Scheduler] Sending 24h pickup reminder for ${appointment.id}`);
          await sendPickupReminder(appointment, appointment.rescheduleToken!);
          await storage.addReminderSent(appointment.id, 'pickup_24h');
        }

        // 5. Same-day pickup reminder (3 hours before)
        if (!remindersSent.includes('pickup_3h') && 
            shouldSendReminder(pickupDateTime, 3.5, 2.5)) {
          console.log(`[Scheduler] Sending 3h pickup reminder for ${appointment.id}`);
          await sendSameDayReminder(appointment, 'pickup', appointment.rescheduleToken!);
          await storage.addReminderSent(appointment.id, 'pickup_3h');
        }

        // 6. Same-day pickup reminder (2 hours before)
        if (!remindersSent.includes('pickup_2h') && 
            shouldSendReminder(pickupDateTime, 2.5, 1.5)) {
          console.log(`[Scheduler] Sending 2h pickup reminder for ${appointment.id}`);
          await sendSameDayReminder(appointment, 'pickup', appointment.rescheduleToken!);
          await storage.addReminderSent(appointment.id, 'pickup_2h');
        }

        // 7. Thank you email (after pickup has passed and status is completed)
        const now = new Date();
        const pickupPassed = now > pickupDateTime;
        if (appointment.status === 'completed' && 
            pickupPassed && 
            !remindersSent.includes('thank_you')) {
          console.log(`[Scheduler] Sending thank you email for ${appointment.id}`);
          await sendThankYouEmail(appointment);
          await storage.addReminderSent(appointment.id, 'thank_you');
        }
      }
    }
    
    console.log('[Scheduler] Reminder check complete');
  } catch (error) {
    console.error('[Scheduler] Error checking reminders:', error);
  }
}

export function startScheduler() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', () => {
    console.log('[Scheduler] Running hourly reminder check...');
    checkAndSendReminders();
  });

  // Also run once immediately on startup (for testing and catching missed reminders)
  console.log('[Scheduler] Starting scheduler and running initial check...');
  checkAndSendReminders();
}
