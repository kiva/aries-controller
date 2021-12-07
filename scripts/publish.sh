#!/usr/bin/env bash
set -ex

# Allow providing a version manually instead of inferring it from package.json
localVersion=$(jq -r '.version' package.json)
if [ $# -gt 0 ]; then
  localVersion=$1
fi
remoteVersion=$(npm show aries-controller version)

# If the version to publish matches what is already in npm, don't bother publishing
# Else, publish the version
if [ "$localVersion" == "$remoteVersion" ]; then
  echo "The version of aries-controller has not been updated in package.json. Skipping publish step."
else
  echo "Publishing $localVersion"
  cp package.json dist/
  cp README.md dist/
  # The .npmrc file is only needed for publish and can cause issues when left around, so manually adding here
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > dist/.npmrc
  cd dist
  npm publish --verbose
  cd ..
fi
