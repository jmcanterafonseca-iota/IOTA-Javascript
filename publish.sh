#!/bin/sh

numMessages=$1
seed=$(./test-data/seed.sh)
sideKey=$(./test-data/seed.sh)
network=$(cat ./test-data/devnet)
message=$(cat ./test-data/message.json)

echo $numMessages
echo $seed
echo $sideKey
echo $network
echo $message

for i in {0..1000}
  do echo "$i"; time node mam.js/publish-mam.js --seed=$seed --mode=restricted --devnet --message="$message" --index=$i --sidekey=$sideKey;
done

