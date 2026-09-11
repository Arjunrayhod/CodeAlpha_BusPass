# AWS S3 Deployment Guide (Frontend Static Website)

This guide walks you through building and hosting the React Frontend on **AWS S3 Static Website Hosting** for 100% zero-cost.

---

## Step 1: Build the React Application with your EC2 Backend IP
1. Open terminal in the `frontend` folder on your local machine.
2. Edit `frontend/.env` or specify the EC2 Public IP during build:

```bash
# In frontend/.env:
VITE_API_BASE_URL=http://<YOUR_EC2_PUBLIC_IP>:5000
```

3. Run the production build command:
```bash
npm run build
```
This generates an optimized production bundle in `frontend/dist/`.

---

## Step 2: Create S3 Bucket on AWS Console
1. Navigate to **S3 Console** -> **Create bucket**.
2. **Bucket name**: e.g., `cloudbus-pass-frontend-2026` (must be globally unique).
3. **AWS Region**: Select same region as your EC2 (e.g. `us-east-1`).
4. **Block Public Access settings**:
   - Uncheck **"Block *all* public access"**.
   - Check the acknowledgement checkbox below it (*"I understand that the bucket will become public"*).
5. Click **Create bucket**.

---

## Step 3: Enable Static Website Hosting
1. Click on your newly created bucket.
2. Go to the **Properties** tab.
3. Scroll down to **Static website hosting** (at the bottom) and click **Edit**.
4. Select **Enable**.
5. **Index document**: `index.html`
6. **Error document**: `index.html`
7. Click **Save changes**.
8. Note down the **Bucket website endpoint URL** shown at the bottom (e.g. `http://cloudbus-pass-frontend-2026.s3-website-us-east-1.amazonaws.com`).

---

## Step 4: Configure S3 Public Read Bucket Policy
1. Go to the **Permissions** tab of the bucket.
2. Scroll to **Bucket Policy** and click **Edit**.
3. Paste the following policy (replace `YOUR_BUCKET_NAME` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```
4. Click **Save changes**.

---

## Step 5: Upload the dist/ Folder Contents
### Option A: Via AWS S3 Web Console
1. Go to the **Objects** tab of your bucket.
2. Click **Upload**.
3. Drag and drop all files and folders inside `frontend/dist/` (`index.html`, `assets/`, etc.).
4. Click **Upload**.

### Option B: Via AWS CLI (Fastest)
```bash
aws s3 sync frontend/dist s3://YOUR_BUCKET_NAME --delete
```

---

## Step 6: Test the Deployed System
Open your **S3 Bucket Website Endpoint** in your browser:
```
http://YOUR_BUCKET_NAME.s3-website-us-east-1.amazonaws.com
```
- Test 1-click login with `user@buspass.com` / `User@123` or `admin@buspass.com` / `Admin@123`.
- Test booking a bus pass, viewing real-time seat status, and downloading the QR code and PDF ticket!