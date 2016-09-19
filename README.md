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

This confirms that crea1. ting bosses and aliases is well behaved.

## Logging into the NN server
### Logging into the NN server requires a secure key and a connection client. These instructions assume the use of PuTTY, a popular (and free!) client

1. Generating an SSH key.
2. Converting an SSH key to PuTTY format for use with Windows
   * Download puttygen.exe from PuTTY download page (http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html)
   * Open PuTTY Key Generator (puttygen.exe) and 
   * Open Conversations
   * Import your ssh key and convert your private ssh key to a ppk key
   * Now open puTTY configuration:
   * Under session:
     ** Host Name is nerdnite.com
     ** Port is 22
     ** Connection type is SSH
   * Under Connection | SSH | Auth | Authentication parameters, Browse to the newly created PPK private key
   * Open the connection and enter your login and key passphrase

## How to use nerdnite-tools
1. Once you're logged into nerdnite.com, log in as su with 

```
su - nerdnite
```

2. Then go to /home/nerdnite-tools
3. You can run any of the scripts, which will generate a timedated .sh file in the nerdnight-tools files
4. The contents of the file are WP CLI commands.  You can run these individually or as a script from the /var/www/html directory.

Then use the WP CI to do things.

Examples:
Adding a Boss
1. Build the WP CLI commands by running addBoss.js
2. Open the generated <datetime>.updates.sh
3. run those commands in the WP directory (/var/wwww/html)

## Get into the WP database
```
wp db cli  --path=/var/www/html
```
Once at the SQL quote, connect to the database with 
```
connect;
```

TODO: mini SQL primer
To view all tables in MySQL database
show tables;
show databases;
connect newnite_bosses
show tables;


## Get into the nerdnite_bosses database
```
mysql -u $DB_USER -h $DB_HOST -p
```
pass is lTeROPeCtopH (also $DB_PASS)

see the ERD for more information

## Refresh SSL certification after new cities are added
1. Must be logged in as root ("sudo su -")
2. update cli.ini with the newly added cities
```
cd ~/letsencrypt
cat cli.ini.base > cli.ini
echo domains = `sudo -u nerdnite wp db query --path=/var/www/html 'SELECT domain FROM wp_blogs WHERE public=1 AND deleted=0;' | grep -v domain | xargs |  sed -e 's/ /, /g'` >> cli.ini
./letsencrypt-auto certonly -c cli.ini
```

## To restart the web server
apachectl restart

## To set up new emails, regenerate
```
	run the postfix update script in nerdnite tools (as nerdnite) 
	sudo -E ./updatePostfix.sh /etc/postfix/virtual (-E keeps the enviroment variables, including the required database connection info)
```
	verify that the new virtual.db map (in /etc/postfix) includes the newly added emails

## Update WP user password
wp user update <username> --user_pass=<new_password>

Info for phpList
https://nerdnite.com/lists/admin/

## To set up gmail to send from your @nerdnite.com addresss
1. Gmail settings, Accounts and Import tab.
2. Add another email address you own (in this case, your NN email)
3. Type name and email address to be added. Untick treat as an alias.
4. For SMTP Server, put smtp.gmail.com
5. For Username, your full Gmail address including @gmail.com
6. For password, provide an App Password generated in Google Accounts at https://security.google.com/settings/security/apppasswords
7. Leave Secured connection using TLS selected as is.
8. Add Account





