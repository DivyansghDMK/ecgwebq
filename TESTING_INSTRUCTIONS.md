# Testing Instructions - Reports Page

## Network Error क्यों आ रहा है?

जब आप search करते हैं, तो network error इसलिए आता है क्योंकि:
1. Backend API server (`http://localhost:3000/api`) चल नहीं रहा है
2. या API endpoint `/reports` available नहीं है

## Solution: Mock Data के साथ Testing

मैंने mock data functionality add कर दी है जो बिना backend के भी testing allow करती है।

### Option 1: Mock Data के साथ Test करें (Recommended for now)

1. `.env` file में ये add करें:
```
VITE_USE_MOCK_DATA=true
```

2. Dev server restart करें:
```bash
# Terminal में Ctrl+C दबाएं, फिर:
npm run dev
```

3. अब search करें - Mock data से results मिलेंगे!

### Option 2: Real Backend API के साथ Test करें

जब आपका backend ready हो, तो:

1. `.env` file में API URL set करें:
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_DATA=false
```

2. Backend server start करें

3. Dev server restart करें

## PDF Download Functionality कैसे Test करें?

### Steps:

1. **Mock Data Enable करें** (ऊपर देखें)

2. **Reports Page खोलें**: `http://localhost:5173/artists/reports`

3. **Search करें**: 
   - Name: "John" या "Jane" लिखकर Search दबाएं
   - या कोई भी filter empty छोड़कर Search दबाएं (सभी mock reports दिखेंगे)

4. **Report Select करें**:
   - Left panel में कोई भी report card पर click करें
   - PDF automatically generate होगा

5. **PDF Preview Check करें**:
   - Right panel में "PDF Preview" section देखें
   - PDF iframe में दिखनी चाहिए

6. **Download Test करें**:
   - "Download PDF" button click करें
   - PDF file automatically download होनी चाहिए
   - Browser के downloads folder में check करें
   - PDF file name: `report_1_John Doe.pdf` जैसा होगा

### Mock Data में कौन से Reports हैं?

- **John Doe** - Phone: 9876543210, Device: DEV001
- **Jane Smith** - Phone: 9876543211, Device: DEV002
- **Bob Wilson** - Phone: 9876543212, Device: DEV003
- **Alice Johnson** - Phone: 9876543213, Device: DEV001

### Testing Checklist:

- [ ] Mock data enable करके search करें
- [ ] Reports list में सभी reports दिखें
- [ ] Filter by name (e.g., "John")
- [ ] Filter by phone number (e.g., "9876543210")
- [ ] Filter by device ID (e.g., "DEV001")
- [ ] Report select करने पर PDF generate हो
- [ ] PDF preview correctly दिखे
- [ ] Download button click करने पर PDF download हो
- [ ] Downloaded PDF में सही data हो

## Troubleshooting

### अगर PDF download नहीं हो रहा:

1. Browser console check करें (F12)
2. Errors देखें
3. Browser के download settings check करें (auto-download allow होना चाहिए)

### अगर PDF preview नहीं दिख रहा:

1. Browser console check करें
2. PDF generation में error हो सकता है
3. jsPDF library properly installed होनी चाहिए

### Real API के साथ Test करते समय:

1. Backend server running होना चाहिए
2. API endpoint `/reports` available होना चाहिए
3. Response format match होना चाहिए:
```json
{
  "success": true,
  "data": {
    "reports": [...],
    "total": 10
  }
}
```

