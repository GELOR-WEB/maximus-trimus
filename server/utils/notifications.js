/**
 * OneSignal Push Notification Utility
 * Uses direct REST API calls (no legacy SDK dependency).
 * 
 * Targeting strategies:
 * - Admin notifications: filter by tag role=admin
 * - Client-specific notifications: include_aliases with external_id (MongoDB user _id)
 * - Broadcast notifications: included_segments "Subscribed Users"
 */

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

// Validate env on startup
if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn(
        '⚠️  OneSignal environment variables missing!',
        'ONESIGNAL_APP_ID:', !!ONESIGNAL_APP_ID,
        'ONESIGNAL_REST_API_KEY:', !!ONESIGNAL_REST_API_KEY
    );
}

// ─── Core sender ───────────────────────────────────────────────

async function sendNotification(payload) {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
        console.error('OneSignal notification skipped: missing environment variables');
        return null;
    }

    const body = {
        app_id: ONESIGNAL_APP_ID,
        ...payload,
    };

    try {
        const response = await fetch(ONESIGNAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OneSignal API error:', response.status, JSON.stringify(data));
            return null;
        }

        console.log('✅ Notification sent:', data.id, '| Recipients:', data.recipients);
        return data;
    } catch (err) {
        console.error('OneSignal request failed:', err.message || err);
        return null;
    }
}

// ─── Targeting helpers ─────────────────────────────────────────

/**
 * Send notification to admin users (tagged with role=admin in OneSignal)
 */
async function sendToAdmin(heading, message) {
    return sendNotification({
        headings: { en: heading },
        contents: { en: message },
        // Target users who have the "role" tag set to "admin"
        filters: [
            { field: 'tag', key: 'role', relation: '=', value: 'admin' }
        ],
    });
}

/**
 * Send notification to a specific user by their MongoDB _id (external_id in OneSignal)
 */
async function sendToUser(userId, heading, message) {
    if (!userId) {
        console.log('Notification skipped: no userId provided (guest booking)');
        return null;
    }

    return sendNotification({
        headings: { en: heading },
        contents: { en: message },
        include_aliases: { external_id: [String(userId)] },
        target_channel: 'push',
    });
}

/**
 * Send notification to all subscribed users (broadcast)
 */
async function sendToAll(heading, message) {
    return sendNotification({
        headings: { en: heading },
        contents: { en: message },
        included_segments: ['Subscribed Users'],
    });
}

// ─── Scenario-specific functions ───────────────────────────────

/**
 * Scenario 1: New booking created → notify admin
 */
async function notifyNewBooking(bookingDetails) {
    const { customerName, time, service } = bookingDetails;
    return sendToAdmin(
        '📋 New Appointment',
        `New booking from ${customerName} for ${time}${service ? ' (' + service + ')' : ''}!`
    );
}

/**
 * Scenarios 2-4: Booking status changed → notify the specific client
 */
async function notifyBookingUpdate(booking, newStatus, newDate, newTime) {
    const userId = booking.userId;
    const date = newDate || booking.date;
    const time = newTime || booking.time;

    switch (newStatus) {
        case 'Confirmed':
            return sendToUser(
                userId,
                '✅ Booking Confirmed',
                `Your booking for ${date} at ${time} has been confirmed!`
            );
        case 'Cancelled':
            return sendToUser(
                userId,
                '❌ Booking Cancelled',
                `Your booking for ${booking.date} at ${booking.time} has been cancelled.`
            );
        default:
            // Rescheduled (status = Confirmed but date/time changed)
            if (newDate || newTime) {
                return sendToUser(
                    userId,
                    '📅 Booking Rescheduled',
                    `Your booking has been rescheduled to ${date} at ${time}.`
                );
            }
            return null;
    }
}

/**
 * Scenario 5: Greeting message updated → notify all subscribed users
 */
async function notifyGreetingChange(greeting) {
    return sendToAll(
        '💈 Maximus Trimus',
        `New message from the barber: "${greeting}"`
    );
}

/**
 * Scenarios 6-7: Barber status changed → notify all subscribed users
 */
async function notifyBarberStatus(isOnline) {
    if (isOnline) {
        return sendToAll(
            '🟢 The Barber Is In!',
            'Looks like the barber is in! Want to make an appointment?'
        );
    } else {
        return sendToAll(
            '🔴 The Barber Is Out',
            "Looks like the barber is out. We'll let you know when the barber is in!"
        );
    }
}

module.exports = {
    notifyNewBooking,
    notifyBookingUpdate,
    notifyGreetingChange,
    notifyBarberStatus,
};