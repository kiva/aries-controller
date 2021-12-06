#!/usr/bin/env bash

localVersion=$(jq -r '.version' package.json)
export LOCAL_VERSION=$localVersion
echo "$localVersion"
unset localVersion
