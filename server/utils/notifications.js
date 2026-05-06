const OneSignal = require('onesignal-node');

// Initialize the client
const client = new OneSignal.Client(
    process.env.ONESIGNAL_APP_ID,
    process.env.ONESIGNAL_REST_API_KEY
);

const sendBookingNotification = async (bookingDetails) => {
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
        console.log("Notification sent:", response.id);
    } catch (e) {
        console.error("Error sending notification:", e);
    }
};

module.exports = { sendBookingNotification };