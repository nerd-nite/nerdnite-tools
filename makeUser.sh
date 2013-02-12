#!/usr/bin/env bash

user=""
email=""
city=""
realName=""

while getopts u:e:c:r: param
do
    case $param in
    u)  user="$OPTARG";;
    e)  email="$OPTARG";;
    c)  city="$OPTARG";;
    r)  realName="$OPTARG";;
    esac
done

passed=1
if [[ -z "$user" ]]; then
    echo "Please provide a username";
    passed=0
fi
if [[ -z "$email" ]]; then
    echo "Please provide an external email address";
    passed=0
fi
if [[ -z "$city" ]]; then
    echo "Please provide a city";
    passed=0
fi
if [[ -z "$realName" ]]; then
    echo "Please provide a real name";
    passed=0
fi
if [[ passed -eq 0 ]]; then
    exit 1;
fi

pushd ~/tools
./create_boss.pl $user $email F
./addBossToCity.pl $city $user
./syncBosses.pl
cd ../www
wp user create $user $user@nerdnite.com --role=city_boss --display_name="$realName"
wp user set-role $user administrator --url=$city.nerdnite.com
popd

