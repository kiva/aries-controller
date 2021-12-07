#!/usr/bin/env bash
set -ex

# Allow providing a version manually instead of inferring it from package.json
version=$(jq -r '.version' package.json)
if [ $# -gt 0 ]; then
  version=$1
fi

echo "Publishing $version"
cp package.json dist/
cp README.md dist/
# The .npmrc file is only needed for publish and can cause issues when left around, so manually adding here
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > dist/.npmrc
cd dist
npm publish --verbose
cd ..
