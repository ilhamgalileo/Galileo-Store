import Midtrans from 'midtrans-client';
import dotenv from 'dotenv';

dotenv.config();

const snap = new Midtrans.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export default snap;