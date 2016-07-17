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
DB_HOST=127.0.0.1 DB_USER=nerdnite DB_PASS=nerdnite npm run-script init-db
```

to set up the database.

There is an SQL file in `./sql` as well as an ERD diagram that you can open with the MySQL Workbench
to see how it all fits together.

## Testing

You can run tests with

```
DB_HOST=127.0.0.1 DB_USER=nerdnite DB_PASS=nerdnite MANDRILL_KEY=xxx npm test
```

This confirms that creating bosses and aliases is well behaved.

