export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan, userEmail, userName, userId } = req.body;
  
  console.log('Plan received:', plan);

  const planDetails = {
    pro: { amount: 29900, currency: 'INR', name: 'ContentStudio AI Pro' },
    max: { amount: 199900, currency: 'INR', name: 'ContentStudio AI Max' }
  };

  const selected = planDetails[plan];
  if (!selected) return res.status(400).json({ error: `Invalid plan: ${plan}` });

  try {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: selected.amount,
        currency: selected.currency,
        receipt: `receipt_${Date.now()}`,
        notes: { user_id: userId, user_email: userEmail, plan: plan }
      })
    });

    const data = await response.json();

    if (data.id) {
      return res.status(200).json({
        order_id: data.id,
        amount: selected.amount,
        currency: selected.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        name: selected.name,
        userEmail: userEmail,
        userName: userName
      });
    } else {
      return res.status(500).json({ error: data.error?.description || 'Order creation failed' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}