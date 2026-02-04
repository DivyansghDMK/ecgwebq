# AI Ingestion Implementation Strategy for ECG Data

## Overview
This document outlines the comprehensive strategy for implementing AI ingestion and processing for ECG data in the CardioX system. The AI pipeline will analyze incoming ECG data to detect arrhythmias, anomalies, and provide intelligent insights.

---

## Current Architecture (From Backend Extract)

```
ECG Device → Mobile/Windows App → POST /api/ecg/data → Express API → MongoDB + S3
                                                                          ↓
                                                                    Admin Dashboard
```

### Current Data Flow:
1. ECG data received via POST `/api/ecg/data`
2. Validation via `utils/ecgValidator.js`
3. ECG PDF uploaded to AWS S3
4. Metadata stored in MongoDB `ecgdatas` collection
5. Admin can fetch via GET `/api/admin/ecg-data`

### Current ECG Data Structure:
```json
{
  "device_id": "ECG001",
  "patient_id": "PAT001",
  "recording_date": "2025-01-20T10:00:00Z",
  "patient": {
    "name": "Test Patient",
    "age": "45",
    "gender": "M"
  },
  "metrics": {
    "HR_bpm": 75
  },
  "ecg_pdf_s3_url": "s3://ecg-reports-bucket/...",
  "ecg_json_data": { /* waveform data */ }
}
```

---

## Proposed AI Ingestion Architecture

### Enhanced Data Flow with AI Processing:

```
ECG Device → Mobile/Windows App → POST /api/ecg/data → Express API
                                                              ↓
                                                    [Validation] → MongoDB (metadata)
                                                              ↓
                                                    [Queue System] ← Optional Async Processing
                                                              ↓
                                                    [AI Processing Service]
                                                              ├→ [Waveform Analysis]
                                                              ├→ [Arrhythmia Detection]
                                                              ├→ [Anomaly Detection]
                                                              └→ [Risk Scoring]
                                                              ↓
                                                    [Store AI Results] → MongoDB + Update Record
                                                              ↓
                                                    [Trigger Alerts] → Admin Dashboard / Doctors
```

---

## Implementation Strategy

### Phase 1: AI Processing Pipeline Setup

#### 1.1 AI Processing Service Options

**Option A: Cloud-Based AI Service (Recommended for MVP)**
- **AWS Comprehend Medical** - Healthcare-specific AI (limited ECG support)
- **Google Cloud Healthcare API** - Medical data processing
- **Azure Health Bot** - Healthcare AI services
- **Third-party ECG AI APIs** - Specialized ECG analysis services

**Option B: Custom AI Model (Advanced)**
- **TensorFlow.js** - Browser/Node.js ML
- **PyTorch** - Python-based deep learning
- **ONNX Runtime** - Cross-platform ML inference
- **Custom ECG analysis models** - Trained arrhythmia detection models

**Option C: Hybrid Approach (Recommended Long-term)**
- Cloud AI for quick insights
- Custom models for specialized analysis
- Fallback mechanisms

#### 1.2 AI Processing Architecture Decision

**Recommended: Async Queue-Based Processing**

**Why:**
- Doesn't block the main API response
- Handles high-volume ECG uploads efficiently
- Allows retry logic for failed AI processing
- Scales independently

**Implementation:**
```
POST /api/ecg/data
  ↓
1. Validate ECG data (existing)
2. Upload PDF to S3 (existing)
3. Store initial record in MongoDB with status: "pending_ai_processing"
4. Add job to processing queue (Redis/BullMQ/SQS)
5. Return 202 Accepted immediately

Background Worker:
  ↓
6. Process queue job
7. Send data to AI service
8. Store AI results in MongoDB
9. Update ECG record with status: "ai_processed"
10. Trigger notifications if critical findings
```

---

### Phase 2: AI Analysis Components

#### 2.1 ECG Waveform Analysis

**What to Analyze:**
- **P-QRS-T Waveform Detection**
  - P wave morphology and duration
  - QRS complex detection and width
  - T wave morphology
  - PR interval calculation
  - QT interval calculation

- **Lead Analysis**
  - 12-lead ECG analysis (if available)
  - Lead-specific abnormalities
  - Axis deviation detection

**Data Source:**
- `ecg_json_data` - Raw waveform data
- Metrics from `metrics` field (HR_bpm, PR, QRS, QT/QTc, ST)

**AI Output:**
```json
{
  "waveform_analysis": {
    "p_wave": {
      "detected": true,
      "morphology": "normal",
      "duration_ms": 80,
      "amplitude_mv": 0.15
    },
    "qrs_complex": {
      "detected": true,
      "morphology": "normal",
      "duration_ms": 90,
      "amplitude_mv": 1.2
    },
    "t_wave": {
      "detected": true,
      "morphology": "inverted",
      "amplitude_mv": -0.3
    },
    "intervals": {
      "pr_interval_ms": 160,
      "qt_interval_ms": 400,
      "qtc_interval_ms": 415
    }
  }
}
```

#### 2.2 Arrhythmia Detection

**Types of Arrhythmias to Detect:**

1. **Bradycardia** - Heart rate < 60 bpm
2. **Tachycardia** - Heart rate > 100 bpm
3. **Atrial Fibrillation (AFib)**
4. **Atrial Flutter**
5. **Premature Ventricular Contractions (PVCs)**
6. **Ventricular Tachycardia**
7. **Heart Block (1st, 2nd, 3rd degree)**
8. **ST Elevation/Depression** (MI indicator)

**AI Output:**
```json
{
  "arrhythmia_detection": {
    "detected": true,
    "types": ["Atrial Fibrillation"],
    "confidence": 0.94,
    "severity": "moderate",
    "details": {
      "afib": {
        "present": true,
        "confidence": 0.94,
        "irregularity_index": 0.82,
        "recommendation": "Consult cardiologist"
      }
    }
  }
}
```

#### 2.3 Anomaly Detection

**What to Detect:**
- **Unusual Patterns** - Deviations from normal ECG morphology
- **Artifact Detection** - Noise, movement artifacts
- **Missing Leads** - Incomplete 12-lead ECGs
- **Baseline Drift** - Recording quality issues

**AI Output:**
```json
{
  "anomaly_detection": {
    "anomalies_found": true,
    "artifacts": ["baseline_drift", "muscle_noise"],
    "quality_score": 0.75,
    "quality_assessment": "fair",
    "recommendations": ["Re-record if possible", "Baseline filter applied"]
  }
}
```

#### 2.4 Risk Scoring & Clinical Insights

**Risk Assessment:**
- **Overall Risk Score** - 0-100 scale
- **Risk Categories:**
  - Low (0-30)
  - Moderate (31-70)
  - High (71-100)

- **Clinical Findings Summary**
- **Urgency Level** - Normal, Review, Urgent, Critical
- **Recommended Actions**

**AI Output:**
```json
{
  "risk_assessment": {
    "overall_risk_score": 65,
    "risk_category": "moderate",
    "urgency_level": "review",
    "findings": [
      "Atrial fibrillation detected",
      "Mild ST depression in leads II, III, aVF",
      "QTc interval slightly prolonged"
    ],
    "recommended_actions": [
      "Consult cardiologist within 24-48 hours",
      "Consider Holter monitoring",
      "Review patient medications"
    ],
    "clinical_summary": "ECG shows atrial fibrillation with mild ischemic changes. Requires clinical correlation."
  }
}
```

---

### Phase 3: Database Schema Updates

#### 3.1 Enhanced ECG Record Schema

**New Fields to Add to `ecgdatas` Collection:**

```javascript
{
  // ... existing fields ...
  
  // AI Processing Status
  "ai_processing_status": "pending" | "processing" | "completed" | "failed",
  "ai_processed_at": ISODate,
  "ai_processing_version": "1.0.0",
  
  // AI Analysis Results
  "ai_analysis": {
    "waveform_analysis": { /* from section 2.1 */ },
    "arrhythmia_detection": { /* from section 2.2 */ },
    "anomaly_detection": { /* from section 2.3 */ },
    "risk_assessment": { /* from section 2.4 */ }
  },
  
  
  // AI Metadata
  "ai_model_version": "ecg-model-v1.2.3",
  "ai_confidence_score": 0.94,
  "ai_processing_time_ms": 1250,
  
  // Alert Flags
  "requires_attention": false,
  "alert_level": "normal" | "review" | "urgent" | "critical",
  "alert_sent": false,
  "alert_sent_at": ISODate
}
```

#### 3.2 New Collection: `ai_processing_logs`

**Purpose:** Track AI processing jobs, errors, and performance

```javascript
{
  "_id": ObjectId,
  "ecg_record_id": ObjectId,
  "status": "queued" | "processing" | "completed" | "failed",
  "queued_at": ISODate,
  "started_at": ISODate,
  "completed_at": ISODate,
  "processing_time_ms": Number,
  "ai_service_used": "aws_comprehend" | "custom_model" | "third_party_api",
  "error": String,
  "retry_count": Number
}
```

---

### Phase 4: Backend API Changes

#### 4.1 Enhanced POST `/api/ecg/data` Endpoint

**Changes:**
1. Accept `enable_ai_processing` flag (default: true)
2. Queue AI job after successful upload
3. Return immediately with job ID

**Response:**
```json
{
  "success": true,
  "ecg_record_id": "507f1f77bcf86cd799439011",
  "status": "uploaded",
  "ai_processing": {
    "queued": true,
    "job_id": "ai-job-12345",
    "estimated_completion": "2025-01-20T10:02:00Z"
  },
  "message": "ECG data uploaded successfully. AI processing queued."
}
```

#### 4.2 New Endpoint: GET `/api/admin/ecg-data/:id/ai-analysis`

**Purpose:** Fetch AI analysis results for a specific ECG record

**Response:**
```json
{
  "ecg_record_id": "507f1f77bcf86cd799439011",
  "ai_processing_status": "completed",
  "ai_analysis": { /* full AI analysis object */ },
  "processed_at": "2025-01-20T10:01:45Z"
}
```

#### 4.3 New Endpoint: POST `/api/admin/ecg-data/:id/reprocess-ai`

**Purpose:** Re-trigger AI processing for an existing ECG record

**Use Cases:**
- AI model updated
- Initial processing failed
- Manual re-analysis requested

#### 4.4 New Endpoint: GET `/api/admin/ecg-data/ai-alerts`

**Purpose:** Fetch ECG records requiring attention based on AI findings

**Query Parameters:**
- `alert_level` - Filter by urgency (review, urgent, critical)
- `from` - Date range start
- `to` - Date range end
- `limit` - Results limit

**Response:**
```json
{
  "alerts": [
    {
      "ecg_record_id": "507f1f77bcf86cd799439011",
      "patient": { "name": "John Doe", "id": "PAT001" },
      "recording_date": "2025-01-20T10:00:00Z",
      "alert_level": "urgent",
      "findings": ["Atrial fibrillation detected"],
      "risk_score": 75
    }
  ],
  "total": 15,
  "critical": 2,
  "urgent": 5,
  "review": 8
}
```

#### 4.5 Enhanced GET `/api/admin/ecg-data` Endpoint

**New Query Parameters:**
- `has_ai_analysis` - Filter by AI processing status (true/false)
- `alert_level` - Filter by alert level
- `risk_category` - Filter by risk category (low, moderate, high)
- `ai_confidence_min` - Minimum AI confidence score

**Response Enhancement:**
Include `ai_analysis_summary` in each ECG record:
```json
{
  "ecg_records": [
    {
      // ... existing fields ...
      "ai_analysis_summary": {
        "status": "completed",
        "alert_level": "urgent",
        "risk_score": 75,
        "primary_finding": "Atrial fibrillation",
        "confidence": 0.94
      }
    }
  ]
}
```

---

### Phase 5: Frontend Integration

#### 5.1 Admin Dashboard Enhancements

**A. AI Insights Section (Dashboard Overview)**

- **AI-Processed ECGs Count**
  - Total processed today/this week/month
  - Processing success rate
  - Average processing time

- **Critical Findings Alert Card**
  - Count of urgent/critical ECGs
  - Recent critical findings
  - Link to AI alerts page

- **AI Performance Metrics**
  - AI model accuracy
  - Processing queue depth
  - Average confidence scores

**B. Enhanced Reports Page**

- **AI Analysis Column**
  - Status badge (Pending, Processing, Completed, Failed)
  - Alert level indicator
  - Quick view of primary finding

- **Filter/Sort Options**
  - Filter by AI status
  - Filter by alert level
  - Sort by risk score
  - Sort by AI confidence

- **ECG Detail View Enhancement**
  - Full AI analysis display
  - Waveform visualization with AI annotations
  - Arrhythmia detection highlights
  - Risk assessment breakdown
  - Clinical recommendations

**C. New AI Alerts Page**

- **Alert Dashboard**
  - Tabs: Critical, Urgent, Review
  - ECG cards with key findings
  - Patient information
  - Quick actions (View details, Mark reviewed, Send to doctor)

- **AI Analysis Detail Modal**
  - Full waveform analysis
  - Arrhythmia detection details
  - Anomaly detection results
  - Risk assessment explanation
  - Clinical recommendations

#### 5.2 UI Components to Build

1. **AIStatusBadge** - Shows AI processing status
2. **AlertLevelIndicator** - Visual indicator for alert levels
3. **RiskScoreMeter** - Circular progress for risk score
4. **AIFindingsCard** - Summary card of AI findings
5. **WaveformViewer** - Interactive ECG waveform with AI annotations
6. **AIInsightsPanel** - Detailed AI analysis panel
7. **ProcessingQueueStatus** - Real-time queue monitoring

---

### Phase 6: Notification & Alerting System

#### 6.1 Alert Triggers

**When to Send Alerts:**

1. **Critical Alerts** (Immediate)
   - Life-threatening arrhythmias detected
   - High risk score (>85)
   - Multiple severe findings

2. **Urgent Alerts** (Within 1 hour)
   - Significant arrhythmias
   - Risk score 70-85
   - Abnormal patterns requiring review

3. **Review Alerts** (Daily digest)
   - Moderate risk findings
   - Risk score 40-70
   - Routine anomalies

#### 6.2 Notification Channels

- **In-App Notifications** - Admin dashboard notification center
- **Email Alerts** - To admins and assigned doctors
- **SMS Alerts** - For critical findings (optional)
- **Webhook Integration** - For external systems

#### 6.3 Notification Content

```json
{
  "type": "ecg_ai_alert",
  "severity": "critical",
  "ecg_record_id": "507f1f77bcf86cd799439011",
  "patient": { "name": "John Doe", "id": "PAT001" },
  "recording_date": "2025-01-20T10:00:00Z",
  "findings": ["Atrial fibrillation detected", "ST elevation in leads V1-V3"],
  "risk_score": 92,
  "recommended_action": "Immediate cardiologist consultation required",
  "link": "https://app.cardiox.com/admin/ecg/507f1f77bcf86cd799439011"
}
```

---

### Phase 7: Error Handling & Fallbacks

#### 7.1 AI Processing Failures

**Failure Scenarios:**
1. AI service unavailable
2. Invalid/incomplete ECG data
3. Processing timeout
4. Model inference errors

**Fallback Strategy:**
- Retry mechanism (exponential backoff)
- Queue job for later processing
- Store partial results if available
- Mark record with "ai_processing_failed" status
- Allow manual reprocessing

#### 7.2 Data Quality Handling

- **Incomplete Waveforms** - Skip AI processing, flag as incomplete
- **Low Signal Quality** - Process with lower confidence, flag quality issue
- **Missing Leads** - Process available leads, note missing data

#### 7.3 Graceful Degradation

- System continues to function if AI processing fails
- ECG data still stored and accessible
- Manual review option always available
- AI insights are "nice to have", not critical path

---

### Phase 8: Performance & Scalability

#### 8.1 Processing Performance Targets

- **AI Processing Time:** < 5 seconds per ECG (goal)
- **Queue Processing Rate:** 100+ ECGs per minute
- **API Response Time:** < 200ms (without blocking on AI)
- **System Availability:** 99.9% uptime

#### 8.2 Scalability Considerations

- **Horizontal Scaling** - Multiple AI processing workers
- **Queue Management** - Redis/BullMQ for job queuing
- **Caching** - Cache AI results for similar ECGs
- **Rate Limiting** - Prevent AI service overload
- **Batch Processing** - Process multiple ECGs in batches if possible

#### 8.3 Cost Optimization

- **Selective Processing** - Allow admin to enable/disable AI per device/patient
- **Tiered Processing** - Basic analysis for all, detailed for flagged cases
- **Caching** - Avoid reprocessing identical/similar ECGs
- **Monitoring** - Track AI service costs

---

## Implementation Phases & Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Set up queue system (Redis + BullMQ)
- [ ] Create AI processing worker service
- [ ] Update database schema
- [ ] Implement basic AI service integration (start with cloud API)

### Phase 2: Core AI Processing (Week 3-4)
- [ ] Implement waveform analysis
- [ ] Implement arrhythmia detection
- [ ] Implement anomaly detection
- [ ] Implement risk scoring

### Phase 3: API & Backend (Week 5)
- [ ] Enhance POST `/api/ecg/data` endpoint
- [ ] Create new AI-related endpoints
- [ ] Implement error handling & retries
- [ ] Set up logging & monitoring

### Phase 4: Frontend Integration (Week 6-7)
- [ ] Add AI status indicators to dashboard
- [ ] Create AI alerts page
- [ ] Enhance reports page with AI data
- [ ] Build AI analysis detail views

### Phase 5: Testing & Optimization (Week 8)
- [ ] Load testing
- [ ] Accuracy validation
- [ ] Performance optimization
- [ ] User acceptance testing

---

## Technology Stack Recommendations

### Backend (Node.js/Express)
- **Queue System:** BullMQ + Redis
- **AI Integration:** Axios for API calls / TensorFlow.js for custom models
- **Database:** MongoDB (existing)
- **Storage:** AWS S3 (existing)

### Frontend (React)
- **State Management:** React Query for API calls
- **Charts:** Recharts or Chart.js for waveform visualization
- **Real-time Updates:** WebSocket or polling for AI status updates

### AI Services (Choose One or Hybrid)
1. **Cloud AI APIs** (Quick start)
   - AWS Comprehend Medical
   - Google Cloud Healthcare API
   - Third-party ECG analysis services

2. **Custom Models** (Long-term)
   - TensorFlow.js
   - PyTorch (via Python service)
   - Pre-trained ECG arrhythmia models

---

## Security & Compliance Considerations

1. **HIPAA Compliance** - Ensure AI service is HIPAA-compliant
2. **Data Privacy** - No PII sent to external AI services without encryption
3. **Audit Logging** - Log all AI processing activities
4. **Access Control** - Only authorized users can view AI analysis
5. **Data Retention** - AI results follow same retention policies as ECG data

---

## Success Metrics

1. **Processing Metrics**
   - % of ECGs successfully processed by AI
   - Average processing time
   - Queue wait time

2. **Accuracy Metrics**
   - AI detection accuracy (vs. manual review)
   - False positive/negative rates
   - Confidence score distributions

3. **Business Metrics**
   - Reduction in manual review time
   - Critical findings detection rate
   - User adoption of AI insights

---

## Next Steps

1. **Review & Approval** - Review this strategy document
2. **Choose AI Service** - Decide on cloud AI vs custom model vs hybrid
3. **Set Up Development Environment** - Queue system, AI service credentials
4. **Create Proof of Concept** - Simple AI processing for one ECG record
5. **Begin Phase 1 Implementation** - Queue system and basic integration

---

## Questions to Consider

1. **AI Service Selection**
   - Budget constraints?
   - Preferred cloud provider (AWS/Azure/GCP)?
   - Need for custom model training?

2. **Processing Strategy**
   - Real-time vs async acceptable?
   - What's acceptable processing delay?

3. **Accuracy Requirements**
   - Minimum acceptable AI confidence score?
   - Manual review required for certain findings?

4. **Integration Priorities**
   - Which AI features are highest priority?
   - Admin dashboard vs Doctor dashboard priority?

---

*This strategy document is a living document and should be updated as requirements evolve.*

