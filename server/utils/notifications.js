const OneSignal = require('onesignal-node');

// Validate environment variables
if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
    console.warn(
        '⚠️  OneSignal environment variables missing! ' +
        'ONESIGNAL_APP_ID:', !!process.env.ONESIGNAL_APP_ID,
        'ONESIGNAL_REST_API_KEY:', !!process.env.ONESIGNAL_REST_API_KEY
    );
}

// Initialize the client
const client = new OneSignal.Client(
    process.env.ONESIGNAL_APP_ID,
    process.env.ONESIGNAL_REST_API_KEY
);

const sendBookingNotification = async (bookingDetails) => {
    // Guard: skip if env vars are not configured
    if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
        console.error('OneSignal notification skipped: missing environment variables');
        return;
    }

    const notification = {
        contents: {
            'en': `New booking from ${bookingDetails.customerName} for ${bookingDetails.time}!`
        },
        headings: { 'en': 'New Appointment' },
        // Sends to all users who have opted into push notifications
        included_segments: ['Subscribed Users'],
    };

    try {
        const response = await client.createNotification(notification);
        console.log("✅ Notification sent successfully:", response.body || response);
    } catch (e) {
        // Log the full error body from OneSignal for debugging
        if (e.httpResponse) {
            console.error("OneSignal API error:", e.httpResponse.statusCode, JSON.stringify(e.body));
        } else {
            console.error("Error sending notification:", e.message || e);
        }
    }
};

module.exports = { sendBookingNotification };