# Doctor Report Review Feature - Setup Checklist

## ✅ What's Already Done

All code has been implemented:
- ✅ Backend API endpoints (`doctor-reports.ts`, `doctor-upload-reviewed.ts`)
- ✅ Frontend components (ReviewModal, SignatureCanvas, DoctorReportsPage)
- ✅ PDF processing with pdf-lib
- ✅ API Gateway routes configured in `template.yaml`
- ✅ Navigation from Doctor Dashboard to Reports page

## 📋 Steps You Need to Complete

### 1. **Deploy Backend (If Not Already Deployed)**

Since you encountered IAM permission issues earlier, you have two options:

#### Option A: Deploy with SAM (Recommended - if you get IAM permissions)
```powershell
# Rebuild if needed
sam build

# Deploy (once you have CloudFormation permissions)
sam deploy --guided
```

#### Option B: Deploy Functions Individually (If SAM deploy fails)
You can use the existing deployment scripts or deploy via AWS Console:
- Deploy `doctor-reports.ts` as Lambda function `ecg-doctor-reports`
- Deploy `doctor-upload-reviewed.ts` as Lambda function `ecg-doctor-upload-reviewed`
- Configure API Gateway routes manually:
  - `GET /api/doctor/reports` → `ecg-doctor-reports`
  - `POST /api/doctor/upload-reviewed` → `ecg-doctor-upload-reviewed`

### 2. **Configure Frontend API URL**

Create or update `.env` file in the project root:

```env
VITE_API_BASE_URL=https://YOUR_API_GATEWAY_URL/prod
```

**To find your API Gateway URL:**
- If you deployed with SAM, check the CloudFormation stack outputs
- Or check AWS Console → API Gateway → Your API → Stages → prod
- Format: `https://xxxxx.execute-api.us-east-1.amazonaws.com/prod`

**For local development:**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. **Install Dependencies (If Needed)**

The `pdf-lib` package is already in `package.json`, but make sure all dependencies are installed:

```powershell
npm install
```

### 4. **Test the Feature**

1. **Start the frontend:**
   ```powershell
   npm run dev
   ```

2. **Navigate to Doctor Dashboard:**
   - Go to `/doctor` or `/login` (if you have doctor login)
   - Click on "Reports" in the sidebar
   - Should navigate to `/doctor/reports`

3. **Test the Review Flow:**
   - Click "Review" on any PDF report
   - Modal should open with PDF preview
   - Enter comments in the text box
   - Draw signature or upload signature image
   - Click "Submit Reviewed PDF"
   - Check S3 bucket at `reports/reviewed/` to verify uploaded file

### 5. **Verify S3 Permissions**

Ensure your Lambda execution role has:
- ✅ Read access to `ecg-reports/*.pdf` (for listing reports)
- ✅ Write access to `reports/reviewed/*` (for uploading reviewed PDFs)

The `template.yaml` already configures these via:
- `S3ReadPolicy` for `DoctorReportsFunction`
- `S3CrudPolicy` for `DoctorUploadReviewedFunction`

### 6. **Optional: Test with Sample PDFs**

If you don't have PDFs in S3 yet:
1. Upload some test PDFs to your S3 bucket under `ecg-reports/` prefix
2. They should appear in the Doctor Reports page

## 🔍 Troubleshooting

### Issue: "Failed to load reports"
- **Check:** API Gateway URL in `.env` is correct
- **Check:** API Gateway routes are deployed
- **Check:** Lambda functions are deployed and have correct S3 permissions

### Issue: "Failed to upload reviewed PDF"
- **Check:** Lambda function has write permissions to `reports/reviewed/` prefix
- **Check:** API Gateway allows POST requests with multipart/form-data
- **Check:** Browser console for CORS errors

### Issue: Signature not appearing in PDF
- **Check:** Browser console for errors
- **Check:** Signature canvas is drawing correctly (try clearing and redrawing)
- **Check:** PDF generation is completing (check network tab for upload request)

### Issue: Navigation not working
- **Check:** React Router is properly configured
- **Check:** Routes are defined in `App.tsx`

## 📝 Quick Test Checklist

- [ ] Backend deployed (Lambda functions + API Gateway)
- [ ] `.env` file configured with correct API URL
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend running (`npm run dev`)
- [ ] Can navigate to `/doctor/reports`
- [ ] Reports list loads from S3
- [ ] Can click "Review" and modal opens
- [ ] PDF preview displays correctly
- [ ] Can enter comments
- [ ] Can draw/upload signature
- [ ] Reviewed PDF uploads successfully
- [ ] Reviewed PDF appears in S3 at `reports/reviewed/`

## 🎯 Next Steps After Setup

Once everything is working:
1. Test with real ECG PDFs
2. Verify reviewed PDFs contain comments and signatures
3. Consider adding:
   - Email notifications when doctor reviews a report
   - Review history/audit trail
   - Doctor authentication/authorization
   - Batch review capabilities

---

**Need Help?** Check the browser console and AWS CloudWatch logs for detailed error messages.

