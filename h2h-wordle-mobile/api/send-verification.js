// API endpoint to send verification code via email
// Uses nodemailer with Gmail SMTP

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'arviciramoxda@gmail.com',
    pass: 'apeg hwji xxwa dxqv'
  }
});

// HTML email template with styled verification code
function getVerificationEmailHTML(code) {
  const digits = code.split('');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:440px;margin:auto;background:#0f172a;border:3px solid #334155;border-radius:30px;padding:42px 28px;text-align:center;color:#fff;position:relative;overflow:hidden;box-shadow:0 0 45px rgba(0,0,0,.9),inset 0 0 60px rgba(255,255,255,.03);">
    <div style="position:absolute;inset:0;background:url('https://www.transparenttextures.com/patterns/stardust.png');opacity:.18;"></div>
    <div style="position:absolute;top:-120px;left:-120px;width:260px;height:260px;background:#2563eb;border-radius:50%;filter:blur(45px);opacity:.28;"></div>
    <div style="position:absolute;bottom:-140px;right:-140px;width:300px;height:300px;background:#f97316;border-radius:50%;filter:blur(55px);opacity:.25;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%);"></div>
    
    <div style="position:relative;z-index:2;font-size:28px;font-weight:900;margin-bottom:8px;color:#10b981;text-shadow:0 0 20px rgba(16,185,129,.5);">WORDLE</div>
    <div style="position:relative;z-index:2;font-size:13px;font-weight:800;color:#d1d5db;letter-spacing:4px;margin-bottom:22px;text-shadow:0 0 10px rgba(255,255,255,.25);">ENTER THE ARENA</div>
    
    <div style="display:flex;justify-content:center;gap:14px;position:relative;z-index:2;margin-bottom:20px;">
      <span style="width:72px;height:72px;line-height:72px;background:#1e293b;border:3px solid #60a5fa;border-radius:20px;font-size:38px;font-weight:900;color:#fff;display:inline-block;box-shadow:0 0 22px rgba(96,165,250,.75),0 0 40px rgba(96,165,250,.25),inset 0 3px 10px rgba(255,255,255,.12);transform:rotate(-3deg);">${digits[0]}</span>
      <span style="width:72px;height:72px;line-height:72px;background:#1e293b;border:3px solid #facc15;border-radius:20px;font-size:38px;font-weight:900;color:#fff;display:inline-block;box-shadow:0 0 22px rgba(250,204,21,.75),0 0 40px rgba(250,204,21,.25),inset 0 3px 10px rgba(255,255,255,.12);transform:rotate(2deg);">${digits[1]}</span>
      <span style="width:72px;height:72px;line-height:72px;background:#1e293b;border:3px solid #fb923c;border-radius:20px;font-size:38px;font-weight:900;color:#fff;display:inline-block;box-shadow:0 0 22px rgba(251,146,60,.75),0 0 40px rgba(251,146,60,.25),inset 0 3px 10px rgba(255,255,255,.12);transform:rotate(-2deg);">${digits[2]}</span>
      <span style="width:72px;height:72px;line-height:72px;background:#1e293b;border:3px solid #4ade80;border-radius:20px;font-size:38px;font-weight:900;color:#fff;display:inline-block;box-shadow:0 0 22px rgba(74,222,128,.75),0 0 40px rgba(74,222,128,.25),inset 0 3px 10px rgba(255,255,255,.12);transform:rotate(3deg);">${digits[3]}</span>
    </div>
    
    <div style="position:relative;z-index:2;margin-top:26px;font-size:15px;color:#cbd5e1;line-height:1.6;">
      Use this code to verify your email and enter the <span style="color:#facc15;font-weight:800;">WORDLE</span> arena!
    </div>
    
    <div style="position:relative;z-index:2;margin-top:30px;padding-top:20px;border-top:1px solid #334155;font-size:12px;color:#64748b;">
      If you didn't create an account, please ignore this email.
    </div>
  </div>
</body>
</html>
  `;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST only' });
  }
  
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());
    
    const { email, code } = body;
    
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and code required' });
    }
    
    console.log(`=== SENDING EMAIL ===`);
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    
    // Send email with nodemailer
    const mailOptions = {
      from: 'arviciramoxda@gmail.com',
      to: email,
      subject: '🎮 Your WORDLE Verification Code',
      html: getVerificationEmailHTML(code)
    };
    
    await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully!');
    console.log('========================');
    
    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
    
  } catch (error) {
    console.error('Email API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}