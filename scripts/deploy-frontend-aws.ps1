param(
    [Parameter(Mandatory = $true)] [string]$Bucket,
    [Parameter(Mandatory = $true)] [string]$DistributionId,
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "Building frontend..."
Push-Location frontend
npm install
npm run build
Pop-Location

Write-Host "Uploading to S3 bucket: $Bucket"
aws s3 sync .\frontend\dist "s3://$Bucket" --delete --region $Region

Write-Host "Invalidating CloudFront distribution: $DistributionId"
aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"

Write-Host "Frontend deployed to S3 + CloudFront."
