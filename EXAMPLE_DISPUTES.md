# Example Disputes for Testing

Use these example disputes to test the arbitration system. Copy and paste the information into the form.

---

## Example 1: Non-Delivery (Expected: REFUND)

**Scenario**: Buyer paid for an item but seller never delivered it.

### Form Data
```
Buyer Name: Sarah Chen
Email: sarah.chen@email.com
Seller Name: ProGamer2024
Item Name: Legendary Axe
Item Value: 250
Problem: Paid $250 for a Legendary Axe but seller disappeared after taking payment. No response for 10 days.
```

### Chat Log
```
[2024-06-01 14:00] Sarah: Hi, I'm interested in the Legendary Axe
[2024-06-01 14:15] ProGamer2024: Yes, I have it! $250
[2024-06-01 14:30] Sarah: Sounds good, sending payment now
[2024-06-01 14:45] Sarah: Payment sent! Can you confirm?
[2024-06-01 15:00] ProGamer2024: Got it, will send the axe tomorrow
[2024-06-02 10:00] Sarah: Hi, where is the axe?
[2024-06-02 10:30] ProGamer2024: (no response)
[2024-06-03 09:00] Sarah: Still waiting for the axe
[2024-06-03 09:30] ProGamer2024: (no response)
[2024-06-04 14:00] Sarah: This is unacceptable! Where is my item?
[2024-06-04 14:30] ProGamer2024: (no response)
[2024-06-05 10:00] Sarah: Filing a dispute. You took my money!
[2024-06-05 10:30] ProGamer2024: (no response)
```

**Expected Verdict**: ❌ REFUND (90%+ confidence)
**Reason**: Seller acknowledged payment but never delivered and ignored all follow-ups.

---

## Example 2: Successful Delivery (Expected: PAYOUT)

**Scenario**: Buyer and seller complete transaction successfully.

### Form Data
```
Buyer Name: Marcus Johnson
Email: marcus.j@email.com
Seller Name: Trustworthy_Trader
Item Name: Enchanted Shield
Item Value: 175
Problem: None - testing successful transaction
```

### Chat Log
```
[2024-06-05 11:00] Marcus: Hi, interested in the Enchanted Shield
[2024-06-05 11:15] Trustworthy_Trader: Sure! $175
[2024-06-05 11:30] Marcus: Perfect, sending payment
[2024-06-05 11:45] Marcus: Payment sent!
[2024-06-05 12:00] Trustworthy_Trader: Got payment, sending shield now
[2024-06-05 13:00] Trustworthy_Trader: Shield sent! Check your inventory
[2024-06-05 13:15] Marcus: Got it! Thank you so much!
[2024-06-05 13:30] Trustworthy_Trader: Great! Enjoy the shield!
[2024-06-05 13:45] Marcus: Perfect transaction, very happy
```

**Expected Verdict**: ✅ PAYOUT (95%+ confidence)
**Reason**: Seller delivered item, buyer confirmed receipt, transaction completed successfully.

---

## Example 3: Partial Fulfillment (Expected: REFUND)

**Scenario**: Seller delivered wrong item or incomplete order.

### Form Data
```
Buyer Name: Emma Rodriguez
Email: emma.r@email.com
Seller Name: ItemMaster
Item Name: Dragon Armor Set (Full)
Item Value: 500
Problem: Seller sent only helmet, not the full armor set. Promised full set for $500.
```

### Chat Log
```
[2024-06-08 10:00] Emma: Hi, I want the full Dragon Armor Set
[2024-06-08 10:15] ItemMaster: Sure! Complete set, $500
[2024-06-08 10:30] Emma: Confirmed, sending payment
[2024-06-08 10:45] Emma: Payment sent!
[2024-06-08 11:00] ItemMaster: Got it, will send armor set
[2024-06-08 12:00] ItemMaster: Sent! Check inventory
[2024-06-08 12:15] Emma: I only got the helmet! Where is the rest?
[2024-06-08 12:30] ItemMaster: That's all I have
[2024-06-08 12:45] Emma: You promised the FULL set! This is not what we agreed on
[2024-06-08 13:00] ItemMaster: Sorry, that's all I can give
[2024-06-08 13:15] Emma: This is fraud! I'm disputing this
```

**Expected Verdict**: ❌ REFUND (85%+ confidence)
**Reason**: Seller delivered incomplete order. Buyer paid for full set but received only helmet.

---

## Example 4: Delayed Delivery (Expected: PAYOUT)

**Scenario**: Seller delivered late but eventually fulfilled the order.

### Form Data
```
Buyer Name: David Kim
Email: david.kim@email.com
Seller Name: SlowButReliable
Item Name: Rare Gem
Item Value: 300
Problem: Took 5 days to deliver but eventually sent the item
```

### Chat Log
```
[2024-06-10 09:00] David: Hi, want to buy the Rare Gem
[2024-06-10 09:15] SlowButReliable: Sure! $300
[2024-06-10 09:30] David: Payment sent!
[2024-06-10 09:45] SlowButReliable: Got it, will send soon
[2024-06-11 10:00] David: When will you send it?
[2024-06-11 10:15] SlowButReliable: Tomorrow for sure
[2024-06-12 10:00] David: Still waiting...
[2024-06-12 10:30] SlowButReliable: Sorry, sending today
[2024-06-13 14:00] David: Any update?
[2024-06-13 14:30] SlowButReliable: Sending now!
[2024-06-14 10:00] David: Got the gem! Thanks
[2024-06-14 10:15] SlowButReliable: Great! Sorry for the delay
```

**Expected Verdict**: ✅ PAYOUT (80%+ confidence)
**Reason**: Seller eventually delivered the item and buyer confirmed receipt, despite delays.

---

## Example 5: Disputed Quality (Expected: REFUND)

**Scenario**: Seller delivered item but quality doesn't match description.

### Form Data
```
Buyer Name: Lisa Anderson
Email: lisa.a@email.com
Seller Name: QualityDealer
Item Name: Legendary Sword (Pristine)
Item Value: 400
Problem: Seller said pristine condition but item arrived damaged/worn
```

### Chat Log
```
[2024-06-12 11:00] Lisa: Hi, is the sword really pristine?
[2024-06-12 11:15] QualityDealer: Yes! Pristine condition, $400
[2024-06-12 11:30] Lisa: Okay, sending payment
[2024-06-12 11:45] Lisa: Payment sent!
[2024-06-12 12:00] QualityDealer: Sent the sword
[2024-06-13 10:00] Lisa: Got the sword but it's damaged! Not pristine at all!
[2024-06-13 10:15] QualityDealer: It's in good condition
[2024-06-13 10:30] Lisa: No it's not! You lied about the condition
[2024-06-13 10:45] QualityDealer: That's how it is, no refunds
[2024-06-13 11:00] Lisa: This is false advertising! Filing dispute
[2024-06-13 11:15] QualityDealer: (no response)
```

**Expected Verdict**: ❌ REFUND (85%+ confidence)
**Reason**: Seller misrepresented item condition. Buyer received damaged item instead of pristine.

---

## How to Test

1. Go to "Submit Dispute" tab
2. Copy one of the examples above
3. Fill in all fields exactly as shown
4. Click "Submit Dispute for Arbitration"
5. Click "Analyze Evidence & Generate Verdict"
6. Check the verdict in "View Verdict" tab
7. Compare with "Expected Verdict" above

## Key Indicators the System Looks For

### ✅ Fulfillment Indicators
- Seller acknowledges the order
- Seller commits to delivery
- Seller provides proof of delivery
- Buyer confirms receipt

### ❌ Non-Fulfillment Indicators
- Seller ignores buyer
- Seller refuses to fulfill
- No proof of delivery
- Buyer complains about non-delivery

---

**Try all 5 examples to see how the system handles different dispute scenarios!**
