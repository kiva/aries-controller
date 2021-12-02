#!/usr/bin/env bash
set -ex

localVersion=$(jq -r '.version' ../package.json)
remoteVersion=$(npm show aries-controller version)

if [ "$localVersion" == "$remoteVersion" ]; then
  echo "The version of aries-controller has not been updated in package.json. Skipping publish step."
else
  echo "Publishing $localVersion"
  cp ../package.json ../dist/
  cp ../README.md ../dist/
  # The .npmrc file is only needed for publish and can cause issues when left around, so manually adding here
  echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > ../dist/.npmrc
  cd ../dist
  npm publish --verbose
  cd ..
fi
