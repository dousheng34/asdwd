# Game Exchange Arbitration System

An independent, AI-powered dispute resolution platform for game item trades. This system analyzes chat logs and evidence to issue binding verdicts: **PAYOUT** (seller fulfilled) or **REFUND** (seller didn't fulfill).

## 🎯 Features

### 1. **Dispute Submission**
- Buyers submit disputes with complete transaction details
- Capture buyer/seller information, item details, and problem description
- Upload full chat logs as evidence
- Support for screenshot evidence

### 2. **Evidence Analysis**
- Intelligent parsing of chat logs
- Detection of key fulfillment indicators:
  - Seller acknowledgment of order
  - Seller commitment to delivery
  - Proof of delivery/transfer
  - Buyer confirmation of receipt
- Detection of non-fulfillment indicators:
  - Seller ignoring buyer
  - Seller refusing to fulfill
  - Lack of proof
  - Buyer complaints

### 3. **Automated Verdict Generation**
- AI-powered analysis of evidence
- Confidence scoring (0-100%)
- Clear reasoning for each verdict
- Binding and final decisions

### 4. **Verdict Display & Export**
- Professional verdict cards with clear verdict (PAYOUT/REFUND)
- Detailed evidence breakdown
- Action items for both parties
- Export as text file or copy to clipboard

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: React hooks

### Project Structure
```
arbitration-system/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── layout.tsx            # Root layout with metadata
│   └── globals.css           # Global styles
├── components/
│   ├── DisputeForm.tsx       # Dispute submission form
│   ├── ArbitrationAnalyzer.tsx # Evidence analysis
│   └── VerdictDisplay.tsx    # Verdict presentation
├── lib/
│   └── utils.ts              # Utility functions
└── public/                   # Static assets
```

## 📋 How It Works

### Step 1: Submit Dispute
1. Navigate to "Submit Dispute" tab
2. Fill in buyer information (name, email)
3. Enter seller name
4. Provide item details (name, value)
5. Describe the problem
6. Paste complete chat log with timestamps
7. Click "Submit Dispute for Arbitration"

### Step 2: Analyze Evidence
1. System automatically switches to "Analyze Evidence" tab
2. Review dispute summary
3. View chat log in evidence review
4. Click "Analyze Evidence & Generate Verdict"
5. System analyzes the chat log for key indicators

### Step 3: View Verdict
1. System automatically switches to "View Verdict" tab
2. See final verdict: **PAYOUT** or **REFUND**
3. Review confidence score
4. Read detailed reasoning
5. Check evidence breakdown (fulfillment vs non-fulfillment indicators)
6. See action items for both parties
7. Export or share the verdict

## 🔍 Verdict Logic

### PAYOUT (Seller Fulfilled)
Issued when evidence shows:
- ✓ Seller acknowledged the order
- ✓ Seller committed to delivery
- ✓ Proof of delivery/transfer provided
- ✓ Buyer confirmed receipt

### REFUND (Seller Didn't Fulfill)
Issued when evidence shows:
- ✗ Seller ignored the order
- ✗ Seller refused to fulfill
- ✗ No proof of delivery
- ✗ Buyer complained about non-delivery

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation
```bash
cd arbitration-system
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build
```bash
npm run build
npm start
```

## 📊 Dashboard Overview

The main dashboard displays:
- **Total Disputes**: Count of all submitted disputes
- **Resolved**: Count of disputes with verdicts
- **Pending**: Count of disputes awaiting analysis
- **Recent Disputes List**: Quick access to previous disputes

## 🎨 UI Components Used

- **Card**: Dispute summary, evidence review, verdict display
- **Tabs**: Navigation between submit/analyze/verdict
- **Button**: Form submission, analysis trigger
- **Badge**: Status indicators, verdict display
- **Textarea**: Chat log input
- **Input**: Text fields for buyer/seller info
- **Alert**: Information boxes and warnings

## 🔐 Data Handling

- All dispute data stored in component state
- No external database required for demo
- In production, integrate with PostgreSQL for persistence
- Chat logs stored as plain text for analysis
- Verdicts timestamped for audit trail

## 📝 Example Dispute

**Buyer**: Alex Johnson  
**Seller**: SkylarGaming  
**Item**: Legendary Dragon Sword  
**Value**: $150  

**Problem**: Seller promised to deliver but never sent the item after payment.

**Chat Log**: Full conversation with timestamps showing:
- Initial agreement
- Payment confirmation
- Seller's commitment to send
- Buyer's follow-up messages
- Seller's non-response

**Verdict**: **REFUND** (90% confidence)  
**Reasoning**: Seller acknowledged order and committed to delivery but provided no proof and ignored buyer's follow-up messages.

## 🛠️ Customization

### Modify Verdict Logic
Edit `ArbitrationAnalyzer.tsx` to adjust:
- Indicator detection keywords
- Confidence scoring algorithm
- Verdict thresholds

### Customize Styling
- Update Tailwind classes in components
- Modify color scheme in `globals.css`
- Adjust spacing and typography

### Add Features
- Database integration (PostgreSQL + Prisma)
- Email notifications
- User authentication
- Appeal process
- Multi-language support

## 📄 License

MIT License - Feel free to use and modify

## 🤝 Support

For issues or questions, please refer to the documentation or contact support.

---

**Built with Next.js, shadcn/ui, and Tailwind CSS**
