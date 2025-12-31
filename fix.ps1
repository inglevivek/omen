# 1. Navigate to your project
cd C:\Home\Projects\omen\omen-files-and-functions-indexer

# 2. Clean everything
Remove-Item -Force -Recurse dist, node_modules, package-lock.json -ErrorAction SilentlyContinue

# 3. Check package.json for tree-sitter
Get-Content package.json | Select-String "tree-sitter"

# 4. If found, manually remove from package.json dependencies

# 5. Fresh install
npm cache clean --force
npm install

# 6. Verify no native modules
Get-ChildItem -Recurse node_modules -Filter "*.node"
# Should return NOTHING

# 7. Compile
npm run compile

# 8. Verify clean output
Select-String "tree-sitter" dist\extension.js

# 9. Test - Press F5 in VS Code
