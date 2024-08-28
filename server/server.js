const app = require('./app');
const os = require('os');
const port = 4000;

// Get the local IP address
const getLocalIPAddress = () => {
    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        for (let iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost'; // Fallback if no external IP found
};

app.listen(port, () => {
    const ipAddress = getLocalIPAddress();
    console.log(`The server is listening on http://${ipAddress}:${port}`);
});
