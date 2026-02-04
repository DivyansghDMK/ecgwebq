# AWS SAM Deployment - Permission Issue Resolution

## Problem
Your AWS user `deckbackend` doesn't have CloudFormation permissions required for `sam deploy`.

**Error:**
```
User: arn:aws:iam::373962339435:user/deckbackend is not authorized to perform: 
cloudformation:CreateChangeSet
```

## Solutions

### Option 1: Request IAM Permissions (Recommended for SAM)

Ask your AWS administrator to attach the policy in `iam-policy-for-sam.json` to your user `deckbackend`.

**Required Permissions:**
- CloudFormation (CreateStack, UpdateStack, CreateChangeSet, etc.)
- Lambda (CreateFunction, UpdateFunctionCode, etc.)
- IAM (CreateRole, PassRole, etc.)
- API Gateway (all actions)
- S3 (CreateBucket, GetObject, PutObject, etc.)
- CloudWatch Logs (CreateLogGroup, etc.)

After permissions are granted, you can run:
```powershell
sam deploy --guided
```

### Option 2: Use Alternative Deployment Method

If you can't get CloudFormation permissions, you can deploy using the AWS SDK directly. However, this requires:
- Lambda permissions (CreateFunction, UpdateFunctionCode)
- API Gateway permissions
- IAM permissions (to create/update Lambda execution roles)

**Note:** The existing `deploy-lambda.cjs` script uses this approach but may also require IAM permissions for role creation.

### Option 3: Use AWS Console

Deploy manually through the AWS Console:
1. Package each function from `.aws-sam/build/{FunctionName}/`
2. Upload via Lambda Console
3. Create API Gateway manually
4. Connect endpoints

## Current Status

✅ **SAM Build:** Successful - artifacts in `.aws-sam/build/`
❌ **SAM Deploy:** Blocked by IAM permissions

## Next Steps

1. **If you have an AWS administrator:**
   - Share `iam-policy-for-sam.json` with them
   - Request they attach it to user `deckbackend`
   - Then run `sam deploy --guided`

2. **If you need to proceed without CloudFormation:**
   - Check if your user has Lambda/API Gateway permissions
   - Use the existing deployment scripts or create new ones
   - Deploy functions individually

3. **Check current permissions:**
   ```powershell
   aws iam list-user-policies --user-name deckbackend
   aws iam list-attached-user-policies --user-name deckbackend
   ```

