# nerdnite-tools

Tools for Nerd Nite management

## Getting started
To get started, you're going to want to do the following after cloning:

```
npm install
npm run-script templates
```

For local testing you'll want to start up the Docker DB. If you have native Docker use

```
docker-compose up -d
```

to start the DB in the background.

This starts a db on `localhost:3306`. There is a `nerdnite` user with password `nerdnite`.

In order to run scripts, you'll need to preface commands with:


```
DB_HOST=127.0.0.1 DB_USER=nerdnite DB_PASS=nerdnite
```

You'll also need to set a `MANDRILL_KEY` environment variable - you'll need to get that from our Mandrill instance
or from Dan or Laura. It's a test key, so no emails will go out. Huzzah.

## Database stuff
Once the DB is started, you should run

```
DB_HOST=127.0.0.1 DB_USER=nerdnite_bosses DB_PASS=nerdnite npm run-script init-db
```

to set up the database.

There is an SQL file in `./sql` as well as an ERD diagram that you can open with the MySQL Workbench
to see how it all fits together.

## Testing

You can run tests with

```
DB_HOST=127.0.0.1 DB_USER=nerdnite_bosses DB_PASS=nerdnite MANDRILL_KEY=xxx npm test
```

This confirms that creating bosses and aliases is well behaved.

## Logging into the NN server
# I know this is ugly, but content first, then prettification!
# Logging into the NN server requires a secure key and a connection client. These instructions assume the use of PuTTY, a popular (and free!) client

Generating an SSH key.
Converting an SSH key to PuTTY format for use with Windows
Download puttygen.exe from PuTTY download page (http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html)
Open PuTTY Key Generator (puttygen.exe) and 
Open Conversations
Import your ssh key and convert your private ssh key to a ppk key
Now open puTTY configuration:
Under session:
	Host Name is nerdnite.com
	Port is 22
	Connection type is SSH
Under Connection | SSH | Auth | Authentication parameters, Browse to the newly created PPK private key
Open the connection and enter your login and key passphrase


How to use nerdnite-tools
Once you're logged into nerdnite.com, log in as su with "su - nerdnite"
Then go to /home/nerdnite-tools
You can run any of the scripts, which will generate a timedated .sh file in the nerdnight-tools files
The contents of the file are WP CLI commands.  You can run these individually or as a script from the /var/www/html directory.

Then use the WP CI to do things.

Examples:
Adding a Boss
1. Build the WP CLI commands by running addBoss.js
2. Open the generated <datetime>.updates.sh
3. run those commands in the WP directory (/var/wwww/html)

get into the WP database
$ wp db cli  --path=/var/www/html
> connect;

View all tables in MySQL database
show tables;

get into the other database
from $
mysql -u $DB_USER -h $DB_HOST -p
pass is lTeROPeCtopH (also $DB_PASS)

show databases;
connect newnite_bosses
show tables;

wp cli update user pass

see the ERD for more information


after adding new sites have to do this to add them to the SSL cert
REFRESH CERT for NEW CITIES
Gotta be logged in as root ("sudo su -")

# update cli.ini with the newly added cities
cd ~/letsencrypt
cat cli.ini.base > cli.ini
echo domains = `sudo -u nerdnite wp db query --path=/var/www/html 'SELECT domain FROM wp_blogs WHERE public=1 AND deleted=0;' | grep -v domain | xargs |  sed -e 's/ /, /g'` >> cli.ini
./letsencrypt-auto certonly -c cli.ini

# restart the web server
apachectl restart

To set up their emails, regenerate
	run the postfix update script in nerdnite tools (as nerdnite) 
	sudo -E ./updatePostfix.sh /etc/postfix/virtual (-E keeps the enviroment variables, including the required database connection info)
	verify that the new virtual.db map (in /etc/postfix) includes the newly added emails

Update WP user password
wp user update <username> --user_pass=<new_password>

Info for phpList
https://nerdnite.com/lists/admin/

How to set up gmail to send from your @nerdnite.com addresss
    Gmail settings, Accounts and Import tab.
    Add another email address you own (in this case, your NN email)
    Type name and email address to be added. Untick treat as an alias.
    For SMTP Server, put smtp.gmail.com
    For Username, your full Gmail address including @gmail.com
    For password, provide an App Password generated in Google Accounts at https://security.google.com/settings/security/apppasswords
    Leave Secured connection using TLS selected as is.
    Add Account





