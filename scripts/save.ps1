param(
  [string]$Message = "chore: save progress"
)

git add -A
git commit -m $Message
git push origin main
