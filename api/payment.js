export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan, userEmail, userName, userId } = req.body;

  const planDetails = {
    pro: { amount: 299, name: 'ContentStudio AI Pro' },
    max: { amount: 1999, name: 'ContentStudio AI Max' }
  };

  const selected = planDetails[plan];
  if (!selected) return res.status(400).json({ error: 'Invalid plan' });

  const orderId = 'order_' + Date.now();

  try {
    const response = await fetch('https://sandbox.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: selected.amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_email: userEmail,
          customer_name: userName,
          customer_phone: '9999999999'
        },
        order_meta: {
          return_url: `https://contentstudio-ai.vercel.app/dashboard.html?payment=success&plan=${plan}`
        }
      })
    });

    const data = await response.json();

    if (data.payment_session_id) {
      return res.status(200).json({
        payment_session_id: data.payment_session_id,
        order_id: orderId
      });
    } else {
      return res.status(500).json({ error: data.message || 'Payment init failed' });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}