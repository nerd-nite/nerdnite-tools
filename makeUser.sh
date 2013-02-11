#!/usr/bin/env bash

pushd ~/tools
./create_boss.pl $username $email F
./addBossToCity.pl $city $username
./syncBosses.pl 
cd ../www
wp user create $username $username@nerdnite.com --role=city_boss --display_name=$realName
wp user set-role $username administrator --url=$city.nerdnite.com
popd

