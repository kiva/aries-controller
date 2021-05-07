#!/usr/bin/env bash
set -ex

cp package.json dist/
cp README.md dist/
# The .npmrc file is only needed for publish and can cause issues when left around, so manually adding here
echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > dist/.npmrc
cd dist
npm publish --verbose
cd ..
