#!/usr/bin/env bash
set -ex
if [[ $1 == "dev" ]]
then
  opt=" --tag dev" 
else
  opt="" 
fi

cp package.json dist/
cp README.md dist/
cp .npmrc dist/
cd dist
npm publish --verbose $opt
cd ..