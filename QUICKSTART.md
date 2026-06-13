# Quick Start Guide - Game Exchange Arbitration System

## 🚀 Launch the Application

The application is already running at: **http://localhost:3000**

## 📖 How to Use

### 1️⃣ Submit a Dispute

**Tab**: "Submit Dispute"

Fill in the form with:
- **Your Name**: Buyer's name
- **Your Email**: Contact email
- **Seller Name**: Name of the seller
- **Item Name**: What you're disputing about
- **Item Value**: USD amount
- **Problem Description**: What went wrong
- **Chat Log**: Full conversation with timestamps

**Example Chat Log Format**:
```
[2024-06-10 14:30] Buyer: Hi, interested in buying X
[2024-06-10 14:35] Seller: Sure! Price is $100
[2024-06-10 14:40] Buyer: Payment sent!
[2024-06-10 15:00] Seller: Got it, will send soon
[2024-06-11 10:00] Buyer: Where is the item?
[2024-06-11 10:15] Seller: (no response)
```

Click **"Submit Dispute for Arbitration"**

### 2️⃣ Analyze Evidence

**Tab**: "Analyze Evidence" (auto-selected after submission)

- Review the dispute summary
- View the chat log in the "Chat Log" tab
- Click **"Analyze Evidence & Generate Verdict"**
- Wait for analysis to complete (2-3 seconds)
- Check the "Analysis" tab for results

### 3️⃣ View Verdict

**Tab**: "View Verdict" (auto-selected after analysis)

See:
- **Verdict**: PAYOUT (seller fulfilled) or REFUND (seller didn't)
- **Confidence**: How confident the system is (0-100%)
- **Reasoning**: Why this verdict was issued
- **Evidence Breakdown**: Which indicators were found
- **Action Items**: What each party must do

### 4️⃣ Export Verdict

- **Download as Text**: Save verdict to file
- **Copy to Clipboard**: Share verdict easily

## 🎯 Verdict Meanings

### ✅ PAYOUT
- Seller fulfilled their obligations
- Buyer must complete payment
- Transaction is considered complete

### ❌ REFUND
- Seller did not fulfill obligations
- Seller must refund the buyer
- Transaction is cancelled

## 📊 Dashboard Stats

- **Total Disputes**: All disputes submitted
- **Resolved**: Disputes with verdicts
- **Pending**: Disputes awaiting analysis

## 💡 Tips

1. **Include Full Chat Logs**: More complete conversations = better analysis
2. **Use Timestamps**: Include dates and times in chat logs
3. **Be Detailed**: Describe the problem clearly
4. **Provide Context**: Explain what was promised vs. what happened

## 🔄 Test the System

Try this sample dispute:

**Buyer**: John Smith  
**Email**: john@example.com  
**Seller**: GameMaster99  
**Item**: Rare Sword  
**Value**: $200  

**Problem**: Seller took payment but never delivered the item. Been waiting 7 days.

**Chat Log**:
```
[2024-06-10 10:00] John: Hi, I want to buy the Rare Sword
[2024-06-10 10:15] GameMaster99: Sure! $200
[2024-06-10 10:30] John: Payment sent!
[2024-06-10 11:00] GameMaster99: Got payment, will send item
[2024-06-11 10:00] John: Where is the item?
[2024-06-11 10:30] GameMaster99: (no response)
[2024-06-12 09:00] John: Still waiting!
[2024-06-12 09:30] GameMaster99: (no response)
[2024-06-13 14:00] John: Filing dispute!
[2024-06-13 14:30] GameMaster99: (no response)
```

**Expected Verdict**: REFUND (seller didn't deliver)

## ⚙️ System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No additional software needed

## 🆘 Troubleshooting

**Form won't submit?**
- Make sure all fields are filled
- Check for error messages in red text

**Analysis not starting?**
- Click "Analyze Evidence & Generate Verdict" button
- Wait 2-3 seconds for processing

**Can't see verdict?**
- Click "View Verdict" tab
- Scroll down to see full verdict

## 📱 Mobile Support

The system is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones

## 🔐 Privacy

- All data stays in your browser
- No data sent to external servers
- Disputes are not saved between sessions

## 📞 Support

For issues or questions, refer to the main README.md file.

---

**Ready to resolve disputes? Start by clicking "Submit Dispute"!**
